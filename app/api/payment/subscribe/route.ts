import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";
import { sendEmail } from '@/app/lib/email';
import { verifyRazorpayPayment } from '@/app/lib/razorpay';
import { escapeHtml, getCanonicalBaseUrl } from '@/app/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, creatorUsername: requestedCreator,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      buyerEmail: providedBuyerEmail, buyerName: providedBuyerName } = body;

    // SUBSCRIPTION PRICE (Hardcoded to 199 INR per plan)
    const amount = 199;

    // ─── VERIFY PAYMENT ───
    if (action === 'verify') {
      const { order } = await verifyRazorpayPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      const claimed = await kv.set(`payment:processed:${razorpay_payment_id}`, '1', { nx: true, ex: 31536000 });
      if (!claimed) {
        return NextResponse.json({ error: 'Payment already processed' }, { status: 409 });
      }

      // SECURITY: creator and price come from the server-created subscription
      // order only — not from this request body.
      const notes: Record<string, string> = (order as any).notes || {};
      if (notes.type !== 'subscription') {
        return NextResponse.json({ error: 'Order type mismatch' }, { status: 400 });
      }
      const creatorUsername = notes.creatorUsername || '';
      const verifiedAmount = Math.floor(Number(order.amount) / 100);
      if (!creatorUsername || verifiedAmount < amount) {
        return NextResponse.json({ error: 'Order does not match subscription plan' }, { status: 400 });
      }

      let buyerEmail = providedBuyerEmail || '';
      let buyerName = providedBuyerName || 'Guest';
      
      if (!buyerEmail) {
        try {
          const user = await currentUser();
          buyerEmail = user?.emailAddresses?.[0]?.emailAddress || '';
          buyerName = user?.firstName || user?.username || 'Guest';
        } catch (clerkErr) {}
      }

      // Credit creator's withdrawable balance (90%)
      let creatorEmail = '';
      if (creatorUsername && process.env.KV_URL) {
        creatorEmail = (await kv.get<string>(`owner:${creatorUsername.toLowerCase()}`)) || '';
        if (!creatorEmail) {
          creatorEmail = (await kv.get<string>(`owner:${creatorUsername}`)) || '';
        }

        if (creatorEmail) {
          const grossAmount = verifiedAmount;
          const COMMISSION_RATE = 0.20;
          const commission = Math.round(grossAmount * COMMISSION_RATE);
          const netAmount = grossAmount - commission;

          await kv.incrby(`withdrawable:${creatorEmail}`, netAmount);
          await kv.incrby('platform:commission:total', commission);

          // Record sale
          const sales = (await kv.get<any[]>(`sales:${creatorEmail}`)) || [];
          sales.unshift({
            id: razorpay_payment_id,
            productId: 'subscription_30_day',
            amount: grossAmount,
            netAmount,
            commission,
            type: 'subscription',
            timestamp: Date.now(),
          });
          await kv.set(`sales:${creatorEmail}`, sales.slice(0, 100));
        }
      }

      // GRANT SUBSCRIPTION ACCESS (30 Days)
      if (buyerEmail && creatorUsername) {
        const expiryTimestamp = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days from now
        await kv.set(`subscription:${creatorUsername.toLowerCase()}:${buyerEmail.toLowerCase()}`, expiryTimestamp);
      }

      // ─── SEND EMAIL NOTIFICATIONS ───
      if (process.env.RESEND_API_KEY) {
        try {
          const baseUrl = getCanonicalBaseUrl(req);
          const safeBuyerName = escapeHtml(buyerName);

          // Buyer Receipt
          if (buyerEmail) {
            await sendEmail({
              to: buyerEmail,
              subject: `Inner Circle: You're subscribed to @${creatorUsername} 🎉`,
              html: `
                <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
                  <h2 style="font-size: 18px;">Welcome to the Inner Circle!</h2>
                  <p>You now have 30 days of exclusive access to <strong>@${creatorUsername}</strong>'s locked content.</p>
                  <a href="${baseUrl}/${creatorUsername}" style="display: block; text-align: center; background: #111827; color: #ffffff; text-decoration: none; padding: 12px; border-radius: 8px;">
                    Read Editorials
                  </a>
                </div>
              `
            });
          }

          // Creator Notification
          if (creatorEmail) {
            await sendEmail({
              to: creatorEmail,
              subject: `🎉 New Inner Circle Member: ${buyerName}`,
              html: `
                <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
                  <h2 style="font-size: 18px;">You have a new subscriber!</h2>
                  <p><strong>${safeBuyerName}</strong> (${escapeHtml(buyerEmail)}) just joined your Inner Circle.</p>
                </div>
              `
            });
          }
        } catch (e) {}
      }

      return NextResponse.json({ success: true, isSubscribed: true });
    }

    // ─── CREATE ORDER ───
    if (!requestedCreator) {
      return NextResponse.json({ error: 'Missing creator' }, { status: 400 });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `sub_${requestedCreator}_${Date.now()}`,
      notes: {
        creatorUsername: requestedCreator,
        type: 'subscription',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Subscription Error:", error);
    return NextResponse.json({
      error: `Failed: ${error.message || JSON.stringify(error)}`
    }, { status: 500 });
  }
}
