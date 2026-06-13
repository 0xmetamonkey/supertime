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
  let email = (sessionClaims as any)?.email?.toLowerCase(); // Normalize email

  // Fallback in case Clerk claim is lagging
  if (userId && !email) {
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    } catch (e) {
      console.error("[Studio Page] Clerk currentUser fallback failed:", e);
    }
  }

  if (!email && !isSimulated) return redirect("/");

  const username = email ? await resolveUsername(email) : null;

  // if (!username) return redirect("/"); // Allow callers to enter Studio

  // Fetch Settings (if creator)
  let settings = {
    videoRate: 100,
    audioRate: 50,
    socials: { instagram: '', x: '', youtube: '', website: '' },
    profileImage: '',
    isLive: false,
    templates: [] as any[],
    availability: {} as any,
    artifacts: [] as any[],
  };

  if (email && process.env.KV_URL) {
    const vRate = await kv.get(`user:${email}:rate:video`);
    const aRate = await kv.get(`user:${email}:rate:audio`);
    const socials = await kv.get(`user:${email}:socials`) as any;
    const profileImage = await kv.get(`user:${email}:profileImage`);
    const isLive = await kv.get(`user:${email}:isLive`);
    const roomType = await kv.get(`user:${email}:roomType`);
    const isRoomFree = await kv.get(`user:${email}:isRoomFree`);
    const templates = await kv.get(`user:${email}:templates`) as any[];
    const availability = await kv.get(`user:${email}:availability`);
    const artifacts = await kv.get(`user:${email}:artifacts`) as any[] || [];
    const mode = await kv.get(`user:${email}:mode`) || 'solitude';
    const isAcceptingCalls = await kv.get(`user:${email}:isAcceptingCalls`);
    const upiId = await kv.get(`user:${email}:upiId`);

    if (vRate !== null) settings.videoRate = Number(vRate);
    if (aRate !== null) settings.audioRate = Number(aRate);
    if (upiId) (settings as any).upiId = upiId as string;
    if (socials) {
      // Normalize twitter to x
      if (socials.twitter && !socials.x) {
        socials.x = socials.twitter;
        delete socials.twitter;
      }
      settings.socials = { ...settings.socials, ...socials };
    }
    if (profileImage) (settings as any).profileImage = profileImage;
    // We ALWAYS want to start as "not live" (not broadcasting) on refresh
    settings.isLive = false;
    if (isLive !== null) {
      // Still persist it for future use but start current session as offline
      // Or just ignore it for the initial state
    }
    if (isAcceptingCalls === null) (settings as any).isAcceptingCalls = true;
    else (settings as any).isAcceptingCalls = !!isAcceptingCalls;

    if (roomType) (settings as any).roomType = roomType;
    if (isRoomFree !== null) (settings as any).isRoomFree = !!isRoomFree;
    if (templates) settings.templates = templates;
    if (availability) settings.availability = availability;
    if (artifacts) settings.artifacts = artifacts;
    (settings as any).mode = mode;
  }

  return (
    <StudioWrapper
      username={username || null}
      session={userId ? { user: { id: userId, email: email } } : null}
      initialSettings={settings}
    />
  );
}
