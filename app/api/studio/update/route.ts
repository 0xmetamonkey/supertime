import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const emailAddr = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !emailAddr) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = emailAddr.toLowerCase();
  const requestData = await req.json();
  const { socials, videoRate, audioRate, isLive, isAcceptingCalls, templates, availability, artifact, roomType, isRoomFree, mode, faqs, upiId, displayName, videoProvider, bio, subscriptionPrice, subscriptionBenefits } = requestData;

  try {
    if (process.env.KV_URL) {
      if (displayName !== undefined) await kv.set(`user:${email}:displayName`, displayName);
      if (mode !== undefined) await kv.set(`user:${email}:mode`, mode);
      if (socials) await kv.set(`user:${email}:socials`, socials);
      if (videoRate !== undefined) await kv.set(`user:${email}:rate:video`, videoRate);
      if (audioRate !== undefined) await kv.set(`user:${email}:rate:audio`, audioRate);
      if (requestData.profileImage) await kv.set(`user:${email}:profileImage`, requestData.profileImage);
      if (requestData.coverImage) await kv.set(`user:${email}:coverImage`, requestData.coverImage);
      if (isLive !== undefined) await kv.set(`user:${email}:isLive`, isLive);
      if (isAcceptingCalls !== undefined) await kv.set(`user:${email}:isAcceptingCalls`, isAcceptingCalls);
      if (roomType !== undefined) await kv.set(`user:${email}:roomType`, roomType);
      if (isRoomFree !== undefined) await kv.set(`user:${email}:isRoomFree`, isRoomFree);
      if (templates !== undefined) await kv.set(`user:${email}:templates`, templates);
      if (availability !== undefined) await kv.set(`user:${email}:availability`, availability);
      if (faqs !== undefined) await kv.set(`user:${email}:faqs`, faqs);
      if (upiId !== undefined) await kv.set(`user:${email}:upiId`, upiId);
      if (videoProvider !== undefined) await kv.set(`user:${email}:videoProvider`, videoProvider);
      if (requestData.artifacts !== undefined) await kv.set(`user:${email}:artifacts`, requestData.artifacts);
      if (bio !== undefined) await kv.set(`user:${email}:bio`, bio);
      if (subscriptionPrice !== undefined) await kv.set(`user:${email}:subscriptionPrice`, subscriptionPrice);
      if (subscriptionBenefits !== undefined) await kv.set(`user:${email}:subscriptionBenefits`, subscriptionBenefits);

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
