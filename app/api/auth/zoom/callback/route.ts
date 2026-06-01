import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const dashboardUrl = `${protocol}://${host}/dashboard?tab=settings`;

  if (error || !code) {
    console.error('[Zoom OAuth Callback] Error during flow:', error);
    return NextResponse.redirect(`${dashboardUrl}&error=zoom_failed`);
  }

  // Get current Clerk user
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${dashboardUrl}&error=zoom_config`);
  }

  try {
    const redirectUri = `${protocol}://${host}/api/auth/zoom/callback`;

    // Exchange code for tokens
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('[Zoom OAuth Callback] Zoom API token error:', tokens.error_description || tokens.error);
      return NextResponse.redirect(`${dashboardUrl}&error=zoom_exchange_api`);
    }

    // Save tokens in KV
    let savedTokens: any = await kv.get(`user:${email}:zoom_tokens`);
    if (!savedTokens) savedTokens = {};

    const updatedTokens = {
      ...savedTokens,
      ...tokens,
      refresh_token: tokens.refresh_token || savedTokens.refresh_token,
      updatedAt: Date.now()
    };

    await kv.set(`user:${email}:zoom_tokens`, updatedTokens);

    // Also update provider selection to zoom by default
    await kv.set(`user:${email}:videoProvider`, 'zoom');

    return NextResponse.redirect(`${dashboardUrl}&connected=zoom`);
  } catch (err: any) {
    console.error('[Zoom OAuth Callback] Exception:', err.message || err);
    return NextResponse.redirect(`${dashboardUrl}&error=zoom_token_exchange`);
  }
}
