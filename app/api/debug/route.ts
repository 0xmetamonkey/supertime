import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import { kv } from '@vercel/kv';
import { resolveUsername } from '../../actions';

export async function GET(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  const diagnostic = {
    timestamp: new Date().toISOString(),
    sessionExists: !!user,
    sessionEmail: email || null,
    normalizedEmail: email ? email.toLowerCase().trim() : null,
    resolvedUsername: null as string | null,
    dbCheck: {
      userKeyExists: false,
      ownerKeyExists: false,
    }
  };

  if (email && process.env.KV_URL) {
    const normalized = email.toLowerCase().trim();
    diagnostic.resolvedUsername = await resolveUsername(normalized);

    const userVal = await kv.get(`user:${normalized}:username`);
    diagnostic.dbCheck.userKeyExists = !!userVal;

    if (diagnostic.resolvedUsername) {
      const ownerVal = await kv.get(`owner:${diagnostic.resolvedUsername}`);
      diagnostic.dbCheck.ownerKeyExists = !!ownerVal;
    }
  }

  // Add Agora Check
  (diagnostic as any).agora = {
    hasAppId: !!process.env.NEXT_PUBLIC_AGORA_APP_ID,
    hasCertificate: !!process.env.AGORA_APP_CERTIFICATE,
    appIdPrefix: process.env.NEXT_PUBLIC_AGORA_APP_ID?.substring(0, 5) || null
  };

  return NextResponse.json(diagnostic);
}
