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
  const { socials, videoRate, audioRate } = requestData;

  try {
    if (process.env.KV_URL) {
      if (socials) await kv.set(`user:${email}:socials`, socials);
      if (videoRate !== undefined) await kv.set(`user:${email}:rate:video`, videoRate);
      if (audioRate !== undefined) await kv.set(`user:${email}:rate:audio`, audioRate);
      if (requestData.profileImage) await kv.set(`user:${email}:profileImage`, requestData.profileImage);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
