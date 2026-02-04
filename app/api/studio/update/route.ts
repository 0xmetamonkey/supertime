import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth } from "../../../../auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();
  const requestData = await req.json();
  const { socials, videoRate, audioRate, isLive, isAcceptingCalls, templates, availability, artifact, roomType, isRoomFree, mode } = requestData;

  try {
    if (process.env.KV_URL) {
      if (mode !== undefined) await kv.set(`user:${email}:mode`, mode);
      if (socials) await kv.set(`user:${email}:socials`, socials);
      if (videoRate !== undefined) await kv.set(`user:${email}:rate:video`, videoRate);
      if (audioRate !== undefined) await kv.set(`user:${email}:rate:audio`, audioRate);
      if (requestData.profileImage) await kv.set(`user:${email}:profileImage`, requestData.profileImage);
      if (isLive !== undefined) await kv.set(`user:${email}:isLive`, isLive);
      if (isAcceptingCalls !== undefined) await kv.set(`user:${email}:isAcceptingCalls`, isAcceptingCalls);
      if (roomType !== undefined) await kv.set(`user:${email}:roomType`, roomType);
      if (isRoomFree !== undefined) await kv.set(`user:${email}:isRoomFree`, isRoomFree);
      if (templates !== undefined) await kv.set(`user:${email}:templates`, templates);
      if (availability !== undefined) await kv.set(`user:${email}:availability`, availability);

      if (artifact) {
        const existingArtifacts = await kv.get(`user:${email}:artifacts`) as any[] || [];
        const newArtifact = {
          id: Math.random().toString(36).slice(2, 9),
          url: artifact,
          timestamp: Date.now(),
          type: 'video'
        };
        await kv.set(`user:${email}:artifacts`, [newArtifact, ...existingArtifacts]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
