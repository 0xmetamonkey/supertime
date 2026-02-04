import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Simple API-based chat for broadcast rooms
// Messages are stored in KV with TTL and polled by clients

export async function POST(req: NextRequest) {
  try {
    const { channelName, message, from, isTip, tipAmount } = await req.json();

    if (!channelName || !message) {
      return NextResponse.json({ error: 'Missing channelName or message' }, { status: 400 });
    }

    const chatKey = `broadcast:chat:${channelName}`;

    // Create message object
    const newMessage = {
      id: Math.random().toString(36).slice(2),
      from: from || 'Anonymous',
      text: message,
      isTip: isTip || false,
      tipAmount: tipAmount || 0,
      timestamp: Date.now()
    };

    // Get existing messages (last 50)
    const existing = await kv.get<any[]>(chatKey) || [];
    const updated = [...existing.slice(-49), newMessage]; // Keep last 50

    // Store with 1 hour TTL
    await kv.set(chatKey, updated, { ex: 3600 });

    return NextResponse.json({ success: true, messageId: newMessage.id });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const channelName = req.nextUrl.searchParams.get('channelName');
    const since = parseInt(req.nextUrl.searchParams.get('since') || '0');

    if (!channelName) {
      return NextResponse.json({ error: 'Missing channelName' }, { status: 400 });
    }

    const chatKey = `broadcast:chat:${channelName}`;
    const messages = await kv.get<any[]>(chatKey) || [];

    // Filter messages newer than 'since' timestamp
    const newMessages = since ? messages.filter(m => m.timestamp > since) : messages;

    return NextResponse.json({ messages: newMessages });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}
