import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

  try {
    if (!process.env.KV_URL) {
      // Mock rates for local dev without KV
      return NextResponse.json({
        videoRate: 100,
        audioRate: 50,
      });
    }

    const ownerEmail = await kv.get(`owner:${username.toLowerCase()}`);
    if (!ownerEmail) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const vRate = await kv.get(`user:${ownerEmail}:rate:video`);
    const aRate = await kv.get(`user:${ownerEmail}:rate:audio`);

    return NextResponse.json({
      videoRate: vRate !== null ? Number(vRate) : 100,
      audioRate: aRate !== null ? Number(aRate) : 50,
    });
  } catch (error) {
    console.error("Rates API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}
