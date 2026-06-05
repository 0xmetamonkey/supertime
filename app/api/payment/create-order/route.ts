import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { currentUser, auth } from "@clerk/nextjs/server";

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
    const { amount } = await req.json();

    if (!amount || amount < 1) { // Minimum 1 INR
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';

    const options = {
      amount: amount * 100, // Razorpay takes amount in paise (1 INR = 100 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify(options),
    });

    const order = await res.json();
    if (!res.ok) {
      throw new Error(order.error?.description || 'Failed to create Razorpay order');
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json({
      error: `Failed to create order: ${error.message || JSON.stringify(error)}`
    }, { status: 500 });
  }
}
