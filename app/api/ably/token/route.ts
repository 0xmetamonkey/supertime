import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }

  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    console.error('[Ably] Missing ABLY_API_KEY in environment');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const ably = new Ably.Rest(apiKey);

    // Generate a token with limited capabilities for this specific client
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      capability: {
        // User can subscribe to their own channel for incoming calls
        [`user:${clientId}`]: ['subscribe', 'presence'],
        // User can publish to any user's channel to initiate calls
        ['user:*']: ['publish'],
        // User can join room channels
        ['room:*']: ['subscribe', 'publish', 'presence'],
      }
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('[Ably] Token generation failed:', error);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
