import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";
import { paymentRatelimit } from '../../lib/ratelimit';
import { sendEmail } from '@/app/lib/email';
import { createBooking } from '@/app/api/call/book/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, amount, productId, creatorUsername,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      bookingDetails, buyerEmail: providedBuyerEmail, buyerName: providedBuyerName } = body;

    // ─── VERIFY PAYMENT ───
    if (action === 'verify') {
      console.log('[Purchase API] ✅ Verify action hit — starting verification flow');

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

      const claimed = await kv.set(`payment:processed:${razorpay_payment_id}`, '1', { nx: true, ex: 31536000 });
      if (!claimed) {
        return NextResponse.json({ error: 'Payment already processed' }, { status: 409 });
      }

      console.log('[Purchase API] ✅ Signature valid');

      // Get buyer info (use provided if guest, otherwise check Clerk)
      let buyerEmail = providedBuyerEmail || '';
      let buyerName = providedBuyerName || 'Guest';
      
      if (!buyerEmail) {
        try {
          const user = await currentUser();
          buyerEmail = user?.emailAddresses?.[0]?.emailAddress || '';
          buyerName = user?.firstName || user?.username || 'Guest';
          console.log('[Purchase API] Clerk Buyer:', buyerEmail, buyerName);
        } catch (clerkErr) {
          console.warn('[Purchase API] Clerk currentUser() failed, continuing without buyer email:', clerkErr);
        }
      } else {
        console.log('[Purchase API] Guest Buyer:', buyerEmail, buyerName);
      }

      // Resolve product name and type
      let productName = 'Tip';
      let productContent = '';
      let productType = '';
      if (productId && creatorUsername) {
        const products = (await kv.get<any[]>(`user_products:${creatorUsername.toLowerCase()}`)) || [];
        const product = products.find((p: any) => p.id === productId);
        if (product) {
          productName = product.name;
          productContent = product.content || '';
          productType = product.type || '';
        }
      }

      let meetingRoomId = '';
      let meetingUrl = '';
      if (productType === 'booking' && creatorUsername && bookingDetails) {
        try {
          const host = req.headers.get('host') || 'supertime.wtf';
          const bookingResult = await createBooking({
            creatorUsername,
            date: bookingDetails.date,
            time: bookingDetails.time,
            templateId: productId,
            type: productType,
            duration: 30, // Default duration if not specified
            price: amount,
            visitorEmail: buyerEmail,
            paymentId: razorpay_payment_id,
            host
          });
          meetingUrl = bookingResult?.meetingUrl || '';
          
          // Secure the lock permanently now that it's paid
          const lockKey = `booking_lock:${creatorUsername.toLowerCase()}:${bookingDetails.date}:${bookingDetails.time}`;
          await kv.set(lockKey, 'booked_paid');
          
          console.log('[Purchase API] 🎥 Meeting created via createBooking:', meetingUrl);
        } catch (bookingErr) {
          console.error('[Purchase API] ❌ Failed to create booking:', bookingErr);
        }
      }

      // Credit creator's withdrawable balance (90% — platform takes 10% commission)
      let creatorEmail = '';
      if (creatorUsername && process.env.KV_URL) {
        // Try lowercase first
        creatorEmail = (await kv.get<string>(`owner:${creatorUsername.toLowerCase()}`)) || '';
        // If not found, try original case
        if (!creatorEmail) {
          creatorEmail = (await kv.get<string>(`owner:${creatorUsername}`)) || '';
        }
        
        console.log('[Purchase API] Resolved creatorEmail:', creatorEmail, 'for username:', creatorUsername);

        if (creatorEmail) {
          const grossAmount = amount || 0;
          const COMMISSION_RATE = 0.20; // 20% flat rate platform wide
          const commission = Math.round(grossAmount * COMMISSION_RATE);
          const netAmount = grossAmount - commission;

          const current = (await kv.get<number>(`withdrawable:${creatorEmail}`)) ?? 0;
          await kv.set(`withdrawable:${creatorEmail}`, current + netAmount);

          // Track platform commission
          const totalCommission = (await kv.get<number>('platform:commission:total')) ?? 0;
          await kv.set('platform:commission:total', totalCommission + commission);

          // Record sale with commission breakdown
          const sales = (await kv.get<any[]>(`sales:${creatorEmail}`)) || [];
          sales.unshift({
            id: razorpay_payment_id,
            productId: productId || 'tip',
            amount: grossAmount,
            netAmount,
            commission,
            type: productId ? 'sale' : 'tip',
            timestamp: Date.now(),
          });
          await kv.set(`sales:${creatorEmail}`, sales.slice(0, 100));

          console.log('[Purchase API] ✅ Sale recorded for creator:', creatorEmail);
        } else {
          console.warn('[Purchase API] ⚠️ Could not find email mapping for creator username:', creatorUsername);
        }
      }

      // ─── SEND EMAIL NOTIFICATIONS ───
      console.log('[Purchase API] 📧 Starting email dispatch...');
      console.log('[Purchase API] buyerEmail:', buyerEmail, '| creatorEmail:', creatorEmail, '| RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);

      if (process.env.RESEND_API_KEY && productType !== 'booking') {
        try {
          const host = req.headers.get('host') || 'supertime.wtf';
          const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
          const baseUrl = `${protocol}://${host}`;
          const isBooking = productType === 'booking';

          // 1. Send receipt to Buyer
          if (buyerEmail) {
            console.log('[Purchase API] 📧 Sending buyer receipt to:', buyerEmail);
            const resBuyer = await sendEmail({
              to: buyerEmail,
              subject: isBooking ? `1:1 Session Confirmed 🎉` : `Receipt: Your purchase from @${creatorUsername}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; color: #111827;">
                  <div style="margin-bottom: 24px;">
                    <span style="font-weight: 600; font-size: 14px; letter-spacing: -0.02em;">⚡ Supertime</span>
                  </div>
                  <h2 style="font-size: 18px; font-weight: 500; margin-bottom: 12px;">${isBooking ? 'Your session is confirmed.' : 'Thank you for your purchase!'}</h2>
                  <p style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-bottom: 24px;">
                    ${isBooking
                      ? `Your Supertime call with <strong>@${creatorUsername}</strong> has been scheduled. Use the link below to join at the scheduled time.`
                      : `Your payment for <strong>${productName}</strong> by <strong>@${creatorUsername}</strong> has been verified.`
                    }
                  </p>
                  <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                      <tr><td style="color: #6b7280; padding: 6px 0;">${isBooking ? 'Session' : 'Item'}</td><td style="text-align: right; font-weight: 500; padding: 6px 0;">${productName}</td></tr>
                      <tr><td style="color: #6b7280; padding: 6px 0;">With</td><td style="text-align: right; font-weight: 500; padding: 6px 0;">@${creatorUsername}</td></tr>
                      <tr><td style="color: #6b7280; padding: 6px 0;">Amount</td><td style="text-align: right; font-weight: 500; padding: 6px 0;">₹${amount}</td></tr>
                    </table>
                  </div>
                  <a href="${baseUrl}/${creatorUsername}" style="display: block; text-align: center; background: #111827; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 13px; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                    View @${creatorUsername}'s Profile
                  </a>
                  ${isBooking && meetingUrl ? `
                  <a href="${meetingUrl}" style="display: block; text-align: center; background: #111827; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 14px; border-radius: 8px; margin-bottom: 16px;">
                    🎥 Join Video Stage
                  </a>
                  <p style="font-size: 11px; color: #9ca3af; text-align: center;">Open this link at the scheduled time to join your call.</p>
                ` : `
                  <p style="font-size: 11px; color: #9ca3af; text-align: center;">Questions? Contact the creator directly.</p>
                `}
                </div>
              `
            });
            console.log('[Purchase API] 📧 Buyer email result:', JSON.stringify(resBuyer));
          } else {
            console.log('[Purchase API] ⚠️ No buyer email — skipping buyer receipt');
          }

          // 2. Send "Sale Made!" to Creator
          if (creatorEmail) {
            console.log('[Purchase API] 📧 Sending sale notification to creator:', creatorEmail);
            const resCreator = await sendEmail({
              to: creatorEmail,
              subject: `💰 Sale Made! ${buyerName} purchased ${productName}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; color: #111827;">
                  <div style="margin-bottom: 24px;">
                    <span style="font-weight: 600; font-size: 14px; letter-spacing: -0.02em;">⚡ Supertime</span>
                  </div>
                  <h2 style="font-size: 18px; font-weight: 500; margin-bottom: 12px;">You made a sale!</h2>
                  <p style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-bottom: 24px;">
                    <strong>${buyerName}</strong>${buyerEmail ? ` (${buyerEmail})` : ''} purchased <strong>${productName}</strong>.
                  </p>
                  <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                      <tr><td style="color: #6b7280; padding: 6px 0;">Product</td><td style="text-align: right; font-weight: 500; padding: 6px 0;">${productName}</td></tr>
                      <tr><td style="color: #6b7280; padding: 6px 0;">Gross</td><td style="text-align: right; font-weight: 500; padding: 6px 0;">₹${amount}</td></tr>
                      <tr><td style="color: #6b7280; padding: 6px 0;">Your Earnings</td><td style="text-align: right; font-weight: bold; color: #10b981; padding: 6px 0;">₹${Math.round(amount * 0.80)}</td></tr>
                    </table>
                  </div>
                  <a href="${baseUrl}/studio" style="display: block; text-align: center; background: #111827; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 13px; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                    Open Creator Studio
                  </a>
                  <p style="font-size: 11px; color: #9ca3af; text-align: center;">Log in to manage your earnings and orders.</p>
                </div>
              `
            });
            console.log('[Purchase API] 📧 Creator email result:', JSON.stringify(resCreator));
          } else {
            console.log('[Purchase API] ⚠️ No creator email — skipping creator notification');
          }
        } catch (emailErr) {
          console.error('[Purchase API] ❌ Email sending failed:', emailErr);
        }
      } else {
        console.log('[Purchase API] ⚠️ RESEND_API_KEY not set — skipping all emails');
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
              content: product.type === 'booking' ? meetingUrl : product.content,
              name: product.name,
              ...(meetingUrl ? { meetingUrl } : {}),
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

    const identifier = req.headers.get('x-forwarded-for') || 'anonymous';
    const { success: allowed } = await paymentRatelimit.limit(identifier);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    // ATOMIC DOUBLE-BOOKING LOCK (15 min expiry for checkout window)
    if (bookingDetails && bookingDetails.date && bookingDetails.time && creatorUsername) {
      const lockKey = `booking_lock:${creatorUsername.toLowerCase()}:${bookingDetails.date}:${bookingDetails.time}`;
      const lockAcquired = await kv.set(lockKey, 'locked_pending_payment', { nx: true, ex: 900 });
      if (!lockAcquired) {
        return NextResponse.json({ error: 'This timeslot has just been taken by someone else or is pending payment. Please choose another time.' }, { status: 409 });
      }
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
