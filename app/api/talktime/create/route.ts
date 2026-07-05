import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title || 'TalkTime';

    // Unique room ID
    const roomId = `talktime-${Math.random().toString(36).slice(2, 10)}`;

    // Derive creator username from KV
    const usernameKey = `user:${email.toLowerCase()}:username`;
    const creatorUsername: string = (await kv.get(usernameKey)) as string || email.split('@')[0];

    const sessionData = {
      type: 'talktime',
      creator: email.toLowerCase(),
      creatorUsername,
      title,
      createdAt: Date.now(),
    };

    // Persist with 24h TTL
    await kv.set(`meeting:${roomId}`, sessionData, { ex: 86400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://supertime.wtf';
    const inviteUrl = `${appUrl}/talktime/${roomId}`;
    const hostUrl = `${appUrl}/talktime/${roomId}?host=true&u=${encodeURIComponent(creatorUsername)}`;

    return NextResponse.json({
      success: true,
      roomId,
      inviteUrl,
      hostUrl,
      title,
      creatorUsername,
    });
  } catch (error) {
    console.error('[TalkTime] Create error:', error);
    return NextResponse.json({ error: 'Failed to create TalkTime session' }, { status: 500 });
  }
}
