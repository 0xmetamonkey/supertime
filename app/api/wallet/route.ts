import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth } from "../../../auth";

// Fallback memory store for dev without KV keys
const memoryStore = new Map<string, number>();

async function getBalance(email: string): Promise<number> {
  if (process.env.KV_URL) {
    return (await kv.get<number>(`balance:${email}`)) ?? 0;
  }
  return memoryStore.get(email) ?? 0;
}

async function setBalance(email: string, value: number) {
  if (process.env.KV_URL) {
    await kv.set(`balance:${email}`, value);
  } else {
    memoryStore.set(email, value);
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const email = session.user.email;
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
  const senderEmail = session.user.email;

  if (!action || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Handle Transfer / Deduct
  if (action === 'deduct') {
    let senderBalance = await getBalance(senderEmail);
    if (senderBalance < amount) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
    }

    senderBalance -= amount;
    await setBalance(senderEmail, senderBalance);

    // If recipientEmail provided, credit them (Real-time Transfer)
    if (recipientEmail) {
      let recipientBalance = await getBalance(recipientEmail);
      recipientBalance += amount;
      await setBalance(recipientEmail, recipientBalance);
    }

    return NextResponse.json({ balance: senderBalance });
  }

  if (action === 'recharge') {
    let current = await getBalance(senderEmail);
    current += amount;
    await setBalance(senderEmail, current);
    return NextResponse.json({ balance: current });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
