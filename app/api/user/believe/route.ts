import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from '@clerk/nextjs/server';
import { trackEvent } from '@/app/lib/analytics';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  const includeList = req.nextUrl.searchParams.get('list') === 'true';
  if (!username) return NextResponse.json({ count: 0, believers: [] });

  let count = 0;
  let isBelieving = false;
  let believers: { email: string; username: string | null }[] = [];

  if (process.env.KV_URL) {
    count = await kv.scard(`believers:${username}`);
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (email) {
      isBelieving = (await kv.sismember(`believers:${username}`, email)) === 1;
    }

    if (includeList) {
      const emails = await kv.smembers(`believers:${username}`);
      believers = await Promise.all(
        emails.map(async (e) => {
          const resolvedUsername = await kv.get<string>(`user:${e.toLowerCase().trim()}:username`);
          return { email: e, username: resolvedUsername };
        })
      );
    }
  }

  const response = NextResponse.json({ count, isBelieving, believers });
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
    if (action === 'believe') {
      await kv.sadd(`believers:${username}`, email);

      // Rich metadata — enables future Circle upgrade without duplicating the relationship
      await kv.set(`believer:${username}:${email}`, {
        believedAt: Date.now(),
        tier: 'believer',
      });

      await trackEvent(username, 'believe');

      // Real-time ping to creator's Ably channel
      try {
        const apiKey = process.env.ABLY_API_KEY;
        const creatorEmail = await kv.get<string>(`owner:${username.toLowerCase()}`);
        if (apiKey && creatorEmail) {
          const ably = new (await import('ably')).Rest(apiKey);
          await ably.channels.get(`user:${creatorEmail.toLowerCase()}`).publish('new_believer', {
            believerEmail: email,
            username,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.error('[Believe API] Ably notification failed:', e);
      }
    } else {
      await kv.srem(`believers:${username}`, email);
      await kv.del(`believer:${username}:${email}`);
    }

    const count = await kv.scard(`believers:${username}`);
    return NextResponse.json({ success: true, count, isBelieving: action === 'believe' });
  }

  return NextResponse.json({ success: true, count: 0 });
}
