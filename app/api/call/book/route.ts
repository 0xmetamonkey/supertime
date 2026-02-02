import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, message: 'Booking endpoint stub' });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ bookings: [] });
}
