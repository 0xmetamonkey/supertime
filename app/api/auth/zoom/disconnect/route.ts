import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await kv.del(`user:${email}:zoom_tokens`);
    // Reset videoProvider if it was zoom
    const currentProvider = await kv.get(`user:${email}:videoProvider`);
    if (currentProvider === 'zoom') {
      await kv.set(`user:${email}:videoProvider`, 'supercalls');
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
