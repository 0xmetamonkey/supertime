import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, creatorUsername, buyerEmail, buyerName, amount: clientAmount } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay secret missing");

    const signBody = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signBody)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'SIGNATURE_MISMATCH' }, { status: 400 });
    }

    let creatorEmail = '';
    let amount = 0;
    let productName = 'Tip';
    let isTip = !productId || productId === 'tip';
    let productContent = '';
    
    if (creatorUsername && process.env.KV_URL) {
      creatorEmail = await kv.get<string>(`owner:${creatorUsername.toLowerCase()}`) || '';
      if (creatorEmail) {
        
        if (!isTip) {
          const products = (await kv.get<any[]>(`user_products:${creatorUsername.toLowerCase()}`)) || [];
          const product = products.find((p: any) => p.id === productId);
          if (product) {
            amount = Number(product.price);
            productName = product.name;
            productContent = product.content;
          } else {
             return NextResponse.json({ success: false, error: 'PRODUCT_NOT_FOUND' }, { status: 400 });
          }
        } else {
          amount = Number(clientAmount) || 0;
        }

        const COMMISSION_RATE = 0.10; // 10%
        const commission = Math.round(amount * COMMISSION_RATE);
        const netAmount = amount - commission;

        // Update balances
        const current = (await kv.get<number>(`withdrawable:${creatorEmail}`)) ?? 0;
        await kv.set(`withdrawable:${creatorEmail}`, current + netAmount);

        const totalCommission = (await kv.get<number>('platform:commission:total')) ?? 0;
        await kv.set('platform:commission:total', totalCommission + commission);

        // Record sale
        const sales = (await kv.get<any[]>(`sales:${creatorEmail}`)) || [];
        // Check for ALREADY_FULFILLED
        if (sales.some((s: any) => s.id === razorpay_payment_id)) {
          return NextResponse.json({ success: false, error: 'ALREADY_FULFILLED' }, { status: 400 });
        }

        sales.unshift({
          id: razorpay_payment_id,
          productId: isTip ? 'tip' : productId,
          amount,
          netAmount,
          commission,
          type: isTip ? 'tip' : 'sale',
          timestamp: Date.now(),
          buyerName: buyerName || 'Anonymous',
          buyerEmail: buyerEmail || ''
        });
        await kv.set(`sales:${creatorEmail}`, sales.slice(0, 100));

        // Send email via Resend API
        if (process.env.RESEND_API_KEY && buyerEmail && !isTip) {
           try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: 'Supertime <noreply@supertime.app>',
                  to: [buyerEmail],
                  subject: `Your Receipt for ${productName}`,
                  html: `<p>Hi ${buyerName || 'there'},</p><p>Thank you for purchasing <strong>${productName}</strong> from ${creatorUsername}!</p>`
                })
              });
           } catch (e) {
              console.error("Failed to send email", e);
           }
        }

        return NextResponse.json({
          success: true,
          message: "Payment verified",
          downloadUrl: productContent || ''
        });
      }
    }

    return NextResponse.json({ success: true, message: "Payment verified but creator not found." });
  } catch (error: any) {
    console.error("Verify Checkout Error:", error);
    return NextResponse.json({
      success: false,
      error: `Failed: ${error.message || JSON.stringify(error)}`
    }, { status: 500 });
  }
}
