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
    const [
      vRate,
      aRate,
      socials,
      profileImage,
      roomType,
      isRoomFree,
      templates,
      faqs,
      videoProvider,
      googleTokens,
      zoomTokens
    ] = await kv.mget<[
      number | null,
      number | null,
      Record<string, string> | null,
      string | null,
      string | null,
      boolean | null,
      Array<Record<string, unknown>> | null,
      Array<Record<string, unknown>> | null,
      string | null,
      any,
      any
    ]>(
      `user:${email}:rate:video`,
      `user:${email}:rate:audio`,
      `user:${email}:socials`,
      `user:${email}:profileImage`,
      `user:${email}:roomType`,
      `user:${email}:isRoomFree`,
      `user:${email}:templates`,
      `user:${email}:faqs`,
      `user:${email}:videoProvider`,
      `user:${email}:google_tokens`,
      `user:${email}:zoom_tokens`
    );

    if (vRate !== null && vRate !== undefined) settings.videoRate = Number(vRate);
    if (aRate !== null && aRate !== undefined) settings.audioRate = Number(aRate);
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
    if (isRoomFree !== null && isRoomFree !== undefined) settings.isRoomFree = !!isRoomFree;
    if (templates) settings.templates = templates;
    if (faqs) settings.faqs = faqs;
  }

  return <SettingsClient username={username} initialSettings={settings} />;
}
