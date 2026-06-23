import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('mux-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing Mux Signature' }, { status: 401 });
    }

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Mux sends events like video.live_stream.connected and video.live_stream.disconnected
    const { type, data } = body;
    const streamId = data?.id;

    if (!streamId) {
       return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (type === 'video.live_stream.connected' || type === 'video.live_stream.disconnected') {
      const isLive = type === 'video.live_stream.connected';
      
      // We need to find which user owns this streamId.
      // Since KV doesn't support easy querying by value, we'll need to scan or use a reverse index.
      // For now, let's assume we maintain a reverse index of streamId -> email
      const email = await kv.get(`mux:stream:${streamId}:user`);
      
      if (email) {
        await kv.set(`user:${email}:isLive`, isLive);
      } else {
        console.warn(`No user found for Mux stream ID: ${streamId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mux Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
