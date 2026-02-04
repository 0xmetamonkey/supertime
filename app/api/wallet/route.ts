import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth } from "../../../auth";
import {
  getDetailedWallet,
  processSplitPayment,
  recordWithdrawalRequest
} from '@/app/lib/economics';

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
  const { balance, withdrawable } = await getDetailedWallet(email);

  // Check if they are a creator (have a username)
  let isCreator = false;
  if (process.env.KV_URL) {
    const username = await kv.get(`user:${email}:username`);
    isCreator = !!username;
  }

  return NextResponse.json({
    balance,
    withdrawable,
    withdrawable_inr: withdrawable, // 1:1 for INR display
    isCreator
  });
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

  // NEW: Split Deduction (60/40)
  if (action === 'deduct_split') {
    if (typeof amount !== 'number' || !recipientEmail) {
      return NextResponse.json({ error: 'Amount and recipientEmail required' }, { status: 400 });
    }

    try {
      const result = await processSplitPayment(senderEmail, recipientEmail, amount);
      return NextResponse.json(result);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 402 });
    }
  }

  // NEW: Withdrawal Flow
  if (action === 'withdraw') {
    const { upiId, amount: withdrawAmount } = body;
    if (!upiId || !withdrawAmount || typeof withdrawAmount !== 'number') {
      return NextResponse.json({ error: 'UPI ID and Amount required' }, { status: 400 });
    }

    try {
      const request = await recordWithdrawalRequest(senderEmail, withdrawAmount, upiId);
      return NextResponse.json({ success: true, request });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
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
