import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  
  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const roomId = `team-${Math.random().toString(36).slice(2, 10)}`;
    
    // Save to KV so it's valid in production too
    await kv.set(`meeting:${roomId}`, {
      type: 'instant',
      creator: email,
      createdAt: Date.now()
    });

    return NextResponse.json({ 
      success: true, 
      roomId,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://supertime.wtf'}/live/${roomId}`
    });
  } catch (error) {
    console.error("Instant Meeting Error:", error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
