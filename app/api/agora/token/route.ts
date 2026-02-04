import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

// Hash UID to ensure consistency with client-side hashing
// This MUST match the hashUID function in CallStage.tsx
const hashUID = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export async function GET(req: NextRequest) {
  const channelName = req.nextUrl.searchParams.get('channelName');
  const rawUid = req.nextUrl.searchParams.get('uid') || '0';

  // Hash string UIDs to numbers, or use numeric UIDs directly
  const uid = typeof rawUid === 'string' && isNaN(Number(rawUid))
    ? hashUID(rawUid)
    : Number(rawUid);

  const role = RtcRole.PUBLISHER; // Everyone can publish in this 1:1 setup
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  if (!channelName) {
    return NextResponse.json({ error: 'Missing channelName' }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    // Log for debugging
    console.log('[TOKEN API] Generating token for:', { channelName, uid, rawUid });

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );
    return NextResponse.json({ token, appId, channelName, uid });
  } catch (error) {
    console.error('[TOKEN API] Error:', error);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
