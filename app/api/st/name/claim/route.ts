import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSTIdentityByEmail, claimSTName } from '@/app/lib/protocol';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "username" field' }, { status: 400 });
    }

    const identity = await getSTIdentityByEmail(email);
    if (!identity) {
      return NextResponse.json({ error: 'ST Identity not found for user' }, { status: 404 });
    }

    const result = await claimSTName(identity.uid, username);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, identity: result.identity });
  } catch (error: any) {
    console.error('[API /api/st/name/claim] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
