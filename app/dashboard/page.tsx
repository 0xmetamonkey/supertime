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
    isAcceptingCalls?: boolean;
    upiId?: string;
  }

  // 3. Fetch Settings for embedded Settings tab
  const initialSettings: DashboardSettings = {
    videoRate: 100,
    audioRate: 50,
    isAcceptingCalls: true,
    upiId: '',
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
    const [
      vRate,
      aRate,
      socials,
      profileImage,
      coverImage,
      roomType,
      isRoomFree,
      templates,
      faqs,
      displayName,
      videoProvider,
      googleTokens,
      zoomTokens,
      bio,
      subscriptionPrice,
      subscriptionBenefits,
      products,
      isAcceptingCalls,
      upiId
    ] = await kv.mget<[
      number | null,
      number | null,
      Record<string, string> | null,
      string | null,
      string | null,
      'audio' | 'video' | null,
      boolean | null,
      Array<Record<string, unknown>> | null,
      Array<Record<string, unknown>> | null,
      string | null,
      string | null,
      any,
      any,
      string | null,
      number | null,
      string[] | null,
      Array<Record<string, unknown>> | null,
      boolean | null,
      string | null
    ]>(
      `user:${email}:rate:video`,
      `user:${email}:rate:audio`,
      `user:${email}:socials`,
      `user:${email}:profileImage`,
      `user:${email}:coverImage`,
      `user:${email}:roomType`,
      `user:${email}:isRoomFree`,
      `user:${email}:templates`,
      `user:${email}:faqs`,
      `user:${email}:displayName`,
      `user:${email}:videoProvider`,
      `user:${email}:google_tokens`,
      `user:${email}:zoom_tokens`,
      `user:${email}:bio`,
      `user:${email}:subscriptionPrice`,
      `user:${email}:subscriptionBenefits`,
      username ? `user_products:${username}` : `noop`,
      `user:${email}:isAcceptingCalls`,
      `user:${email}:upiId`
    );

    if (vRate !== null && vRate !== undefined) initialSettings.videoRate = Number(vRate);
    if (aRate !== null && aRate !== undefined) initialSettings.audioRate = Number(aRate);
    if (videoProvider) initialSettings.videoProvider = videoProvider;
    initialSettings.isGoogleConnected = !!googleTokens;
    initialSettings.isZoomConnected = !!zoomTokens;
    if (isAcceptingCalls !== null && isAcceptingCalls !== undefined) initialSettings.isAcceptingCalls = !!isAcceptingCalls;
    if (upiId) initialSettings.upiId = String(upiId);
    if (socials) {
      if (socials.twitter && !socials.x) {
        socials.x = socials.twitter;
        delete socials.twitter;
      }
      initialSettings.socials = { ...initialSettings.socials, ...socials };
    }
    if (profileImage) initialSettings.profileImage = String(profileImage);
    if (coverImage) initialSettings.coverImage = String(coverImage);
    if (roomType === 'audio' || roomType === 'video') initialSettings.roomType = roomType;
    if (isRoomFree !== null && isRoomFree !== undefined) initialSettings.isRoomFree = !!isRoomFree;
    if (templates) initialSettings.templates = templates;
    if (faqs) initialSettings.faqs = faqs;
    if (products) initialSettings.products = products;
    if (displayName) initialSettings.displayName = displayName;
    if (bio) initialSettings.bio = bio;
    if (subscriptionPrice !== null && subscriptionPrice !== undefined) initialSettings.subscriptionPrice = Number(subscriptionPrice);
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
