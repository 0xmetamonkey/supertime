import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { kv } from '@vercel/kv';

function getAgoraCredentials() {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
  const appCertificate = process.env.AGORA_APP_CERTIFICATE?.trim();

  console.log("Debug: Checking Credentials...", {
    hasAppId: !!appId,
    hasCertificate: !!appCertificate
  });

  if (!appId) {
    console.error("Error: AGORA_APP_ID not set");
    throw new Error('AGORA_APP_ID not set');
  }
  // Allow missing certificate for App ID Only mode
  if (!appCertificate) {
    console.log("Warning: AGORA_APP_CERTIFICATE not set. Using App ID only mode.");
    return { appId, appCertificate: null };
  }
  return { appId, appCertificate };
}

// Simple in-memory fallback if KV is not configured
const memoryStore = new Map<string, number>();

async function getUserBalance(uid: string): Promise<number> {
  if (process.env.KV_URL) {
    const balance = await kv.get<number>(`balance:${uid}`);
    return balance ?? 0;
  }
  return memoryStore.get(uid) ?? 0;
}

import { auth } from "../../../auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url); // Move this up
  const channelName = searchParams.get('channelName');

  if (!channelName) {
    return NextResponse.json({ error: 'Missing channelName' }, { status: 400 });
  }

  // 1. Determine User ID (Session vs Guest)
  const session = await auth();
  let uid = session?.user?.id;

  if (!uid) {
    // If not logged in, allow "guest" UIDs from params
    const paramUid = searchParams.get('uid');
    if (paramUid && paramUid.startsWith('guest-')) {
      uid = paramUid;
    } else {
      return NextResponse.json({ error: 'Unauthorized. Login or use valid guest ID.' }, { status: 401 });
    }
  }

  // 1. Check Balance
  // In a real app, we check if the user has enough for at least 1 minute (e.g., 10 tokens)
  // We'll skip this check if uid is 'creator' (assuming creator is free or master)
  // Actually, let's just check everyone for now, assuming creator won't call themselves.
  // If the caller is the "fan", we check. We'll rely on the frontend to pass a role, 
  // but for security, we'd check session. Here we just trust the UID for MVP speed.
  // Let's assume UIDs starting with 'user_' are fans.

  // For simplicity, we just generate the token. The deduction loop runs separately.

  try {
    const { appId, appCertificate } = getAgoraCredentials();

    if (!appCertificate) {
      console.log("App ID Only Mode: Returning null token");
      return NextResponse.json({ token: null });
    }

    const role = RtcRole.PUBLISHER;
    const tokenExpirationInSeconds = 3600;
    const privilegeExpirationInSeconds = 3600;

    // Convert string UID to integer for better compatibility
    const uidInt = Math.abs(uid.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0)) % 2147483647; // Keep within 32-bit int range

    console.log("🔑 Token Generation:", {
      appIdLength: appId.length,
      appIdFirst5: appId.substring(0, 5),
      certLength: appCertificate.length,
      channelName,
      originalUid: uid,
      uidInt,
      role,
      tokenExpire: tokenExpirationInSeconds,
      privilegeExpire: privilegeExpirationInSeconds
    });

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uidInt,
      role,
      tokenExpirationInSeconds,
      privilegeExpirationInSeconds
    );

    console.log("✅ Token generated, length:", token.length);

    return NextResponse.json({ token, uid: uidInt });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
