import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { kv } from '@vercel/kv';
import { tipRatelimit } from '../../lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { creatorUsername, amount, currency = 'INR', tipperName } = body;

    if (!creatorUsername || !amount || amount < 1) {
      return NextResponse.json({ success: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const identifier = req.headers.get('x-forwarded-for') || 'anonymous';
    const { success: allowed } = await tipRatelimit.limit(identifier);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    // Verify creator exists
    const creatorEmail = await kv.get(`owner:${creatorUsername.toLowerCase()}`);
    if (!creatorEmail) {
      return NextResponse.json({ success: false, error: 'CREATOR_NOT_FOUND' }, { status: 404 });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: amount * 100, // paise or cents
      currency,
      receipt: `tip_${Date.now()}`,
      notes: {
        creatorUsername,
        tipperName: tipperName || 'Anonymous',
        type: 'tip',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Tip Initiate Error:", error);
    return NextResponse.json({
      success: false,
      error: `Failed: ${error.message || JSON.stringify(error)}`
    }, { status: 500 });
  }
}
