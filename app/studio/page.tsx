import { auth } from "../../auth";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import StudioClient from "./StudioClient";
import { resolveUsername } from "../actions";

export default async function StudioPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return redirect("/");

  const username = await resolveUsername(email);

  if (!username) return redirect("/"); // Artist needs to claim a username first

  // Fetch Settings
  let settings = {
    videoRate: 100,
    audioRate: 50,
    socials: { instagram: '', twitter: '', youtube: '', website: '' },
    profileImage: ''
  };

  if (process.env.KV_URL) {
    const vRate = await kv.get(`user:${email}:rate:video`);
    const aRate = await kv.get(`user:${email}:rate:audio`);
    const socials = await kv.get(`user:${email}:socials`);
    const profileImage = await kv.get(`user:${email}:profileImage`);

    if (vRate !== null) settings.videoRate = Number(vRate);
    if (aRate !== null) settings.audioRate = Number(aRate);
    if (socials) settings.socials = socials as any;
    if (profileImage) (settings as any).profileImage = profileImage;
  }

  return <StudioClient username={username} session={session} initialSettings={settings} />;
}
