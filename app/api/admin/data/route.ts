import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth } from '../../../../auth';

const ADMIN_EMAILS = ['0xmetamonkey@gmail.com', 'extsystudios@gmail.com', 'lifeofaman01@gmail.com'];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
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

  const getUser = (email: string) => {
    if (!users.has(email)) {
      users.set(email, {
        email: email,
        username: 'N/A',
        role: 'Caller',
        balance: 0,
        isVerified: false,
        isDisabled: false
      });
    }
    return users.get(email);
  };

  for (const key of ownerKeys) {
    const email = await kv.get<string>(key);
    const username = key.replace('owner:', '');
    if (email) {
      const u = getUser(email);
      u.username = username;
      u.role = 'Creator';
    }
  }

  for (const key of balanceKeys) {
    const email = key.replace('balance:', '');
    const balance = await kv.get<number>(key);
    const u = getUser(email);
    u.balance = typeof balance === 'number' ? balance : 0;
  }

  for (const key of verifiedKeys) {
    const email = key.replace('user:', '').replace(':verified', '');
    const isVerified = await kv.get(key);
    if (isVerified) getUser(email).isVerified = true;
  }
  for (const key of disabledKeys) {
    const email = key.replace('user:', '').replace(':disabled', '');
    const isDisabled = await kv.get(key);
    if (isDisabled) getUser(email).isDisabled = true;
  }

  const config = {
    agoraAppId: process.env.NEXT_PUBLIC_AGORA_APP_ID ?
      `${process.env.NEXT_PUBLIC_AGORA_APP_ID.substring(0, 5)}...${process.env.NEXT_PUBLIC_AGORA_APP_ID.slice(-4)}` : 'MISSING',
    agoraCert: process.env.AGORA_APP_CERTIFICATE ?
      `${process.env.AGORA_APP_CERTIFICATE.substring(0, 5)}...${process.env.AGORA_APP_CERTIFICATE.slice(-4)}` : 'MISSING (Check Vercel)'
  };

  return NextResponse.json({ users: Array.from(users.values()), config });
}
