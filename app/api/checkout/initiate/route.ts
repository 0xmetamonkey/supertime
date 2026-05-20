import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, creatorUsername, buyerName, buyerEmail } = body;

    if (!productId || !creatorUsername || !buyerName || !buyerEmail) {
      return NextResponse.json({ success: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    // Lookup the product
    const products = (await kv.get<any[]>(`user_products:${creatorUsername.toLowerCase()}`)) || [];
    const product = products.find((p: any) => p.id === productId);

    if (!product) {
      return NextResponse.json({ success: false, error: 'PRODUCT_NOT_FOUND' }, { status: 400 });
    }

    const amount = Number(product.price);
    if (!amount || amount < 1) {
      return NextResponse.json({ success: false, error: 'INVALID_AMOUNT' }, { status: 400 });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: amount * 100, // Razorpay takes amount in paise
      currency: 'INR',
      receipt: `purchase_${Date.now()}`,
      notes: {
        productId,
        creatorUsername,
        buyerEmail,
        buyerName,
        type: 'product',
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
    console.error("Initiate Checkout Error:", error);
    return NextResponse.json({
      success: false,
      error: `Failed: ${error.message || JSON.stringify(error)}`
    }, { status: 500 });
  }
}
