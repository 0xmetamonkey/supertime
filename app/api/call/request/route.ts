import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Fallback for local dev
declare global {
  var mockRequestStore: Map<string, any[]>;
}

if (!global.mockRequestStore) {
  global.mockRequestStore = new Map();
}

const hasKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const { to, from } = await req.json();

    if (!to || !from) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const requestData = { from, timestamp: Date.now() };

    if (hasKV) {
      // Push to a list. We limit to last 20 requests to save space.
      await kv.lpush(`requests:${to}`, JSON.stringify(requestData));
      await kv.ltrim(`requests:${to}`, 0, 19);
    } else {
      console.log(`[MockKV] Storing request for ${to}:`, requestData);
      const existing = global.mockRequestStore.get(`requests:${to}`) || [];
      existing.unshift(requestData);
      global.mockRequestStore.set(`requests:${to}`, existing.slice(0, 20));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Request API Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

  try {
    let requests: any[] = [];
    if (hasKV) {
      requests = await kv.lrange(`requests:${username}`, 0, -1);
    } else {
      requests = global.mockRequestStore.get(`requests:${username}`) || [];
    }

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
