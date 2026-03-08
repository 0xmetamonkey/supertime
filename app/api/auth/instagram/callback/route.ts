import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import { kv } from '@vercel/kv';

// Instagram/Facebook OAuth callback handler
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(new URL('/dashboard?ig_error=denied', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?ig_error=no_code', req.url));
  }

  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.redirect(new URL('/dashboard?ig_error=unauthorized', req.url));
  }

  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  // Crucial: Must reconstruct the exact ngrok URL used in the frontend, otherwise Meta rejects the code
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(req.url).origin;
  const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

  if (!appId || !appSecret) {
    console.error('App credentials missing');
    return NextResponse.redirect(new URL('/dashboard?ig_error=config', req.url));
  }

  try {
    // Step 1: Exchange code for short-lived access token via Instagram Native API
    const tokenFormData = new URLSearchParams();
    tokenFormData.append('client_id', appId);
    tokenFormData.append('client_secret', appSecret);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', redirectUri);
    tokenFormData.append('code', code as string);

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenFormData,
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('---- INSTAGRAM TOKEN EXCHANGE FAILED ----');
      console.error('Status:', tokenRes.status);
      console.error('Error Response:', JSON.stringify(tokenData, null, 2));
      console.error('Payload Sent:', {
        client_id: appId,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code: code ? 'PRESENT' : 'MISSING'
      });
      return NextResponse.redirect(new URL('/dashboard?ig_error=token_failed', req.url));
    }

    // Step 2: Exchange for long-lived Instagram User Access Token
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedRes.json();

    const finalToken = longLivedData.access_token || tokenData.access_token;

    // Step 3: Get Instagram user info
    const meRes = await fetch(`https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${finalToken}`);
    const meData = await meRes.json();

    if (!meData.id) {
      console.error('Failed to get IG user info', meData);
    } else {
      // Step 4: Programmatically subscribe the app to webhooks for this user (Crucial for Native Login)
      try {
        const subRes = await fetch(`https://graph.instagram.com/v21.0/me/subscribed_apps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            subscribed_fields: 'messages,comments',
            access_token: finalToken
          })
        });
        const subData = await subRes.json();
        console.log('Webhook Subscription Status:', subData);
      } catch (subErr) {
        console.error('Failed to subscribe to webhooks:', subErr);
      }
    }

    // Save to bot config bypassing the Facebook Page flow
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (email) {
      // Trigger the bot config save natively
      const configRes = await fetch(`${baseUrl}/api/bot/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          instagramToken: finalToken,
          isUserToken: true,
          resolvedPageId: meData.id || tokenData.user_id,
          enabled: true,
          rules: [], // Will merge with existing rules server-side
        }),
      });

      const configData = await configRes.json();
      console.log('Bot config saved via Native IG OAuth callback:', configData);
    }

    // Return HTML that messages the opener and closes the popup
    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'IG_AUTH_SUCCESS' }, '*');
            } else {
              window.location.href = '/dashboard?ig_connected=true';
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'IG_AUTH_ERROR', error: 'Server error' }, '*');
            } else {
              window.location.href = '/dashboard?ig_error=server';
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
