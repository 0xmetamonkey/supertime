import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import { resolveUsername } from "../actions";
import { getDetailedWallet } from "../lib/economics";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage({ searchParams }: { searchParams: any }) {
  const { userId, sessionClaims } = await auth();
  let email = (sessionClaims as any)?.email?.toLowerCase();

  // Fallback in case Clerk claim is lagging
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

  // 1. Resolve Username
  let username = await resolveUsername(email);

  // Auto-claim username from searchParams if they don't have one yet
  const claimParam = searchParams?.claim;
  if (!username && claimParam) {
    const cleanClaim = claimParam.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanClaim && process.env.KV_URL) {
      try {
        const isTaken = await kv.get(`owner:${cleanClaim}`);
        if (!isTaken) {
          await kv.set(`owner:${cleanClaim}`, email);
          await kv.set(`user:${email}:username`, cleanClaim);
          username = cleanClaim;
          console.log(`[Dashboard] 🎉 Automatically claimed username: @${cleanClaim} for ${email}`);
        }
      } catch (err) {
        console.error("[Dashboard] Auto claim error:", err);
      }
    }
  }

  // 2. Fetch Wallet Stats
  const { balance, withdrawable } = await getDetailedWallet(email);

  // 3. Fetch Settings for embedded Settings tab
  let initialSettings: any = {
    videoRate: 100,
    audioRate: 50,
    socials: { instagram: '', x: '', youtube: '', website: '' },
    profileImage: '',
    templates: [],
    faqs: [],
    roomType: 'audio',
    isRoomFree: true,
  };

  if (process.env.KV_URL) {
    const vRate = await kv.get(`user:${email}:rate:video`);
    const aRate = await kv.get(`user:${email}:rate:audio`);
    const socials = await kv.get(`user:${email}:socials`) as any;
    const profileImage = await kv.get(`user:${email}:profileImage`);
    const roomType = await kv.get(`user:${email}:roomType`);
    const isRoomFree = await kv.get(`user:${email}:isRoomFree`);
    const templates = await kv.get(`user:${email}:templates`) as any[];
    const faqs = await kv.get(`user:${email}:faqs`) as any[];

    if (vRate !== null) initialSettings.videoRate = Number(vRate);
    if (aRate !== null) initialSettings.audioRate = Number(aRate);
    if (socials) {
      if (socials.twitter && !socials.x) {
        socials.x = socials.twitter;
        delete socials.twitter;
      }
      initialSettings.socials = { ...initialSettings.socials, ...socials };
    }
    if (profileImage) initialSettings.profileImage = String(profileImage);
    if (roomType) initialSettings.roomType = roomType;
    if (isRoomFree !== null) initialSettings.isRoomFree = !!isRoomFree;
    if (templates) initialSettings.templates = templates;
    if (faqs) initialSettings.faqs = faqs;
  }

  return (
    <DashboardClient
      session={userId ? { user: { id: userId, email: email } } : null}
      username={username}
      initialBalance={balance}
      initialWithdrawable={withdrawable}
      initialSettings={initialSettings}
    />
  );
}
