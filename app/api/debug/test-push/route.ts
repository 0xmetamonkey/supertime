import { NextRequest, NextResponse } from 'next/server';
import { messaging } from '@/app/lib/firebase-admin';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const fcmToken = await kv.get(`user:${username.toLowerCase()}:fcm_token`);
    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: `No token found for user ${username}` }, { status: 404 });
    }

    const response = await messaging.send({
      token: fcmToken,
      notification: {
        title: "Test Notification",
        body: "If you see this, push notifications are working!",
      },
      data: {
        action: 'test-push',
        timestamp: Date.now().toString()
      }
    });

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('[Debug API] Test push failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
