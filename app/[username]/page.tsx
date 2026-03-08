import { currentUser } from "@clerk/nextjs/server";
import CreatorWrapper from "./CreatorWrapper";
import { kv } from "@vercel/kv";
import { Metadata } from 'next';
import { trackEvent } from "../lib/analytics";
import { resolveUsername } from "../actions";

type Props = {
  params: Promise<{ username: string }>
}

export const revalidate = 0; // Always fetch fresh data (fundraiser status, etc.)

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `${username} | Supertime`,
    description: `Talk to ${username} on Supertime. Video & Audio calls.`,
    openGraph: {
      title: `${username} is on Supertime`,
      description: `Book a call with ${username} now.`,
    }
  };
}

export default async function CreatorPage({ params }: Props) {
  const { username: rawUsername } = await params;
  const username = rawUsername.toLowerCase();

  // Guard against hijacking static routes
  if (['privacy', 'api', 'dashboard', 'studio'].includes(username)) {
    const { notFound } = await import('next/navigation');
    return notFound();
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase(); // normalize session email
  const visitorUsername = email ? await resolveUsername(email) : null;

  let isOwner = false;
  let ownerEmail: string | null = null;

  if (process.env.KV_URL) {
    // Check who owns this username
    ownerEmail = await kv.get(`owner:${username}`);

    // AUTO-CLAIM: If username is free and user is logged in but has no name
    if (!ownerEmail && email) {
      const existingName = await kv.get(`user:${email}:username`);
      if (!existingName) {
        await kv.set(`owner:${username}`, email);
        await kv.set(`user:${email}:username`, username);
        ownerEmail = email;
        isOwner = true;
      }
    }
  }

  if (email && ownerEmail && ownerEmail.toLowerCase() === email) {
    // This user owns this username
    isOwner = true;
  }

  // FUNDRAISER TAKEOVER: If creator has an active fundraiser, show it instead of profile
  if (ownerEmail && !isOwner && process.env.KV_URL) {
    const fundraiser: any = await kv.get(`fundraise:${username}`);
    if (fundraiser && fundraiser.isActive) {
      const { redirect } = await import('next/navigation');
      redirect(`/fundraise/${username}`);
    }
  }

  if (!ownerEmail) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-40 -left-20 w-80 h-80 bg-neo-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-neo-pink/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md">
          <div className="w-24 h-24 bg-neo-yellow border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-8 rotate-3">
            <span className="text-4xl">?</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">User not found</h1>
          <p className="text-xl font-bold text-zinc-600 mb-12 uppercase">
            The username <span className="text-neo-pink italic">@{username}</span> is available for you to claim!
          </p>
          <a href="/" className="neo-btn bg-black text-white hover:bg-zinc-800 inline-block px-12 py-6 text-xl">
            Claim it now
          </a>
        </div>
      </div>
    );
  }

  let isVerified = false;
  let socials = {};
  let videoRate = 100;
  let audioRate = 50;
  let profileImage = "";
  let isLive = false;
  let isAcceptingCalls = true;
  let templates: any[] = [];
  let artifacts: any[] = [];
  let faqs: any[] = [];

  if (ownerEmail && process.env.KV_URL) {
    isVerified = !!(await kv.get(`user:${ownerEmail}:verified`));
    socials = (await kv.get(`user:${ownerEmail}:socials`)) || {};

    // Fetch Rates
    const vRate = await kv.get(`user:${ownerEmail}:rate:video`);
    const aRate = await kv.get(`user:${ownerEmail}:rate:audio`);
    const pImage = await kv.get(`user:${ownerEmail}:profileImage`);
    const liveStatus = await kv.get(`user:${ownerEmail}:isLive`);
    const acceptingCalls = await kv.get(`user:${ownerEmail}:isAcceptingCalls`);
    console.log('[CreatorPage] Debug:', { username, ownerEmail, acceptingCalls });
    const roomType = await kv.get(`user:${ownerEmail}:roomType`);
    const isRoomFree = await kv.get(`user:${ownerEmail}:isRoomFree`);
    const studioMode = await kv.get(`user:${ownerEmail}:mode`) || 'solitude';
    const tpls = await kv.get(`user:${ownerEmail}:templates`) as any[];
    const arts = await kv.get(`user:${ownerEmail}:artifacts`) as any[];
    const fqs = await kv.get(`user:${ownerEmail}:faqs`) as any[];
    if (vRate !== null) videoRate = Number(vRate);
    if (aRate !== null) audioRate = Number(aRate);
    if (pImage) profileImage = String(pImage);
    if (liveStatus === null) isLive = true; // Default to LIVE
    else isLive = !!liveStatus;
    if (acceptingCalls === null) isAcceptingCalls = true; // Default to true
    else isAcceptingCalls = !!acceptingCalls;
    if (tpls) templates = tpls;
    if (arts) artifacts = arts;
    if (fqs) faqs = fqs;
    (socials as any).roomType = roomType || 'audio';
    (socials as any).isRoomFree = isRoomFree === null ? true : !!isRoomFree;
    (socials as any).studioMode = studioMode;

    // Track Profile View (Server-side)
    if (!isOwner) {
      await trackEvent(username, "view");
    }
  }

  return (
    <CreatorWrapper
      username={username}
      user={user ? { id: user.id, email: email, username: visitorUsername, imageUrl: user.imageUrl } : null}
      isOwner={isOwner}
      ownerEmail={ownerEmail || ""}
      isVerified={isVerified}
      socials={socials}
      videoRate={videoRate}
      audioRate={audioRate}
      profileImage={profileImage}
      isLive={isLive}
      isAcceptingCalls={isAcceptingCalls}
      templates={templates}
      artifacts={artifacts}
      faqs={faqs}
      roomType={(socials as any).roomType}
      isRoomFree={(socials as any).isRoomFree}
    />
  );
}
