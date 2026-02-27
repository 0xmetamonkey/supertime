import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, amount, productId, creatorUsername,
      razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // ─── VERIFY PAYMENT ───
    if (action === 'verify') {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) throw new Error("Razorpay secret missing");

      const signBody = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(signBody)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }

      // Credit creator's withdrawable balance
      if (creatorUsername && process.env.KV_URL) {
        const creatorEmail = await kv.get<string>(`owner:${creatorUsername.toLowerCase()}`);
        if (creatorEmail) {
          const current = (await kv.get<number>(`withdrawable:${creatorEmail}`)) ?? 0;
          await kv.set(`withdrawable:${creatorEmail}`, current + (amount || 0));

          // Record sale
          const sales = (await kv.get<any[]>(`sales:${creatorEmail}`)) || [];
          sales.unshift({
            id: razorpay_payment_id,
            productId: productId || 'tip',
            amount: amount || 0,
            type: productId ? 'sale' : 'tip',
            timestamp: Date.now(),
          });
          await kv.set(`sales:${creatorEmail}`, sales.slice(0, 100));
        }
      }

      // Return deliverable if it's a product purchase
      if (productId && creatorUsername) {
        const products = (await kv.get<any[]>(`user_products:${creatorUsername.toLowerCase()}`)) || [];
        const product = products.find((p: any) => p.id === productId);
        if (product) {
          return NextResponse.json({
            success: true,
            deliverable: {
              type: product.type,
              content: product.content,
              name: product.name,
            }
          });
        }
      }

      return NextResponse.json({ success: true });
    }

    // ─── CREATE ORDER ───
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `${productId ? 'purchase' : 'tip'}_${Date.now()}`,
      notes: {
        productId: productId || '',
        creatorUsername: creatorUsername || '',
        type: productId ? 'product' : 'tip',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Purchase Error:", error);
    return NextResponse.json({
      error: `Failed: ${error.message || JSON.stringify(error)}`
    }, { status: 500 });
  }
}
