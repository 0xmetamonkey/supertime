import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Store in KV
    const timestamp = Date.now();
    const entry = { email, name: name || '', timestamp, source: 'waitlist' };

    if (process.env.KV_REST_API_URL) {
      await kv.lpush('waitlist', JSON.stringify(entry));
      await kv.sadd('waitlist_emails', email); // For deduplication
    }

    return NextResponse.json({ success: true, message: 'You\'re on the list!' });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (process.env.KV_REST_API_URL) {
      const count = await kv.scard('waitlist_emails');
      return NextResponse.json({ count: count || 0 });
    }
    return NextResponse.json({ count: 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
