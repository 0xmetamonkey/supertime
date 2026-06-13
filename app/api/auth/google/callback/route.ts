import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
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
    console.error('[Google OAuth Callback] Error during flow:', error);
    return NextResponse.redirect(`${dashboardUrl}&error=google_failed`);
  }

  // Get current Clerk user to tie tokens to
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized login required to connect integrations' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${dashboardUrl}&error=google_config`);
  }

  try {
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens in KV
    // If refresh token is missing, retrieve previously stored one (Google only returns refresh_token on first authorization unless prompt=consent is used)
    let savedTokens: any = await kv.get(`user:${email}:google_tokens`);
    if (!savedTokens) savedTokens = {};

    const updatedTokens = {
      ...savedTokens,
      ...tokens,
      // Fallback to existing refresh_token if Google omitted it in this response
      refresh_token: tokens.refresh_token || savedTokens.refresh_token,
      updatedAt: Date.now()
    };

    await kv.set(`user:${email}:google_tokens`, updatedTokens);

    // Also update provider selection to googlemeet by default
    await kv.set(`user:${email}:videoProvider`, 'googlemeet');

    return NextResponse.redirect(`${dashboardUrl}&connected=google`);
  } catch (err: any) {
    console.error('[Google OAuth Callback] Token exchange failed:', err.message || err);
    return NextResponse.redirect(`${dashboardUrl}&error=google_token_exchange`);
  }
}
