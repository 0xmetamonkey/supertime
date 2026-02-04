import { NextResponse } from 'next/server';
import { getStats } from '@/app/lib/analytics';
import { auth } from '@/auth';
import { kv } from '@vercel/kv';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = await kv.get(`user:${session.user.email.toLowerCase()}:username`) as string;
    if (!username) {
      return NextResponse.json({ error: 'Username not found' }, { status: 404 });
    }

    const stats = await getStats(username);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
