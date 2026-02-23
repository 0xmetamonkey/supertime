import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const visitorEmail = email.toLowerCase();
  const { creatorUsername, date, time, templateId, type, duration, price } = await req.json();

  if (!creatorUsername || !date || !time) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const creatorEmail = await kv.get(`owner:${creatorUsername.toLowerCase()}`);
    if (!creatorEmail) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    const bookingId = Math.random().toString(36).slice(2, 10);
    const booking = {
      id: bookingId,
      visitorEmail,
      creatorUsername,
      date,
      time,
      templateId,
      type,
      duration,
      price,
      status: 'pending',
      timestamp: Date.now()
    };

    // Store booking
    await kv.lpush(`user:${creatorEmail}:bookings`, booking);
    // Also store for visitor
    await kv.lpush(`user:${visitorEmail}:my_bookings`, booking);

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: 'Failed to book' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await currentUser();
  const emailAddr = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !emailAddr) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = emailAddr.toLowerCase();
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'received'; // 'received' or 'sent'

  try {
    const key = mode === 'sent' ? `user:${email}:my_bookings` : `user:${email}:bookings`;
    const bookings = await kv.lrange(key, 0, -1);
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
