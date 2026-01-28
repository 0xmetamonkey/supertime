import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth } from "../../../auth";

// Fallback memory store for dev without KV keys
declare global {
  var mockWalletStore: Map<string, number>;
}
if (!global.mockWalletStore) {
  global.mockWalletStore = new Map();
}

async function getBalance(email: string): Promise<number> {
  if (process.env.KV_URL) {
    return (await kv.get<number>(`balance:${email}`)) ?? 0;
  }
  return global.mockWalletStore.get(email) ?? 0;
}

async function setBalance(email: string, value: number) {
  if (process.env.KV_URL) {
    await kv.set(`balance:${email}`, value);
  } else {
    global.mockWalletStore.set(email, value);
  }
}


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    // SECURITY: Allow dev faucet checking without session? No, dev faucet is POST.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const email = session.user.email.toLowerCase();
  const balance = await getBalance(email);

  // Check if they are a creator (have a username)
  let isCreator = false;
  if (process.env.KV_URL) {
    const username = await kv.get(`user:${email}:username`);
    isCreator = !!username;
  }

  return NextResponse.json({ balance, isCreator });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action, amount, recipientEmail } = body;
  const senderEmail = session.user.email.toLowerCase();

  if (!action) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Handle Transfer / Deduct
  if (action === 'deduct') {
    if (typeof amount !== 'number') return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    let senderBalance = await getBalance(senderEmail);
    if (senderBalance < amount) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
    }

    senderBalance -= amount;
    await setBalance(senderEmail, senderBalance);

    // If recipientEmail provided, credit them (Real-time Transfer)
    if (recipientEmail) {
      const recipient = recipientEmail.toLowerCase();
      let recipientBalance = await getBalance(recipient);
      recipientBalance += amount;
      await setBalance(recipient, recipientBalance);
    }

    return NextResponse.json({ balance: senderBalance });
  }

  // DEV FAUCET (Only in development)
  if (action === 'dev_faucet' && process.env.NODE_ENV === 'development') {
    let current = await getBalance(senderEmail);
    // Add 5000 tokens
    current += 5000;
    await setBalance(senderEmail, current);
    return NextResponse.json({ balance: current, message: "Dev Faucet Used: +5000 TKN" });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
