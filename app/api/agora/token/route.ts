import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function GET(req: NextRequest) {
  const channelName = req.nextUrl.searchParams.get('channelName');
  const uid = req.nextUrl.searchParams.get('uid') || 0; // 0 for random/default
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
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      Number(uid),
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );
    return NextResponse.json({ token, appId, channelName, uid });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
