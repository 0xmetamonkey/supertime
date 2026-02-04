import { auth } from "../../auth";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import StudioWrapper from "./StudioWrapper";
import { resolveUsername } from "../actions";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const isSimulated = params.sim === 'true';
  const session = await auth().catch(() => null);
  const email = session?.user?.email?.toLowerCase(); // Normalize email

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

    if (vRate !== null) settings.videoRate = Number(vRate);
    if (aRate !== null) settings.audioRate = Number(aRate);
    if (socials) {
      // Normalize twitter to x
      if (socials.twitter && !socials.x) {
        socials.x = socials.twitter;
        delete socials.twitter;
      }
      settings.socials = { ...settings.socials, ...socials };
    }
    if (profileImage) (settings as any).profileImage = profileImage;
    if (isLive === null) settings.isLive = false; // Default to FALSE
    else settings.isLive = !!isLive;
    if (roomType) (settings as any).roomType = roomType;
    if (isRoomFree !== null) (settings as any).isRoomFree = !!isRoomFree;
    if (templates) settings.templates = templates;
    if (availability) settings.availability = availability;
    if (artifacts) settings.artifacts = artifacts;
    (settings as any).mode = mode;
  }

  return <StudioWrapper username={username || null} session={session} initialSettings={settings} />;
}
