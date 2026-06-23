import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from '@clerk/nextjs/server';
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const emailAddr = user?.emailAddresses?.[0]?.emailAddress;
    
    if (!user || !emailAddr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = emailAddr.toLowerCase();

    // Check if user already has a Mux stream
    const existingStream = await kv.get(`user:${email}:muxStreamData`) as any;
    if (existingStream && existingStream.streamKey) {
      return NextResponse.json(existingStream);
    }

    // Create a new Live Stream in Mux
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public'],
      },
    });

    const streamData = {
      streamId: liveStream.id,
      streamKey: liveStream.stream_key,
      playbackId: liveStream.playback_ids?.[0]?.id,
    };

    // Store the stream data in KV
    if (process.env.KV_URL) {
      await kv.set(`user:${email}:muxStreamData`, streamData);
      await kv.set(`mux:stream:${liveStream.id}:user`, email);
    }

    return NextResponse.json(streamData);
  } catch (error) {
    console.error('Error creating Mux stream:', error);
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}
