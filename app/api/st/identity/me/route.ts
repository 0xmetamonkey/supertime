import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createOrGetSTIdentity, getSTIdentityByEmail } from '@/app/lib/protocol';
import { resolveUsername } from '@/app/actions';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

    if (!user || !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Attempt to load existing identity
    let identity = await getSTIdentityByEmail(email);

    if (!identity) {
      // Lazy migration/provisioning: check if user already has a legacy claimed username
      let legacyUsername: string | undefined;
      try {
        const claimed = await resolveUsername(email);
        if (claimed) legacyUsername = claimed;
      } catch {}

      if (!legacyUsername && user.username) {
        legacyUsername = user.username;
      }

      const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;

      identity = await createOrGetSTIdentity({
        email,
        desiredUsername: legacyUsername,
        displayName,
      });
    }

    return NextResponse.json({ success: true, identity });
  } catch (error: any) {
    console.error('[API /api/st/identity/me] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
