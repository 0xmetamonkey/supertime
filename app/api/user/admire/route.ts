import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  const includeList = req.nextUrl.searchParams.get('list') === 'true';
  if (!username) return NextResponse.json({ count: 0, admirers: [] });

  let count = 0;
  let isAdmiring = false;
  let admirers: { email: string; username: string | null }[] = [];

  if (process.env.KV_URL) {
    count = await kv.scard(`admirers:${username}`);
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (email) {
      isAdmiring = await kv.sismember(`admirers:${username}`, email) === 1;
    }

    if (includeList) {
      const emails = await kv.smembers(`admirers:${username}`);
      admirers = await Promise.all(emails.map(async (email) => {
        const resolvedName = await kv.get<string>(`user:${email.toLowerCase().trim()}:username`);
        return { email, username: resolvedName };
      }));
    }
  }

  const response = NextResponse.json({ count, isAdmiring, admirers });

  // Cache for 30 seconds at the edge
  response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  return response;
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username, action } = await req.json();
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  if (process.env.KV_URL) {
    if (action === 'admire') {
      await kv.sadd(`admirers:${username}`, email);
    } else {
      await kv.srem(`admirers:${username}`, email);
    }
    const count = await kv.scard(`admirers:${username}`);
    return NextResponse.json({ success: true, count, isAdmiring: action === 'admire' });
  }

  return NextResponse.json({ success: true, count: 0 });
}
