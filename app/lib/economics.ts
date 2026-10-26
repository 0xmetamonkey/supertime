import { kv } from "@vercel/kv";

// ECONOMICS CONSTANTS
export const PLATFORM_FEE_PERCENT = 0.2;
export const SPEAKER_SHARE_PERCENT = 0.8;

/**
 * SECURITY: every money-moving amount must be a positive safe integer.
 * Negative or fractional values could mint balances (audit finding).
 */
export function assertPositiveAmount(amount: unknown): number {
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }
  return amount;
}

/**
 * Best-effort per-wallet mutex (Vercel KV has no transactions over REST).
 * Locks are taken in sorted order when multiple wallets are involved.
 */
async function acquireWalletLocks(emails: string[]): Promise<string | null> {
  const unique = [...new Set(emails.map(e => e.toLowerCase()))].sort();
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const acquired: string[] = [];
  for (const email of unique) {
    const ok = await kv.set(`lock:wallet:${email}`, token, { nx: true, ex: 15 });
    if (!ok) {
      for (const e of acquired) await kv.del(`lock:wallet:${e}`);
      return null;
    }
    acquired.push(email);
  }
  return token;
}

async function releaseWalletLocks(emails: string[]) {
  const unique = [...new Set(emails.map(e => e.toLowerCase()))];
  await Promise.all(unique.map(e => kv.del(`lock:wallet:${e}`)));
}

export interface WithdrawalRequest {
  id: string;
  email: string;
  amount: number;
  upiId: string;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
}

/**
 * Audit Tool: Get detailed state of a user's economics
 */
export async function getDetailedWallet(email: string) {
  const [balance, withdrawable] = await kv.mget<[number | null, number | null]>(
    `balance:${email.toLowerCase()}`,
    `withdrawable:${email.toLowerCase()}`
  );
  return {
    balance: balance ?? 0,       // Spending credits
    withdrawable: withdrawable ?? 0,  // Earned INR (Credits equivalent)
  };
}

/**
 * Split Logic: 60/40 Split
 * Ensures rounding down to avoid fractional artifacts
 */
export function calculateSessionSplit(totalCredits: number) {
  const speakerShare = Math.floor(totalCredits * SPEAKER_SHARE_PERCENT);
  const platformShare = Math.floor(totalCredits * PLATFORM_FEE_PERCENT);

  // Note: If totalCredits is small (e.g. 1), rounding both down might leave a residue.
  // We prioritize speaker share getting the floor, and platform gets the rest 
  // OR we follow the 60/40 rule strictly as requested.
  // User: "Ensure the math rounds down to the nearest integer to avoid fractional credit errors."

  return {
    speakerShare,
    platformShare,
    residue: totalCredits - speakerShare - platformShare
  };
}

/**
 * Wrapper for Payment Processing (No-Break Mode)
 * This is the core function to be used in the new flow.
 */
export async function processSplitPayment(fromEmail: string, toEmail: string, amount: number) {
  assertPositiveAmount(amount);
  const from = fromEmail.toLowerCase();
  const to = toEmail.toLowerCase();

  const lockToken = await acquireWalletLocks([from, to]);
  if (!lockToken) {
    throw new Error('Wallet is busy. Please retry.');
  }

  try {
    // 1. Transactional check for balance
    const currentFullBalance = (await kv.get<number>(`balance:${from}`)) ?? 0;
    if (currentFullBalance < amount) {
      throw new Error('Insufficient funds in spending wallet');
    }

    // 2. Calculate Split
    const { speakerShare, platformShare } = calculateSessionSplit(amount);

    // 3. Update Sender Balances
    const finalSenderBalance = currentFullBalance - amount;
    await kv.set(`balance:${from}`, finalSenderBalance);

    const senderWithdrawable = (await kv.get<number>(`withdrawable:${from}`)) ?? 0;
    const senderTopup = currentFullBalance - senderWithdrawable;
    if (amount > senderTopup) {
      const withdrawableSpent = amount - senderTopup;
      const newSenderWithdrawable = Math.max(0, senderWithdrawable - withdrawableSpent);
      await kv.set(`withdrawable:${from}`, newSenderWithdrawable);
    }

    // Update Receiver Balances
    const currentWithdrawable = (await kv.get<number>(`withdrawable:${to}`)) ?? 0;
    await kv.set(`withdrawable:${to}`, currentWithdrawable + speakerShare);

    const currentReceiverBalance = (await kv.get<number>(`balance:${to}`)) ?? 0;
    await kv.set(`balance:${to}`, currentReceiverBalance + speakerShare);

    // 4. Update Platform Revenue
    const totalPlatformRevenue = (await kv.get<number>(`platform:revenue`)) ?? 0;
    await kv.set(`platform:revenue`, totalPlatformRevenue + platformShare);

    return {
      success: true,
      speakerShare,
      platformShare,
      balance: finalSenderBalance
    };
  } finally {
    await releaseWalletLocks([from, to]);
  }
}

/**
 * Withdrawal Flow
 */
export async function recordWithdrawalRequest(email: string, amount: number, upiId: string) {
  assertPositiveAmount(amount);
  const userEmail = email.toLowerCase();

  const lockToken = await acquireWalletLocks([userEmail]);
  if (!lockToken) {
    throw new Error('Wallet is busy. Please retry.');
  }

  try {
    // 1. Safety Check
    const currentWithdrawable = (await kv.get<number>(`withdrawable:${userEmail}`)) ?? 0;
    if (amount > currentWithdrawable) {
      throw new Error('Insufficient withdrawable balance');
    }

    // 2. Deduct immediately
    await kv.set(`withdrawable:${userEmail}`, currentWithdrawable - amount);

    const currentFullBalance = (await kv.get<number>(`balance:${userEmail}`)) ?? 0;
    await kv.set(`balance:${userEmail}`, Math.max(0, currentFullBalance - amount));

    // 3. Create Request
    const request: WithdrawalRequest = {
      id: `wd_${Math.random().toString(36).slice(2, 10)}`,
      email: userEmail,
      amount,
      upiId,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    // 4. Append to Global List (at the beginning)
    const currentList = await kv.get<WithdrawalRequest[]>('withdrawals:list') || [];
    await kv.set('withdrawals:list', [request, ...currentList]);

    return request;
  } finally {
    await releaseWalletLocks([userEmail]);
  }
}
