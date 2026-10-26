import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getIdentity } from '@/app/lib/identity';
import { ADMIN_EMAILS } from '@/app/config';

// POST only (with JSON content-type) so a cross-site form cannot trigger this with an admin's cookies.
export async function POST() {
  const identity = await getIdentity();
  if (!identity || !ADMIN_EMAILS.includes(identity.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const balanceKeys = await kv.keys('balance:*');
    const withdrawableKeys = await kv.keys('withdrawable:*');
    const earningsKeys = await kv.keys('earnings:*');

    const allKeys = [...balanceKeys, ...withdrawableKeys, ...earningsKeys];

    if (allKeys.length === 0) {
      return NextResponse.json({ success: true, message: 'No balances found to reset.' });
    }

    await Promise.all(allKeys.map((key) => kv.del(key)));

    return NextResponse.json({
      success: true,
      message: `Reset complete. Wiped ${allKeys.length} accounts.`,
    });
  } catch (error: any) {
    console.error('Error resetting balances:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
