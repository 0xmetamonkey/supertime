import { auth, currentUser } from "@clerk/nextjs/server";
import CreatorWrapper from "./CreatorWrapper";
import { kv } from "@vercel/kv";
import { Metadata } from 'next';
import { trackEvent } from "../lib/analytics";
import { resolveUsername, getCachedCreatorProfileData } from "../actions";
import { revalidateTag } from "next/cache";

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
  if (['privacy', 'terms', 'api', 'dashboard', 'studio'].includes(username)) {
    const { notFound } = await import('next/navigation');
    return notFound();
  }

  const { userId, sessionClaims } = await auth();
  let email = (sessionClaims as any)?.email?.toLowerCase(); // normalize session email

  // Fallback in case Clerk claim is lagging
  if (userId && !email) {
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    } catch (e) {
      console.error("[Creator Profile Page] Clerk currentUser fallback failed:", e);
    }
  }

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
        revalidateTag(`creator-profile-${email}`, "max");
        revalidateTag('featured-creators', "max");
        revalidateTag('all-creators', "max");
      }
    }
  }

  if (email && ownerEmail && ownerEmail.toLowerCase() === email) {
    // This user owns this username
    isOwner = true;
  }

  if (!ownerEmail) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
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

  // Fetch static settings and dynamic state in parallel
  let fundraiser: any = null;
  let isLive = false;
  let isAcceptingCalls = true;
  let staticProfile: any = {};

  if (ownerEmail && process.env.KV_URL) {
    const [liveStatus, acceptingCalls, f, profileData] = await Promise.all([
      kv.get(`user:${ownerEmail}:isLive`),
      kv.get(`user:${ownerEmail}:isAcceptingCalls`),
      kv.get(`fundraise:${username}`),
      getCachedCreatorProfileData(ownerEmail)
    ]);

    isLive = liveStatus === null ? true : !!liveStatus;
    isAcceptingCalls = acceptingCalls === null ? true : !!acceptingCalls;
    if (f && (f as any).isActive) {
      fundraiser = f;
    }
    staticProfile = profileData;

    // Track Profile View (Server-side)
    if (!isOwner) {
      await trackEvent(username, "view");
    }
  }

  const isVerified = staticProfile.isVerified ?? false;
  const socials = { ...(staticProfile.socials || {}) };
  const videoRate = staticProfile.videoRate ?? 100;
  const audioRate = staticProfile.audioRate ?? 50;
  const profileImage = staticProfile.profileImage ?? "";
  const coverImage = staticProfile.coverImage ?? "";
  const templates = staticProfile.templates ?? [];
  const artifacts = staticProfile.artifacts ?? [];
  const faqs = staticProfile.faqs ?? [];
  const bio = staticProfile.bio ?? "";
  const subscriptionPrice = staticProfile.subscriptionPrice ?? 199;
  const subscriptionBenefits = staticProfile.subscriptionBenefits ?? [];
  const roomType = staticProfile.roomType ?? 'audio';
  const isRoomFree = staticProfile.isRoomFree ?? true;
  const studioMode = staticProfile.studioMode ?? 'solitude';

  (socials as any).roomType = roomType;
  (socials as any).isRoomFree = isRoomFree;
  (socials as any).studioMode = studioMode;

  return (
    <CreatorWrapper
      username={username}
      user={userId ? { id: userId, email: email, username: visitorUsername, imageUrl: "" } : null}
      isOwner={isOwner}
      ownerEmail={ownerEmail || ""}
      isVerified={isVerified}
      socials={socials}
      videoRate={videoRate}
      audioRate={audioRate}
      profileImage={profileImage}
      coverImage={coverImage}
      fundraiser={fundraiser}
      isLive={isLive}
      isAcceptingCalls={isAcceptingCalls}
      templates={templates}
      artifacts={artifacts}
      faqs={faqs}
      bio={bio}
      subscriptionPrice={subscriptionPrice}
      subscriptionBenefits={subscriptionBenefits}
      roomType={(socials as any).roomType}
      isRoomFree={(socials as any).isRoomFree}
    />
  );
}
