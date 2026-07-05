import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from '@clerk/nextjs/server';
import { sendEmail } from '@/app/lib/email';

async function sendPushToUsername(username: string, title: string, body: string, url: string) {
  try {
    const token = await kv.get(`fcm_token:${username.toLowerCase()}`);
    if (!token) return;

    const { messaging } = await import('@/app/lib/firebase-admin');
    await messaging.send({
      token: token as string,
      notification: { title, body },
      webpush: {
        notification: { icon: '/icon.png', badge: '/icon.png' },
        fcmOptions: { link: url },
      },
    });
  } catch (e) {
    console.error('[TalkTime Invite] Push send failed:', e);
  }
}

async function sendAblyInvite(targetEmail: string, payload: any) {
  try {
    const ABLY_API_KEY = process.env.ABLY_API_KEY;
    if (!ABLY_API_KEY) return;

    const channelName = `user:${targetEmail.toLowerCase()}`;
    const [keyId, keySecret] = ABLY_API_KEY.split(':');
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    await fetch(`https://rest.ably.io/channels/${encodeURIComponent(channelName)}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'talktime:invite', data: payload }),
    });
  } catch (e) {
    console.error('[TalkTime Invite] Ably signal failed:', e);
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const senderEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  if (!user || !senderEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, roomId, roomTitle } = await req.json();

    if (!username || !roomId) {
      return NextResponse.json({ error: 'Missing username or roomId' }, { status: 400 });
    }

    const cleanUsername = username.replace(/^@/, '').toLowerCase();

    // Resolve username → email
    const targetEmail = await kv.get(`owner:${cleanUsername}`) as string | null;
    if (!targetEmail) {
      return NextResponse.json({ error: `@${cleanUsername} not found on Supertime` }, { status: 404 });
    }

    // Get sender's username for display
    const senderUsername = await kv.get(`user:${senderEmail}:username`) as string || senderEmail.split('@')[0];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://supertime.wtf';
    const joinUrl = `${appUrl}/talktime/${roomId}?invited=true&u=${encodeURIComponent(cleanUsername)}`;
    const title = roomTitle || 'TalkTime';

    // 1. Send email
    await sendEmail({
      to: targetEmail,
      subject: `@${senderUsername} is inviting you to a TalkTime ⚡`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
          <div style="max-width:520px;margin:0 auto;padding:40px 24px;">

            <!-- Header -->
            <div style="text-align:center;margin-bottom:40px;">
              <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:100px;">
                <span style="font-size:13px;font-weight:700;color:#a78bfa;letter-spacing:0.1em;text-transform:uppercase;">TalkTime</span>
                <div style="width:6px;height:6px;background:#ef4444;border-radius:50%;"></div>
              </div>
            </div>

            <!-- Card -->
            <div style="background:#111;border:1px solid #222;border-radius:24px;padding:40px;text-align:center;">

              <!-- Icon -->
              <div style="width:72px;height:72px;background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(244,63,94,0.2));border:1px solid rgba(139,92,246,0.3);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px;">
                🎙️
              </div>

              <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">
                @${senderUsername} wants to talk
              </h1>
              <p style="color:#888;font-size:15px;margin:0 0 32px;line-height:1.6;">
                You've been invited to a live TalkTime session — shared audio/video with a collaborative writing pad.
                <br><br>
                <strong style="color:#ccc;">"${title}"</strong>
              </p>

              <!-- CTA -->
              <a href="${joinUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#7c3aed,#e11d48);color:#fff;font-size:15px;font-weight:700;border-radius:14px;text-decoration:none;letter-spacing:0.02em;">
                ⚡ Join the TalkTime
              </a>

              <p style="color:#555;font-size:12px;margin:24px 0 0;">
                Or paste this in your browser:<br>
                <span style="color:#7c3aed;word-break:break-all;">${joinUrl}</span>
              </p>
            </div>

            <!-- Footer -->
            <p style="text-align:center;color:#444;font-size:12px;margin-top:32px;">
              Supertime · <a href="https://supertime.wtf" style="color:#555;text-decoration:none;">supertime.wtf</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    // 2. Send Ably realtime signal (if they're online in the app)
    await sendAblyInvite(targetEmail, {
      from: senderUsername,
      fromEmail: senderEmail,
      roomId,
      roomTitle: title,
      joinUrl,
    });

    // 3. Send push notification (if they have FCM token)
    await sendPushToUsername(
      cleanUsername,
      `@${senderUsername} invited you to TalkTime ⚡`,
      `"${title}" — tap to join now`,
      joinUrl,
    );

    // 4. Store pending invite in KV for in-app notification on next load
    await kv.set(
      `talktime:invite:${targetEmail}:${roomId}`,
      {
        from: senderUsername,
        fromEmail: senderEmail,
        roomId,
        roomTitle: title,
        joinUrl,
        sentAt: Date.now(),
      },
      { ex: 3600 } // 1 hour TTL
    );

    return NextResponse.json({ success: true, invitedUsername: cleanUsername });
  } catch (error) {
    console.error('[TalkTime Invite] Error:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
