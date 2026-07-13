import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { kv } from '@vercel/kv';
import { currentUser, auth } from "@clerk/nextjs/server";
// Fallback memory store
declare global {
  var mockWalletStore: Map<string, number>;
}
if (!global.mockWalletStore) {
  global.mockWalletStore = new Map();
}

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();
  let email = (sessionClaims as any)?.email;
  if (!email) {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress;
  }

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    const normalizedEmail = email.toLowerCase();

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay secret missing");

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // --- IDEMPOTENCY: Prevent replay attacks ---
      // Atomically claim this payment ID. nx = only set if key does not exist.
      // TTL of 90 days is enough to cover any legitimate retry window.
      const idempotencyKey = `payment:processed:${razorpay_payment_id}`;
      const claimed = await kv.set(idempotencyKey, normalizedEmail, { nx: true, ex: 60 * 60 * 24 * 90 });
      if (claimed === null) {
        // Key already existed — this payment was already processed
        return NextResponse.json({ error: 'Payment already processed' }, { status: 409 });
      }

      const instance = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        key_secret: secret,
      });

      const order = await instance.orders.fetch(razorpay_order_id);

      // Amount is in paise. 100 paise = 1 INR.
      // 1 INR = 1 Credit
      const amountInRupees = Number(order.amount) / 100;
      const creditsToAdd = amountInRupees;

      // Credit Wallet using EMAIL as identifier
      if (process.env.KV_URL) {
        const current = (await kv.get<number>(`balance:${normalizedEmail}`)) ?? 0;
        await kv.set(`balance:${normalizedEmail}`, current + creditsToAdd);
      } else {
        const current = global.mockWalletStore.get(normalizedEmail) ?? 0;
        global.mockWalletStore.set(normalizedEmail, current + creditsToAdd);
      }

      return NextResponse.json({ success: true, newBalance: creditsToAdd });
    } else {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
