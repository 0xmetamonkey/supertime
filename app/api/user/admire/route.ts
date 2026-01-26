import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth } from '../../../../auth';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  if (!username) return NextResponse.json({ count: 0 });

  let count = 0;
  let isAdmiring = false;

  if (process.env.KV_URL) {
    count = await kv.scard(`admirers:${username}`);
    const session = await auth();
    if (session?.user?.email) {
      isAdmiring = await kv.sismember(`admirers:${username}`, session.user.email) === 1;
    }
  }

  return NextResponse.json({ count, isAdmiring });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username, action } = await req.json();
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  const email = session.user.email;

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
