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
declare global {
  var mockWalletStore: Map<string, number>;
}
if (!global.mockWalletStore) {
  global.mockWalletStore = new Map();
}

async function getUserBalance(email: string): Promise<number> {
  if (process.env.KV_URL) {
    return (await kv.get<number>(`balance:${email}`)) ?? 0;
  }
  return global.mockWalletStore.get(email) ?? 0;
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
    const paramUid = searchParams.get('uid');
    if (paramUid && paramUid.startsWith('guest-')) {
      uid = paramUid;
    } else {
      return NextResponse.json({ error: 'Unauthorized. Login or use valid guest ID.' }, { status: 401 });
    }
  }

  // Convert string UID to integer for better compatibility (Hash)
  const uidInt = Math.abs(uid.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0)) % 2147483647;

  // 1. Check Balance (Enforce Pay-to-Talk)
  // SKIP balance check if the person joining is the OWNER of this channel
  let isOwner = false;
  try {
    const ownerName = channelName.replace('channel-', '');
    const email = session?.user?.email?.toLowerCase()?.trim();
    if (email) {
      const actualOwner = await kv.get(`owner:${ownerName}`);
      if (actualOwner === email) {
        isOwner = true;
        console.log(`Debug: ${email} is owner of ${channelName}, skipping balance check.`);
      }
    }
  } catch (e) { console.error("Owner check fail", e); }

  if (session?.user?.email && !isOwner) {
    const email = session.user.email.toLowerCase();
    const balance = await getUserBalance(email);
    console.log(`Debug: Balance for ${email} is ${balance}`);

    if (balance < 1) { // Changed to 1 token min for easier testing
      console.error("Insufficient funds to start call");
      return NextResponse.json({ error: 'Insufficient funds. Please recharge.' }, { status: 402 });
    }
  }

  try {
    const { appId, appCertificate } = getAgoraCredentials();

    if (!appCertificate) {
      console.log("App ID Only Mode: Returning null token");
      return NextResponse.json({ token: null, uid: uidInt });
    }

    const role = RtcRole.PUBLISHER;
    const tokenExpirationInSeconds = 3600;
    const privilegeExpirationInSeconds = 3600;

    console.log("🔑 Token Generation:", {
      appIdFirst5: appId.substring(0, 5),
      channelName,
      originalUid: uid,
      uidInt,
      isOwner
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

    return NextResponse.json({
      token,
      uid: uidInt,
      appId: appId // Send App ID so client can verify it and use if baked-in one is stale
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
