
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;
  const publicUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  return NextResponse.json({
    status: 'Diagnostic Report',
    timestamp: new Date().toISOString(),
    env: {
      LIVEKIT_API_KEY: apiKey ? `Present (Starts with ${apiKey.slice(0, 3)}...) [Length: ${apiKey.length}] [Spaces: ${apiKey !== apiKey.trim() ? 'YES' : 'NO'}]` : 'MISSING',
      LIVEKIT_API_SECRET: apiSecret ? `Present (Length: ${apiSecret.length}) [Spaces: ${apiSecret !== apiSecret.trim() ? 'YES' : 'NO'}]` : 'MISSING',
      LIVEKIT_URL: url || 'MISSING',
      NEXT_PUBLIC_LIVEKIT_URL: publicUrl || 'MISSING',
    },
    match: {
      urls_match: url === publicUrl ? 'YES' : 'NO'
    }
  });
}
