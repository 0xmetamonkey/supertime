import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getIdentity, matchesIdentity } from '@/app/lib/identity';

export async function POST(req: NextRequest) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, type = 'free', message = '', duration = 15 } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Missing target recipient "to"' }, { status: 400 });
    }

    const from = identity.usernames[0] || identity.email.split('@')[0];
    const toNormalized = to.toLowerCase();

    const pingPayload = {
      id: 'ping-' + Math.random().toString(36).slice(2),
      type: 'ping',
      pingType: type, // 'free' | 'paid'
      from,
      to: toNormalized,
      message: message || (type === 'paid' ? 'Paid Session Request' : 'Free Session Request'),
      duration,
      timestamp: Date.now(),
    };

    // 1. Send Realtime Notification via Ably
    try {
      const apiKey = process.env.ABLY_API_KEY;
      if (apiKey) {
        const ably = new (await import('ably')).Rest(apiKey);
        const notifyChannel = ably.channels.get(`user:${toNormalized}`);
        await notifyChannel.publish('notification', pingPayload);
      }
    } catch (ablyErr) {
      console.error('[Ping API] Ably error:', ablyErr);
    }

    // 2. Send System Push Notification via Firebase FCM
    try {
      const pushToken = await kv.get(`fcm_token:${toNormalized}`);
      if (pushToken && typeof pushToken === 'string') {
        const { messaging } = await import('@/app/lib/firebase-admin');
        if (messaging) {
          await messaging.send({
            token: pushToken,
            notification: {
              title: `⚡ Ping from @${from}!`,
              body: `${from} requested a ${type.toUpperCase()} session: "${message || 'Ready to talk?'}"`,
            },
            data: {
              type: 'ping',
              from,
              to: toNormalized,
              pingType: type,
            },
          });
        }
      }
    } catch (fcmErr) {
      console.error('[Ping API] FCM push error:', fcmErr);
    }

    return NextResponse.json({ success: true, ping: pingPayload });
  } catch (error: any) {
    console.error('[Ping API] Server Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send ping' }, { status: 500 });
  }
}
