import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const TEAM_CHAT_KEY = 'team:chat:supertime';
const MAX_MESSAGES = 200;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { message, secret } = await req.json();

    // Security: Simple secret check (can be expanded later)
    const BOT_SECRET = process.env.BOT_SECRET || 'supertime_dev_bot';
    if (process.env.NODE_ENV === 'production' && secret !== BOT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const newMessage = {
      id: `bot-${Math.random().toString(36).slice(2)}`,
      from: 'Supertime AI',
      fromEmail: 'bot@supertime.wtf',
      text: message,
      timestamp: Date.now()
    };

    // 1. Persist to KV
    const existing = await kv.get<any[]>(TEAM_CHAT_KEY) || [];
    const updated = [...existing.slice(-(MAX_MESSAGES - 1)), newMessage];
    await kv.set(TEAM_CHAT_KEY, updated, { ex: TTL_SECONDS });

    // 2. Publish to Ably
    try {
      const apiKey = process.env.ABLY_API_KEY;
      if (apiKey) {
        const ably = new (await import('ably')).Rest(apiKey);
        const channel = ably.channels.get('team:supertime');
        await channel.publish('message', newMessage);
      }
    } catch (e) {
      console.error('[Bot API] Ably publish failed:', e);
    }

    return NextResponse.json({ success: true, messageId: newMessage.id });
  } catch (error) {
    console.error('[Bot API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
