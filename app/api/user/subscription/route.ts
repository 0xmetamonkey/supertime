import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorUsername = searchParams.get('creatorUsername');

    if (!creatorUsername) {
      return NextResponse.json({ error: 'Missing creatorUsername' }, { status: 400 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ isSubscribed: false });
    }

    const buyerEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (!buyerEmail) {
      return NextResponse.json({ isSubscribed: false });
    }

    const expiryTimestamp = await kv.get<number>(`subscription:${creatorUsername.toLowerCase()}:${buyerEmail}`);

    if (expiryTimestamp && expiryTimestamp > Date.now()) {
      return NextResponse.json({ isSubscribed: true, expiryTimestamp });
    }

    return NextResponse.json({ isSubscribed: false });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ isSubscribed: false });
  }
}
