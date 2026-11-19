import { NextRequest, NextResponse } from 'next/server';
import { getSTIdentityByUID, getSTIdentityByName } from '@/app/lib/protocol';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id_or_name: string }> }
) {
  try {
    const { id_or_name } = await params;
    if (!id_or_name) {
      return NextResponse.json({ error: 'Missing identifier parameter' }, { status: 400 });
    }

    let identity = null;
    if (id_or_name.startsWith('st_uid_')) {
      identity = await getSTIdentityByUID(id_or_name);
    } else {
      identity = await getSTIdentityByName(id_or_name);
    }

    if (!identity || identity.status !== 'active') {
      return NextResponse.json({ error: 'Identity not found' }, { status: 404 });
    }

    // Return sanitized public view (do not expose email if private)
    const publicView = {
      uid: identity.uid,
      currentUsername: identity.currentUsername,
      previousUsernames: identity.previousUsernames,
      createdAt: identity.createdAt,
      status: identity.status,
      wallets: identity.wallets.map((w) => ({
        id: w.id,
        networkType: w.networkType,
        address: w.address,
        supportedChains: w.supportedChains,
        isPrimary: w.isPrimary,
        verifiedAt: w.verifiedAt,
      })),
    };

    return NextResponse.json({ success: true, identity: publicView });
  } catch (error: any) {
    console.error('[API /api/st/identity/[id_or_name]] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
