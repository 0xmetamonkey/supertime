import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: 'Zoom OAuth is not configured on this server. Please add ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET to your environment variables.'
    }, { status: 501 });
  }

  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/zoom/callback`;

  const authorizationUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authorizationUrl);
}
