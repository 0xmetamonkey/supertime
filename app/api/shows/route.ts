import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });
  if (!process.env.KV_URL) return NextResponse.json({ error: 'KV not configured' }, { status: 500 });

  const username = await kv.get<string>(`user:${email}:username`);
  if (!username) return NextResponse.json({ error: 'No username' }, { status: 400 });

  const body = await req.json();
  const { action } = body;

  // CREATE a show
  if (action === 'create') {
    const { title, description, date, time, ticketPrice, maxSeats } = body;
    if (!title || !date || !time) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const showId = Math.random().toString(36).slice(2, 10);
    const roomId = `${username}-show-${showId}`;
    const show = {
      id: showId,
      roomId,
      title,
      description: description || '',
      date,
      time,
      ticketPrice: Number(ticketPrice) || 0,
      maxSeats: Number(maxSeats) || 100,
      ticketsSold: 0,
      creatorUsername: username,
      creatorEmail: email,
      status: 'scheduled', // scheduled | live | ended | cancelled
      createdAt: new Date().toISOString(),
    };

    // Store the show
    const shows: any[] = (await kv.get(`shows:${username}`)) || [];
    shows.unshift(show);
    await kv.set(`shows:${username}`, shows);

    // Also index by showId for ticket lookups
    await kv.set(`show:${showId}`, show);

    return NextResponse.json({ success: true, show });
  }

  // LIST shows for creator
  if (action === 'list') {
    const shows: any[] = (await kv.get(`shows:${username}`)) || [];
    return NextResponse.json({ shows });
  }

  // CANCEL a show
  if (action === 'cancel') {
    const { showId } = body;
    const shows: any[] = (await kv.get(`shows:${username}`)) || [];
    const updated = shows.map(s => s.id === showId ? { ...s, status: 'cancelled' } : s);
    await kv.set(`shows:${username}`, updated);

    const show: any = await kv.get(`show:${showId}`);
    if (show) { show.status = 'cancelled'; await kv.set(`show:${showId}`, show); }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// GET shows for a creator (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  if (!process.env.KV_URL) return NextResponse.json({ error: 'KV not configured' }, { status: 500 });

  const shows: any[] = (await kv.get(`shows:${username.toLowerCase()}`)) || [];
  // Only return scheduled/live shows
  const active = shows.filter(s => s.status === 'scheduled' || s.status === 'live');
  return NextResponse.json({ shows: active });
}
