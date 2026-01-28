import { auth } from "../../auth";
import CreatorClient from "./CreatorClient";
import { kv } from "@vercel/kv";
import { Metadata } from 'next';

type Props = {
  params: Promise<{ username: string }>
}

export const dynamic = 'force-dynamic';

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
  const session = await auth();
  const email = session?.user?.email?.toLowerCase(); // normalize session email

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

  if (!ownerEmail) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">User not found</h1>
        <p className="text-zinc-500 mb-8">The username <strong>{username}</strong> is available.</p>
        <a href="/" className="bg-white text-black px-6 py-3 rounded-full font-bold">Claim it now</a>
      </div>
    );
  }

  let isVerified = false;
  let socials = {};
  let videoRate = 100;
  let audioRate = 50;
  let profileImage = "";

  if (ownerEmail && process.env.KV_URL) {
    isVerified = !!(await kv.get(`user:${ownerEmail}:verified`));
    socials = (await kv.get(`user:${ownerEmail}:socials`)) || {};

    // Fetch Rates
    const vRate = await kv.get(`user:${ownerEmail}:rate:video`);
    const aRate = await kv.get(`user:${ownerEmail}:rate:audio`);
    const pImage = await kv.get(`user:${ownerEmail}:profileImage`);

    if (vRate !== null) videoRate = Number(vRate);
    if (aRate !== null) audioRate = Number(aRate);
    if (pImage) profileImage = String(pImage);
  }

  return (
    <CreatorClient
      username={username}
      user={session?.user}
      isOwner={isOwner}
      ownerEmail={ownerEmail || ""}
      isVerified={isVerified}
      socials={socials}
      videoRate={videoRate}
      audioRate={audioRate}
      profileImage={profileImage}
    />
  );
}
