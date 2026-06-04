import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // We are resetting 'balance:*', 'withdrawable:*', 'earnings:*'
    // Since Vercel KV standard redis SCAN can be complex, we can use the keys() method
    const balanceKeys = await kv.keys('balance:*');
    const withdrawableKeys = await kv.keys('withdrawable:*');
    const earningsKeys = await kv.keys('earnings:*');

    const allKeys = [...balanceKeys, ...withdrawableKeys, ...earningsKeys];

    if (allKeys.length === 0) {
      return NextResponse.json({ success: true, message: "No balances found to reset." });
    }

    // Delete all these keys
    await Promise.all(allKeys.map(key => kv.del(key)));

    return NextResponse.json({ 
      success: true, 
      message: `Reset complete. Wiped ${allKeys.length} accounts.`,
      keysDeleted: allKeys 
    });
  } catch (error: any) {
    console.error('Error resetting balances:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
