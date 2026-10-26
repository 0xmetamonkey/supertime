import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';
import { getIdentity, matchesIdentity } from '@/app/lib/identity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }

  const normalizedClientId = clientId.toLowerCase();
  const isGuestOrRoulette =
    normalizedClientId.startsWith('roulette-') ||
    normalizedClientId.startsWith('guest-') ||
    normalizedClientId.startsWith('talktime-');

  if (!isGuestOrRoulette) {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The requested clientId must belong to the logged-in session.
    if (!matchesIdentity(clientId, identity)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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
      clientId: normalizedClientId,
      capability: {
        // User can subscribe to their own channel for incoming calls
        [`user:${normalizedClientId}`]: ['subscribe', 'presence'],
        // User can publish to any user's channel to initiate calls
        ['user:*']: ['publish'],
        // User can join room/broadcast channels
        ['room:*']: ['subscribe', 'publish', 'presence'],
        ['broadcast:*']: ['subscribe', 'publish', 'presence'],
        // TalkTime pad channels
        ['talktime-pad:*']: ['subscribe', 'publish', 'presence'],
        // Team chat channels
        ['team:*']: ['subscribe', 'publish', 'presence'],
        // Direct messaging channels
        ['dm:*']: ['subscribe', 'publish', 'presence'],
        // Roulette video channels
        ['roulette:*']: ['subscribe', 'publish', 'presence'],
      }
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('[Ably] Token generation failed:', error);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
