import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth } from '../../../../auth';
import { ADMIN_EMAILS } from '../../../config';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { action, email, amount } = await req.json();

  if (!email || !action) {
    return NextResponse.json({ error: 'Invalid arguments' }, { status: 400 });
  }

  try {
    if (action === 'verify') {
      await kv.set(`user:${email}:verified`, true);
    } else if (action === 'unverify') {
      await kv.del(`user:${email}:verified`);
    } else if (action === 'disable') {
      await kv.set(`user:${email}:disabled`, true);
    } else if (action === 'enable') {
      await kv.del(`user:${email}:disabled`);
    } else if (action === 'give') {
      const amt = parseInt(amount);
      if (isNaN(amt)) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
      const current = await kv.get<number>(`balance:${email}`) || 0;
      await kv.set(`balance:${email}`, current + amt);
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
