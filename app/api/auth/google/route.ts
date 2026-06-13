import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: 'Google OAuth is not configured on this server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.'
    }, { status: 501 });
  }

  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // Generate a secure auth URL
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // crucial to get a refresh token!
    prompt: 'consent',     // forces consent screen to guarantee refresh token
    scope: scopes,
  });

  return NextResponse.redirect(authorizationUrl);
}
