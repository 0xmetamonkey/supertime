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

  interface SettingsData {
    videoRate: number;
    audioRate: number;
    socials: { instagram: string; x: string; youtube: string; website: string; twitter?: string };
    profileImage: string;
    templates: Array<Record<string, unknown>>;
    faqs: Array<Record<string, unknown>>;
    roomType: 'audio' | 'video';
    isRoomFree: boolean;
    videoProvider: string;
    isGoogleConnected: boolean;
    isZoomConnected: boolean;
  }

  // Fetch all settings from KV
  const settings: SettingsData = {
    videoRate: 100,
    audioRate: 50,
    socials: { instagram: '', x: '', youtube: '', website: '' },
    profileImage: '',
    templates: [],
    faqs: [],
    roomType: 'audio',
    isRoomFree: true,
    videoProvider: 'supercalls',
    isGoogleConnected: false,
    isZoomConnected: false,
  };

  if (process.env.KV_URL) {
    const vRate = await kv.get(`user:${email}:rate:video`);
    const aRate = await kv.get(`user:${email}:rate:audio`);
    const socials = await kv.get(`user:${email}:socials`) as Record<string, string> | null;
    const profileImage = await kv.get(`user:${email}:profileImage`);
    const roomType = await kv.get(`user:${email}:roomType`);
    const isRoomFree = await kv.get(`user:${email}:isRoomFree`);
    const templates = await kv.get(`user:${email}:templates`) as Array<Record<string, unknown>> | null;
    const faqs = await kv.get(`user:${email}:faqs`) as Array<Record<string, unknown>> | null;
    const videoProvider = await kv.get(`user:${email}:videoProvider`) as string | null;
    const googleTokens = await kv.get(`user:${email}:google_tokens`);
    const zoomTokens = await kv.get(`user:${email}:zoom_tokens`);

    if (vRate !== null) settings.videoRate = Number(vRate);
    if (aRate !== null) settings.audioRate = Number(aRate);
    if (videoProvider) settings.videoProvider = videoProvider;
    settings.isGoogleConnected = !!googleTokens;
    settings.isZoomConnected = !!zoomTokens;
    if (socials) {
      if (socials.twitter && !socials.x) {
        socials.x = socials.twitter;
        delete socials.twitter;
      }
      settings.socials = { ...settings.socials, ...socials };
    }
    if (profileImage) settings.profileImage = String(profileImage);
    if (roomType === 'audio' || roomType === 'video') settings.roomType = roomType;
    if (isRoomFree !== null) settings.isRoomFree = !!isRoomFree;
    if (templates) settings.templates = templates;
    if (faqs) settings.faqs = faqs;
  }

  return <SettingsClient username={username} initialSettings={settings} />;
}
