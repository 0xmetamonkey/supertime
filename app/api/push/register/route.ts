import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  try {
    const { token, username } = await req.json();

    if (!token || !username) {
      return NextResponse.json({ error: 'Missing token or username' }, { status: 400 });
    }

    // Save FCM token to KV associated with the username
    await kv.set(`fcm_token:${username.toLowerCase()}`, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push Register API] Error:', error);
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
  }
}
