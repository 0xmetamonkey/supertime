import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { kv } from '@vercel/kv';
import { ADMIN_EMAILS } from '../../../config';

export async function GET(req: NextRequest) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  if (!email || !ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!process.env.KV_URL) {
    return NextResponse.json({ users: [] }); // Dev mode without KV
  }

  const ownerKeys = await kv.keys('owner:*');
  const balanceKeys = await kv.keys('balance:*');
  const verifiedKeys = await kv.keys('user:*:verified');
  const disabledKeys = await kv.keys('user:*:disabled');

  const users = new Map();

  const getUser = (userEmail: string) => {
    if (!users.has(userEmail)) {
      users.set(userEmail, {
        email: userEmail,
        username: 'N/A',
        role: 'Caller',
        balance: 0,
        isVerified: false,
        isDisabled: false
      });
    }
    return users.get(userEmail);
  };

  for (const key of ownerKeys) {
    const ownerEmail = await kv.get<string>(key);
    const username = key.replace('owner:', '');
    if (ownerEmail) {
      const u = getUser(ownerEmail);
      u.username = username;
      u.role = 'Creator';
    }
  }

  for (const key of balanceKeys) {
    const balanceEmail = key.replace('balance:', '');
    const balance = await kv.get<number>(key);
    const u = getUser(balanceEmail);
    u.balance = typeof balance === 'number' ? balance : 0;
  }

  for (const key of verifiedKeys) {
    const verifiedEmail = key.replace('user:', '').replace(':verified', '');
    const isVerified = await kv.get(key);
    if (isVerified) getUser(verifiedEmail).isVerified = true;
  }
  for (const key of disabledKeys) {
    const disabledEmail = key.replace('user:', '').replace(':disabled', '');
    const isDisabled = await kv.get(key);
    if (isDisabled) getUser(disabledEmail).isDisabled = true;
  }

  const config = {
    agoraAppId: process.env.NEXT_PUBLIC_AGORA_APP_ID ?
      `${process.env.NEXT_PUBLIC_AGORA_APP_ID.substring(0, 5)}...${process.env.NEXT_PUBLIC_AGORA_APP_ID.slice(-4)}` : 'MISSING',
    agoraCert: process.env.AGORA_APP_CERTIFICATE ?
      `${process.env.AGORA_APP_CERTIFICATE.substring(0, 5)}...${process.env.AGORA_APP_CERTIFICATE.slice(-4)}` : 'MISSING (Check Vercel)'
  };

  return NextResponse.json({ users: Array.from(users.values()), config });
}
