import { currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { resolveUsername } from "../../actions";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  if (!email) return redirect("/");

  const username = email ? await resolveUsername(email) : null;
  if (!username) return redirect("/studio");

  // Fetch all settings from KV
  let settings: any = {
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

    if (vRate !== null) settings.videoRate = Number(vRate);
    if (aRate !== null) settings.audioRate = Number(aRate);
    if (socials) {
      if (socials.twitter && !socials.x) {
        socials.x = socials.twitter;
        delete socials.twitter;
      }
      settings.socials = { ...settings.socials, ...socials };
    }
    if (profileImage) settings.profileImage = String(profileImage);
    if (roomType) settings.roomType = roomType;
    if (isRoomFree !== null) settings.isRoomFree = !!isRoomFree;
    if (templates) settings.templates = templates;
    if (faqs) settings.faqs = faqs;
  }

  return <SettingsClient username={username} initialSettings={settings} />;
}
