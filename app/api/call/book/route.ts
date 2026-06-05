import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";
import { sendEmail } from '@/app/lib/email';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { creatorUsername, date, time, templateId, type, duration, price } = await req.json();
  try {
    const booking = await createBooking({
      creatorUsername, date, time, templateId, type, duration, price, visitorEmail: email.toLowerCase(),
      host: req.headers.get('host') || 'supertime.wtf'
    });
    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function createBooking({
  creatorUsername,
  date,
  time,
  templateId,
  type,
  duration,
  price,
  visitorEmail,
  paymentId,
  host = 'supertime.wtf'
}: any) {
  if (!creatorUsername || !date || !time) {
    throw new Error('Missing fields');
  }

  try {
    let creatorEmail = await kv.get(`owner:${creatorUsername.toLowerCase()}`);
    if (!creatorEmail) {
      creatorEmail = await kv.get(`owner:${creatorUsername}`);
    }
    if (!creatorEmail) throw new Error('Creator not found');

    // ATOMIC LOCK for direct booking calls (free or bypassing Razorpay)
    // If it was already locked by Razorpay, the verify route just overwrites it.
    // If we get here directly, try to lock it permanently.
    const lockKey = `booking_lock:${creatorUsername.toLowerCase()}:${date}:${time}`;
    const lockAcquired = await kv.set(lockKey, 'booked_direct', { nx: true });
    
    // Exception: If paymentId exists, we know Razorpay already locked it during create-order, 
    // so we can bypass the strict lock failure because we are just finalizing it.
    if (!lockAcquired && !paymentId) {
      throw new Error('This timeslot has already been booked.');
    }

    const bookingId = Math.random().toString(36).slice(2, 10);
    const grossPrice = price || 0;
    const COMMISSION_RATE = 0.20; // 20% platform commission
    const commission = grossPrice > 0 ? Math.round(grossPrice * COMMISSION_RATE) : 0;
    const netPrice = grossPrice - commission;

    // Fetch video meeting preferences & connection tokens
    const preferredProvider = await kv.get(`user:${creatorEmail}:videoProvider`) || 'supercalls';
    const googleTokens: any = await kv.get(`user:${creatorEmail}:google_tokens`);
    const zoomTokens: any = await kv.get(`user:${creatorEmail}:zoom_tokens`);

    const meetingRoomId = `session-${bookingId}`;
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Default fallback link is Supercalls
    let meetingUrl = `${baseUrl}/live/${meetingRoomId}`;
    let meetingMethodUsed = 'Supercalls';

    // 1. Google Meet generation
    if (preferredProvider === 'googlemeet' && googleTokens) {
      try {
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        
        if (clientId && clientSecret) {
          const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
          const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
          oauth2Client.setCredentials(googleTokens);

          // Refresh token if expired
          if (googleTokens.expiry_date && googleTokens.expiry_date < Date.now()) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            const updated = { ...googleTokens, ...credentials, updatedAt: Date.now() };
            await kv.set(`user:${creatorEmail}:google_tokens`, updated);
            oauth2Client.setCredentials(updated);
          }

          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          const eventResponse = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            requestBody: {
              summary: `1:1 Supertime Session with @${creatorUsername}`,
              description: `Scheduled 1:1 consultation via Supertime.`,
              start: { dateTime: new Date(`${date}T${time}`).toISOString() },
              end: { dateTime: new Date(new Date(`${date}T${time}`).getTime() + (duration || 30) * 60 * 1000).toISOString() },
              attendees: [{ email: visitorEmail }, { email: String(creatorEmail) }],
              conferenceData: {
                createRequest: {
                  requestId: `supertime-${bookingId}`,
                  conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
              }
            }
          });

          const hangoutLink = eventResponse.data.hangoutLink;
          if (hangoutLink) {
            meetingUrl = hangoutLink;
            meetingMethodUsed = 'Google Meet';
            console.log('[Booking API] Google Meet link generated:', hangoutLink);
          }
        }
      } catch (err) {
        console.error('[Booking API] Failed Google Meet generation, falling back to Supercalls:', err);
      }
    }

    // 2. Zoom meeting generation
    if (preferredProvider === 'zoom' && zoomTokens) {
      try {
        const zoomClientId = process.env.ZOOM_CLIENT_ID;
        const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;

        if (zoomClientId && zoomClientSecret) {
          let accessToken = zoomTokens.access_token;
          
          // Refresh Zoom token if expired or nearing expiry
          const isExpired = !zoomTokens.updatedAt || (Date.now() - zoomTokens.updatedAt) > 3500 * 1000;
          if (isExpired) {
            const basicAuth = Buffer.from(`${zoomClientId}:${zoomClientSecret}`).toString('base64');
            const tokenRes = await fetch('https://zoom.us/oauth/token', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: zoomTokens.refresh_token
              })
            });

            const refreshed = await tokenRes.json();
            if (!refreshed.error) {
              const updated = { ...zoomTokens, ...refreshed, updatedAt: Date.now() };
              await kv.set(`user:${creatorEmail}:zoom_tokens`, updated);
              accessToken = refreshed.access_token;
            }
          }

          const zoomMeetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              topic: `1:1 Supertime Session with @${creatorUsername}`,
              type: 2, // Scheduled
              start_time: new Date(`${date}T${time}`).toISOString(),
              duration: duration || 30,
              settings: {
                host_video: true,
                participant_video: true,
                join_before_host: true
              }
            })
          });

          const zoomMeeting = await zoomMeetingRes.json();
          if (zoomMeeting.join_url) {
            meetingUrl = zoomMeeting.join_url;
            meetingMethodUsed = 'Zoom';
            console.log('[Booking API] Zoom meeting room generated:', meetingUrl);
          }
        }
      } catch (err) {
        console.error('[Booking API] Failed Zoom meeting generation, falling back to Supercalls:', err);
      }
    }

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
      meetingUrl,
      meetingMethodUsed,
      timestamp: Date.now()
    };

    // Store booking
    await kv.lpush(`user:${creatorEmail}:bookings`, booking);
    // Also store for visitor
    await kv.lpush(`user:${visitorEmail}:my_bookings`, booking);

    // Save meeting stage registry for references
    await kv.set(`meeting:${meetingRoomId}`, {
      type: 'scheduled',
      creator: creatorUsername,
      buyer: visitorEmail,
      date,
      time,
      duration,
      callType: type,
      meetingUrl,
      meetingMethodUsed,
      createdAt: Date.now()
    });

    // Send email notifications
    try {
      const studioUrl = `${baseUrl}/studio`;

      console.log('[Booking API] 🎥 Dynamic Room generated via', meetingMethodUsed, ':', meetingUrl);

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
                <tr>
                  <td style="color: #6b7280; padding: 6px 0;">Meeting Platform</td>
                  <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${meetingMethodUsed}</td>
                </tr>
              </table>
            </div>
            
            <a href="${meetingUrl}" style="display: block; text-align: center; background: #111827; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 14px; border-radius: 8px; margin-bottom: 16px;">
              🎥 Join Meeting Room
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
                    <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">₹${grossPrice}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 6px 0;">Meeting Platform</td>
                    <td style="color: #111827; font-weight: 500; text-align: right; padding: 6px 0;">${meetingMethodUsed}</td>
                  </tr>
                </table>
              </div>
              
              <a href="${meetingUrl}" style="display: block; text-align: center; background: #111827; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 14px; border-radius: 8px; margin-bottom: 12px;">
                🎥 Join Meeting Room
              </a>
              
              <a href="${studioUrl}" style="display: block; text-align: center; background: #ffffff; color: #111827; text-decoration: none; font-weight: 500; font-size: 13px; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
                Open Creator Studio
              </a>
              
              <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
                Both you and your client will use the same link to connect.
              </p>
            </div>
          `
        });
        console.log('[Booking API] Creator email delivery result:', resCreator);
      }
    } catch (emailErr) {
      console.error('[Resend API] Failed to send booking notification emails:', emailErr);
    }

    return { success: true, booking, meetingUrl };
  } catch (error: any) {
    console.error("Booking Error:", error);
    throw error;
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
