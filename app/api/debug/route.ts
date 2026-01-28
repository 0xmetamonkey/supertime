import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { kv } from '@vercel/kv';
import { resolveUsername } from '../../actions';

export async function GET(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  const diagnostic = {
    timestamp: new Date().toISOString(),
    sessionExists: !!session,
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

  return NextResponse.json(diagnostic);
}
