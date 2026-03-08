import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Team chat API — persistent messages in KV, realtime via Ably
const TEAM_CHAT_KEY = 'team:chat:supertime';
const MAX_MESSAGES = 200;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { id, message, from, fromEmail, to } = await req.json();

    if (!message || !from) {
      return NextResponse.json({ error: 'Missing message or from' }, { status: 400 });
    }

    const newMessage = {
      id: id || Math.random().toString(36).slice(2),
      from,
      fromEmail: fromEmail || '',
      text: message,
      timestamp: Date.now()
    };

    // Determine target key and channel
    let chatKey = TEAM_CHAT_KEY;
    let channelName = 'team:supertime';

    if (to) {
      // Deterministic key for DMs: dm:chat:user1:user2 (sorted)
      const participants = [from.toLowerCase(), to.toLowerCase()].sort();
      chatKey = `chat:dm:${participants.join(':')}`;
      channelName = `dm:${participants.join(':')}`;
    }

    const existing = await kv.get<any[]>(chatKey) || [];
    const updated = [...existing.slice(-(MAX_MESSAGES - 1)), newMessage];

    await kv.set(chatKey, updated, { ex: TTL_SECONDS });

    // Publish to Ably for real-time delivery
    try {
      const apiKey = process.env.ABLY_API_KEY;
      if (apiKey) {
        const ably = new (await import('ably')).Rest(apiKey);
        const channel = ably.channels.get(channelName);
        await channel.publish('message', newMessage);
      }
    } catch (e) {
      console.error('[Chat API] Ably publish failed:', e);
    }

    return NextResponse.json({ success: true, messageId: newMessage.id });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get('since') || '0');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Determine target key
    let chatKey = TEAM_CHAT_KEY;
    if (from && to) {
      const participants = [from.toLowerCase(), to.toLowerCase()].sort();
      chatKey = `chat:dm:${participants.join(':')}`;
    }

    const messages = await kv.get<any[]>(chatKey) || [];
    const filtered = since ? messages.filter(m => m.timestamp > since) : messages;

    return NextResponse.json({ messages: filtered });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}
