import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import StudioWrapper from "./StudioWrapper";
import { resolveUsername } from "../actions";

export const dynamic = 'force-dynamic';

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const isSimulated = params.sim === 'true';

  const { userId, sessionClaims } = await auth();
  const email = (sessionClaims as { email?: string } | undefined)?.email?.toLowerCase(); // Normalize email

  // Fallback in case Clerk claim is lagging
  let resolvedEmail = email;
  if (userId && !resolvedEmail) {
    try {
      const user = await currentUser();
      resolvedEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    } catch (e) {
      console.error("[Studio Page] Clerk currentUser fallback failed:", e);
    }
  }

  if (!resolvedEmail && !isSimulated) return redirect("/");

  const username = resolvedEmail ? await resolveUsername(resolvedEmail) : null;

  // if (!username) return redirect("/"); // Allow callers to enter Studio

  interface StudioSettings {
    videoRate: number;
    audioRate: number;
    socials: { instagram: string; x: string; youtube: string; website: string; twitter?: string };
    profileImage: string;
    isLive: boolean;
    templates: Array<Record<string, unknown>>;
    availability: Record<string, unknown>;
    artifacts: Array<Record<string, unknown>>;
    upiId?: string;
    isAcceptingCalls?: boolean;
    roomType?: string;
    isRoomFree?: boolean;
    mode?: string;
  }

  // Fetch Settings (if creator)
  const settings: StudioSettings = {
    videoRate: 100,
    audioRate: 50,
    socials: { instagram: '', x: '', youtube: '', website: '' },
    profileImage: '',
    isLive: false,
    templates: [],
    availability: {},
    artifacts: [],
  };

  if (resolvedEmail && process.env.KV_URL) {
    const vRate = await kv.get(`user:${resolvedEmail}:rate:video`);
    const aRate = await kv.get(`user:${resolvedEmail}:rate:audio`);
    const socials = await kv.get(`user:${resolvedEmail}:socials`) as Record<string, string> | null;
    const profileImage = await kv.get(`user:${resolvedEmail}:profileImage`) as string | null;
    const isLive = await kv.get(`user:${resolvedEmail}:isLive`);
    const roomType = await kv.get(`user:${resolvedEmail}:roomType`) as string | null;
    const isRoomFree = await kv.get(`user:${resolvedEmail}:isRoomFree`);
    const templates = await kv.get(`user:${resolvedEmail}:templates`) as Array<Record<string, unknown>> | null;
    const availability = await kv.get(`user:${resolvedEmail}:availability`) as Record<string, unknown> | null;
    const artifacts = await kv.get(`user:${resolvedEmail}:artifacts`) as Array<Record<string, unknown>> | null || [];
    const mode = await kv.get(`user:${resolvedEmail}:mode`) as string | null || 'solitude';
    const isAcceptingCalls = await kv.get(`user:${resolvedEmail}:isAcceptingCalls`);
    const upiId = await kv.get(`user:${resolvedEmail}:upiId`) as string | null;

    if (vRate !== null) settings.videoRate = Number(vRate);
    if (aRate !== null) settings.audioRate = Number(aRate);
    if (upiId) settings.upiId = upiId;
    if (socials) {
      // Normalize twitter to x
      if (socials.twitter && !socials.x) {
        socials.x = socials.twitter;
        delete socials.twitter;
      }
      settings.socials = { ...settings.socials, ...socials };
    }
    if (profileImage) settings.profileImage = profileImage;
    // We ALWAYS want to start as "not live" (not broadcasting) on refresh
    settings.isLive = false;
    if (isLive !== null) {
      // Still persist it for future use but start current session as offline
      // Or just ignore it for the initial state
    }
    if (isAcceptingCalls === null) settings.isAcceptingCalls = true;
    else settings.isAcceptingCalls = !!isAcceptingCalls;

    if (roomType) settings.roomType = roomType;
    if (isRoomFree !== null) settings.isRoomFree = !!isRoomFree;
    if (templates) settings.templates = templates;
    if (availability) settings.availability = availability;
    if (artifacts) settings.artifacts = artifacts;
    settings.mode = mode;
  }

  return (
    <StudioWrapper
      username={username || null}
      session={userId ? { user: { id: userId, email: email } } : null}
      initialSettings={settings}
    />
  );
}
