import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import { resolveUsername } from "../actions";
import { getDetailedWallet } from "../lib/economics";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();
  const claimEmail = (sessionClaims as { email?: string } | undefined)?.email?.toLowerCase();

  // Fallback in case Clerk claim is lagging
  let email = claimEmail;
  if (userId && !email) {
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    } catch (e) {
      console.error("[Dashboard Page] Clerk currentUser fallback failed:", e);
    }
  }

  if (!userId || !email) {
    redirect("/"); // Not logged in? Go home.
  }

  // 1. Resolve Username & Role
  const username = await resolveUsername(email);
  let role = null;
  
  if (process.env.KV_URL) {
    role = await kv.get<string>(`user:${email}:role`);
    
    // GRANDFATHERING: If they already claimed a username in the past but have no role, default them to 'creator'
    if (username && !role) {
      role = 'creator';
      await kv.set(`user:${email}:role`, role);
      console.log(`[Dashboard] Grandfathered legacy user ${email} as a creator.`);
    }
  }

  // 2. Fetch Wallet Stats
  const { balance, withdrawable } = await getDetailedWallet(email);

  interface DashboardSettings {
    videoRate: number;
    audioRate: number;
    socials: { instagram: string; x: string; youtube: string; website: string; twitter?: string };
    profileImage: string;
    coverImage: string;
    templates: Array<Record<string, unknown>>;
    faqs: Array<Record<string, unknown>>;
    products: Array<Record<string, unknown>>;
    roomType: 'audio' | 'video';
    isRoomFree: boolean;
    videoProvider: string;
    isGoogleConnected: boolean;
    isZoomConnected: boolean;
    bio: string;
    subscriptionPrice: number;
    subscriptionBenefits: string[];
    displayName?: string;
  }

  // 3. Fetch Settings for embedded Settings tab
  const initialSettings: DashboardSettings = {
    videoRate: 100,
    audioRate: 50,
    socials: { instagram: '', x: '', youtube: '', website: '' },
    profileImage: '',
    coverImage: '',
    templates: [],
    faqs: [],
    products: [],
    roomType: 'audio',
    isRoomFree: true,
    videoProvider: 'supercalls',
    isGoogleConnected: false,
    isZoomConnected: false,
    bio: '',
    subscriptionPrice: 199,
    subscriptionBenefits: ['Member-only posts', 'Behind the scenes', 'Early access to new drops', 'Discounts on sessions', 'Members-only group calls'],
  };

  if (process.env.KV_URL) {
    const vRate = await kv.get(`user:${email}:rate:video`);
    const aRate = await kv.get(`user:${email}:rate:audio`);
    const socials = await kv.get(`user:${email}:socials`) as Record<string, string> | null;
    const profileImage = await kv.get(`user:${email}:profileImage`);
    const coverImage = await kv.get(`user:${email}:coverImage`);
    const roomType = await kv.get(`user:${email}:roomType`);
    const isRoomFree = await kv.get(`user:${email}:isRoomFree`);
    const templates = await kv.get(`user:${email}:templates`) as Array<Record<string, unknown>> | null;
    const faqs = await kv.get(`user:${email}:faqs`) as Array<Record<string, unknown>> | null;
    const displayName = await kv.get(`user:${email}:displayName`) as string | null;
    const videoProvider = await kv.get(`user:${email}:videoProvider`) as string | null;
    const googleTokens = await kv.get(`user:${email}:google_tokens`);
    const zoomTokens = await kv.get(`user:${email}:zoom_tokens`);
    const bio = await kv.get(`user:${email}:bio`) as string | null;
    const subscriptionPrice = await kv.get(`user:${email}:subscriptionPrice`);
    const subscriptionBenefits = await kv.get(`user:${email}:subscriptionBenefits`) as string[] | null;
    const products = username ? await kv.get(`user_products:${username}`) as Array<Record<string, unknown>> | null : null;

    if (vRate !== null) initialSettings.videoRate = Number(vRate);
    if (aRate !== null) initialSettings.audioRate = Number(aRate);
    if (videoProvider) initialSettings.videoProvider = videoProvider;
    initialSettings.isGoogleConnected = !!googleTokens;
    initialSettings.isZoomConnected = !!zoomTokens;
    if (socials) {
      if (socials.twitter && !socials.x) {
        socials.x = socials.twitter;
        delete socials.twitter;
      }
      initialSettings.socials = { ...initialSettings.socials, ...socials };
    }
    if (profileImage) initialSettings.profileImage = String(profileImage);
    if (coverImage) initialSettings.coverImage = String(coverImage);
    if (roomType) initialSettings.roomType = roomType;
    if (isRoomFree !== null) initialSettings.isRoomFree = !!isRoomFree;
    if (templates) initialSettings.templates = templates;
    if (faqs) initialSettings.faqs = faqs;
    if (products) initialSettings.products = products;
    if (displayName) initialSettings.displayName = displayName;
    if (bio) initialSettings.bio = bio;
    if (subscriptionPrice !== null) initialSettings.subscriptionPrice = Number(subscriptionPrice);
    if (subscriptionBenefits) initialSettings.subscriptionBenefits = subscriptionBenefits;
  }

  return (
    <DashboardClient
      session={userId ? { user: { id: userId, email: email } } : null}
      username={username}
      role={role}
      initialBalance={balance}
      initialWithdrawable={withdrawable}
      initialSettings={initialSettings}
    />
  );
}
