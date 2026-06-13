import { NextResponse, NextRequest } from 'next/server';
import { getStats } from '@/app/lib/analytics';
import { currentUser } from '@clerk/nextjs/server';
import { kv } from '@vercel/kv';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = await kv.get(`user:${email}:username`) as string;
    if (!username) {
      return NextResponse.json({ error: 'Username not found' }, { status: 404 });
    }

    const stats = await getStats(username);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
