
import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

export async function GET() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;
  const publicUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  let verificationStatus = "Skipped";
  let roomList = null;
  let errorDetails = null;

  if (apiKey && apiSecret && url) {
    try {
      const svc = new RoomServiceClient(url, apiKey, apiSecret);
      const rooms = await svc.listRooms();
      verificationStatus = "SUCCESS - Keys are Valid";
      roomList = rooms.length;
    } catch (e: any) {
      verificationStatus = "FAILED - Keys are Invalid or Server Unreachable";
      errorDetails = e.message;
    }
  }

  return NextResponse.json({
    status: 'Diagnostic Report v2',
    timestamp: new Date().toISOString(),
    env: {
      LIVEKIT_API_KEY: apiKey ? `Present (Starts with ${apiKey.slice(0, 3)}...) [Length: ${apiKey.length}] [Spaces: ${apiKey !== apiKey.trim() ? 'YES' : 'NO'}]` : 'MISSING',
      LIVEKIT_API_SECRET: apiSecret ? `Present (Length: ${apiSecret.length}) [Spaces: ${apiSecret !== apiSecret.trim() ? 'YES' : 'NO'}]` : 'MISSING',
      LIVEKIT_URL: url || 'MISSING',
      NEXT_PUBLIC_LIVEKIT_URL: publicUrl || 'MISSING',
    },
    backend_test: {
      verification: verificationStatus,
      rooms_found: roomList,
      error: errorDetails
    },
    match: {
      urls_match: url === publicUrl ? 'YES' : 'NO'
    }
  });
}
