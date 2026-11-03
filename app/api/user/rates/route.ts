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
        hourlyRate: 5000,
        dailyRate: 25000,
        weeklyRate: 90000,
        monthlyRate: 250000,
      });
    }

    const ownerEmail = await kv.get(`owner:${username.toLowerCase()}`);
    if (!ownerEmail) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [vRate, aRate, hRate, dRate, wRate, mRate] = await Promise.all([
      kv.get(`user:${ownerEmail}:rate:video`),
      kv.get(`user:${ownerEmail}:rate:audio`),
      kv.get(`user:${ownerEmail}:rate:hourly`),
      kv.get(`user:${ownerEmail}:rate:daily`),
      kv.get(`user:${ownerEmail}:rate:weekly`),
      kv.get(`user:${ownerEmail}:rate:monthly`),
    ]);

    const videoRate = vRate !== null ? Number(vRate) : 100;
    const audioRate = aRate !== null ? Number(aRate) : 50;
    const hourlyRate = hRate !== null ? Number(hRate) : Math.round(videoRate * 60 * 0.85);
    const dailyRate = dRate !== null ? Number(dRate) : Math.round(hourlyRate * 6 * 0.8);
    const weeklyRate = wRate !== null ? Number(wRate) : Math.round(dailyRate * 5 * 0.75);
    const monthlyRate = mRate !== null ? Number(mRate) : Math.round(weeklyRate * 4 * 0.7);

    return NextResponse.json({
      videoRate,
      audioRate,
      hourlyRate,
      dailyRate,
      weeklyRate,
      monthlyRate,
    });
  } catch (error) {
    console.error("Rates API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}
