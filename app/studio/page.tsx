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
    [key: string]: unknown;
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
    const [
      vRate,
      aRate,
      socials,
      profileImage,
      isLive,
      roomType,
      isRoomFree,
      templates,
      availability,
      artifacts,
      mode,
      isAcceptingCalls,
      upiId
    ] = await kv.mget<[
      number | null,
      number | null,
      Record<string, string> | null,
      string | null,
      boolean | null,
      string | null,
      boolean | null,
      Array<Record<string, unknown>> | null,
      Record<string, unknown> | null,
      Array<Record<string, unknown>> | null,
      string | null,
      boolean | null,
      string | null
    ]>(
      `user:${resolvedEmail}:rate:video`,
      `user:${resolvedEmail}:rate:audio`,
      `user:${resolvedEmail}:socials`,
      `user:${resolvedEmail}:profileImage`,
      `user:${resolvedEmail}:isLive`,
      `user:${resolvedEmail}:roomType`,
      `user:${resolvedEmail}:isRoomFree`,
      `user:${resolvedEmail}:templates`,
      `user:${resolvedEmail}:availability`,
      `user:${resolvedEmail}:artifacts`,
      `user:${resolvedEmail}:mode`,
      `user:${resolvedEmail}:isAcceptingCalls`,
      `user:${resolvedEmail}:upiId`
    );

    if (vRate !== null && vRate !== undefined) settings.videoRate = Number(vRate);
    if (aRate !== null && aRate !== undefined) settings.audioRate = Number(aRate);
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
    if (isLive !== null && isLive !== undefined) {
      // Still persist it for future use but start current session as offline
    }
    if (isAcceptingCalls === null || isAcceptingCalls === undefined) settings.isAcceptingCalls = true;
    else settings.isAcceptingCalls = !!isAcceptingCalls;

    if (roomType) settings.roomType = roomType;
    if (isRoomFree !== null && isRoomFree !== undefined) settings.isRoomFree = !!isRoomFree;
    if (templates) settings.templates = templates;
    if (availability) settings.availability = availability;
    if (artifacts) settings.artifacts = artifacts || [];
    settings.mode = mode || 'solitude';
  }

  return (
    <StudioWrapper
      username={username || null}
      session={userId && email ? { user: { id: userId, email } } : null}
      initialSettings={settings}
    />
  );
}
