import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { kv } from '@vercel/kv';
import { auth } from '../../../../auth';

// Fallback memory store
declare global {
  var mockWalletStore: Map<string, number>;
}
if (!global.mockWalletStore) {
  global.mockWalletStore = new Map();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    const email = session.user.email;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay secret missing");

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const instance = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        key_secret: secret,
      });

      const order = await instance.orders.fetch(razorpay_order_id);

      // Amount is in paise. 100 paise = 1 INR.
      // 1 INR = 1 TKN
      const amountInRupees = Number(order.amount) / 100;
      const tokensToAdd = amountInRupees;

      // Credit Wallet using EMAIL as identifier
      if (process.env.KV_URL) {
        const current = (await kv.get<number>(`balance:${email}`)) ?? 0;
        await kv.set(`balance:${email}`, current + tokensToAdd);
      } else {
        const current = global.mockWalletStore.get(email) ?? 0;
        global.mockWalletStore.set(email, current + tokensToAdd);
      }

      return NextResponse.json({ success: true, newBalance: tokensToAdd });
    } else {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
