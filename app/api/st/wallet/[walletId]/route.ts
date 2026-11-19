import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSTIdentityByEmail, removeAssociatedWallet, setPrimaryAssociatedWallet } from '@/app/lib/protocol';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ walletId: string }> }
) {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { walletId } = await params;
    if (!walletId) {
      return NextResponse.json({ error: 'Missing walletId parameter' }, { status: 400 });
    }

    const identity = await getSTIdentityByEmail(email);
    if (!identity) {
      return NextResponse.json({ error: 'ST Identity not found for user' }, { status: 404 });
    }

    const result = await removeAssociatedWallet({
      uid: identity.uid,
      walletId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API /api/st/wallet/[walletId]] DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ walletId: string }> }
) {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { walletId } = await params;
    if (!walletId) {
      return NextResponse.json({ error: 'Missing walletId parameter' }, { status: 400 });
    }

    const identity = await getSTIdentityByEmail(email);
    if (!identity) {
      return NextResponse.json({ error: 'ST Identity not found for user' }, { status: 404 });
    }

    const result = await setPrimaryAssociatedWallet({
      uid: identity.uid,
      walletId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API /api/st/wallet/[walletId]] PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
