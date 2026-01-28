import { auth } from "../../auth";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import StudioClient from "./StudioClient";
import { resolveUsername } from "../actions";

export default async function StudioPage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase(); // Normalize email

  if (!email) return redirect("/");

  const username = await resolveUsername(email);

  // if (!username) return redirect("/"); // Allow callers to enter Studio

  // Fetch Settings (if creator)
  let settings = {
    videoRate: 100,
    audioRate: 50,
    socials: { instagram: '', x: '', youtube: '', website: '' },
    profileImage: ''
  };

  if (email && process.env.KV_URL) {
    const vRate = await kv.get(`user:${email}:rate:video`);
    const aRate = await kv.get(`user:${email}:rate:audio`);
    const socials = await kv.get(`user:${email}:socials`) as any;
    const profileImage = await kv.get(`user:${email}:profileImage`);

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
  }

  return <StudioClient username={username || null} session={session} initialSettings={settings} />;
}
