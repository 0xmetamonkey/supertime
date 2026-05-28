import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";
import { sendEmail } from '@/app/lib/email';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const visitorEmail = email.toLowerCase();
  const { creatorUsername, date, time, templateId, type, duration, price } = await req.json();

  if (!creatorUsername || !date || !time) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    let creatorEmail = await kv.get(`owner:${creatorUsername.toLowerCase()}`);
    if (!creatorEmail) {
      creatorEmail = await kv.get(`owner:${creatorUsername}`);
    }
    if (!creatorEmail) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    const bookingId = Math.random().toString(36).slice(2, 10);
    const grossPrice = price || 0;
    const COMMISSION_RATE = 0.10; // 10% platform commission
    const commission = grossPrice > 0 ? Math.round(grossPrice * COMMISSION_RATE) : 0;
    const netPrice = grossPrice - commission;

    const booking = {
      id: bookingId,
      visitorEmail,
      creatorUsername,
      date,
      time,
      templateId,
      type,
      duration,
      price: grossPrice,
      netPrice,
      commission,
      status: 'pending',
      timestamp: Date.now()
    };

    // Store booking
    await kv.lpush(`user:${creatorEmail}:bookings`, booking);
    // Also store for visitor
    await kv.lpush(`user:${visitorEmail}:my_bookings`, booking);

    // Generate a Supertime meeting room for this booking
    const meetingRoomId = `session-${bookingId}`;
    await kv.set(`meeting:${meetingRoomId}`, {
      type: 'scheduled',
      creator: creatorUsername,
      buyer: visitorEmail,
      date,
      time,
      duration,
      callType: type,
      createdAt: Date.now()
    });

    // Send email notifications
    try {
      const host = req.headers.get('host') || 'supertime.wtf';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;

      const meetingUrl = `${baseUrl}/live/${meetingRoomId}`;
      const studioUrl = `${baseUrl}/studio`;

      console.log('[Booking API] 🎥 Meeting room created:', meetingUrl);

      // 1. Send to Visitor (Buyer)
      const resVisitor = await sendEmail({
        to: visitorEmail,
        subject: `1:1 Session Confirmed 🎉`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; color: #111827;">
            <div style="margin-bottom: 24px;">
              <span style="font-weight: 600; font-size: 14px; letter-spacing: -0.02em;">⚡ Supertime</span>
            </div>
            
            <h2 style="font-size: 18px; font-weight: 500; letter-spacing: -0.02em; margin-bottom: 12px; color: #111827;">Your session is confirmed.</h2>
            <p style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-bottom: 24px;">
              Your Supertime ${type} call with <strong>@${creatorUsername}</strong> has been scheduled.
            </p>
            
            <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="color: #6b7280; padding: 6px 0;">With</td>
                  <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">@${creatorUsername}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; padding: 6px 0;">Date</td>
                  <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${date}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; padding: 6px 0;">Time</td>
                  <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${time}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; padding: 6px 0;">Duration</td>
                  <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${duration} min</td>
                </tr>
              </table>
            </div>
            
            <a href="${meetingUrl}" style="display: block; text-align: center; background: #111827; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 14px; border-radius: 8px; margin-bottom: 16px;">
              🎥 Join Video Stage
            </a>
            
            <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
              Open this link at the scheduled date & time. Make sure you have a stable connection.
            </p>
          </div>
        `
      });
      console.log('[Booking API] Visitor email delivery result:', resVisitor);

      // 2. Send to Creator (Seller)
      if (creatorEmail) {
        const resCreator = await sendEmail({
          to: String(creatorEmail),
          subject: `New 1:1 Session Booked: ${visitorEmail.split('@')[0]}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; color: #111827;">
              <div style="margin-bottom: 24px;">
                <span style="font-weight: 600; font-size: 14px; letter-spacing: -0.02em;">⚡ Supertime</span>
              </div>
              
              <h2 style="font-size: 18px; font-weight: 500; letter-spacing: -0.02em; margin-bottom: 12px; color: #111827;">New session booked.</h2>
              <p style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-bottom: 24px;">
                A client has booked a ${type} call with you. Here are the details:
              </p>
              
              <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="color: #6b7280; padding: 6px 0;">Client</td>
                    <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${visitorEmail}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 6px 0;">Date</td>
                    <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${date}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 6px 0;">Time</td>
                    <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${time}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 6px 0;">Duration</td>
                    <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${duration} min</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 6px 0;">Value</td>
                    <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${grossPrice} TKN</td>
                  </tr>
                </table>
              </div>
              
              <a href="${meetingUrl}" style="display: block; text-align: center; background: #111827; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 14px; border-radius: 8px; margin-bottom: 12px;">
                🎥 Join Video Stage
              </a>
              
              <a href="${studioUrl}" style="display: block; text-align: center; background: #ffffff; color: #111827; text-decoration: none; font-weight: 500; font-size: 13px; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
                Open Creator Studio
              </a>
              
              <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
                Both you and your client will use the same Video Stage link to connect.
              </p>
            </div>
          `
        });
        console.log('[Booking API] Creator email delivery result:', resCreator);
      }
    } catch (emailErr) {
      console.error('[Resend API] Failed to send booking notification emails:', emailErr);
    }

    return NextResponse.json({ success: true, booking, meetingUrl: `/live/${meetingRoomId}` });
  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: 'Failed to book' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await currentUser();
  const emailAddr = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !emailAddr) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = emailAddr.toLowerCase();
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'received'; // 'received' or 'sent'

  try {
    const key = mode === 'sent' ? `user:${email}:my_bookings` : `user:${email}:bookings`;
    const bookings = await kv.lrange(key, 0, -1);
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
