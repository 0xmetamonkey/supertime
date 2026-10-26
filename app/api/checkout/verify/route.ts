import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { verifyRazorpayPayment } from '@/app/lib/razorpay';
import { escapeHtml } from '@/app/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, creatorUsername, buyerEmail, buyerName } = body;

    // SECURITY: signature + payment/order binding verified against Razorpay.
    const { order } = await verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    // Atomic idempotency claim before any fulfillment.
    const claimed = await kv.set(`payment:processed:${razorpay_payment_id}`, '1', { nx: true, ex: 31536000 });
    if (!claimed) {
      return NextResponse.json({ success: false, error: 'ALREADY_FULFILLED' }, { status: 400 });
    }

    const orderAmountRupees = Math.floor(Number(order.amount) / 100);

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
            // SECURITY: the paid order must cover at least the server-side product price
            if (orderAmountRupees < amount) {
              return NextResponse.json({ success: false, error: 'ORDER_AMOUNT_MISMATCH' }, { status: 400 });
            }
          } else {
             return NextResponse.json({ success: false, error: 'PRODUCT_NOT_FOUND' }, { status: 400 });
          }
        } else {
          // SECURITY: tip amount comes from the paid order, not the request body
          amount = orderAmountRupees;
        }

        const COMMISSION_RATE = 0.20; // 20%
        const commission = Math.round(amount * COMMISSION_RATE);
        const netAmount = amount - commission;

        // Update balances atomically
        await kv.incrby(`withdrawable:${creatorEmail}`, netAmount);
        await kv.incrby('platform:commission:total', commission);

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
                  html: `<p>Hi ${escapeHtml(buyerName || 'there')},</p><p>Thank you for purchasing <strong>${escapeHtml(productName)}</strong> from ${escapeHtml(creatorUsername)}!</p>`
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
