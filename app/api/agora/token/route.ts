import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { currentUser } from "@clerk/nextjs/server";
import { kv } from '@vercel/kv';

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

  if (!channelName) {
    return NextResponse.json({ error: 'Missing channelName' }, { status: 400 });
  }

  // TalkTime sessions (prefixed with "talktime-") do not require Clerk authentication
  // because guests can join anonymously.
  const isTalkTime = channelName.startsWith('talktime-');

  let email = '';
  if (!isTalkTime) {
    // Authentication required for non-TalkTime calls
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (!user || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    email = userEmail;
  }

  // --- CHANNEL OWNERSHIP CHECK ---
  // For scheduled 1:1 sessions (channel names prefixed with "session-"),
  // verify the requester is either the creator or the buyer of that meeting.
  // Broadcast channels are open to any authenticated user.
  if (channelName.startsWith('session-')) {
    const meeting = await kv.get<{
      creator: string;
      creatorEmail?: string;
      buyer: string;
    }>(`meeting:${channelName}`);

    if (meeting) {
      const isCreator = meeting.creatorEmail
        ? email === meeting.creatorEmail.toLowerCase()
        : email.includes(meeting.creator.toLowerCase()); // fallback: username match
      const isBuyer = email === meeting.buyer.toLowerCase();

      if (!isCreator && !isBuyer) {
        console.warn(`[TOKEN API] Unauthorized channel access attempt: ${email} → ${channelName}`);
        return NextResponse.json({ error: 'Forbidden: not a participant in this session' }, { status: 403 });
      }
    }
    // If no meeting record found, the channel is new/unregistered — allow it
    // (handles edge case of token being requested before booking is fully committed)
  }

  // Hash string UIDs to numbers, or use numeric UIDs directly
  const uid = typeof rawUid === 'string' && isNaN(Number(rawUid))
    ? hashUID(rawUid)
    : Number(rawUid);

  const role = RtcRole.PUBLISHER; // Everyone can publish in this 1:1 setup
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    console.log('[TOKEN API] Generating token for:', { channelName, uid, rawUid, email });

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
