import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSTIdentityByEmail, verifyAndAssociateWallet } from '@/app/lib/protocol';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identity = await getSTIdentityByEmail(email);
    if (!identity) {
      return NextResponse.json({ error: 'ST Identity not found for user' }, { status: 404 });
    }

    const body = await req.json();
    const { nonce, signature } = body;

    if (!nonce || typeof nonce !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "nonce" field' }, { status: 400 });
    }
    if (!signature || typeof signature !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "signature" field' }, { status: 400 });
    }

    const result = await verifyAndAssociateWallet({
      uid: identity.uid,
      nonce,
      signature,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, wallet: result.wallet });
  } catch (error: any) {
    console.error('[API /api/st/wallet/verify] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
