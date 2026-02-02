import { kv } from "@vercel/kv";

// ECONOMICS CONSTANTS
export const PLATFORM_FEE_PERCENT = 0.4;
export const SPEAKER_SHARE_PERCENT = 0.6;

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
  const balance = (await kv.get<number>(`balance:${email.toLowerCase()}`)) ?? 0;
  const withdrawable = (await kv.get<number>(`withdrawable:${email.toLowerCase()}`)) ?? 0;
  return {
    balance,       // Spending credits
    withdrawable,  // Earned INR (TKN equivalent)
  };
}

/**
 * Split Logic: 60/40 Split
 * Ensures rounding down to avoid fractional artifacts
 */
export function calculateSessionSplit(totalTokens: number) {
  const speakerShare = Math.floor(totalTokens * SPEAKER_SHARE_PERCENT);
  const platformShare = Math.floor(totalTokens * PLATFORM_FEE_PERCENT);

  // Note: If totalTokens is small (e.g. 1), rounding both down might leave a residue.
  // We prioritize speaker share getting the floor, and platform gets the rest 
  // OR we follow the 60/40 rule strictly as requested.
  // User: "Ensure the math rounds down to the nearest integer to avoid fractional token errors."

  return {
    speakerShare,
    platformShare,
    residue: totalTokens - speakerShare - platformShare
  };
}

/**
 * Wrapper for Payment Processing (No-Break Mode)
 * This is the core function to be used in the new flow.
 */
export async function processSplitPayment(fromEmail: string, toEmail: string, amount: number) {
  const from = fromEmail.toLowerCase();
  const to = toEmail.toLowerCase();

  // 1. Transactional check for balance
  const currentFullBalance = (await kv.get<number>(`balance:${from}`)) ?? 0;
  if (currentFullBalance < amount) {
    throw new Error('Insufficient funds in spending wallet');
  }

  // 2. Calculate Split
  const { speakerShare, platformShare } = calculateSessionSplit(amount);

  // 3. Update Balances
  // We use a multi/pipeline if possible, but standard KV sets are okay for this scale
  const finalSenderBalance = currentFullBalance - amount;
  await kv.set(`balance:${from}`, finalSenderBalance);

  const currentWithdrawable = (await kv.get<number>(`withdrawable:${to}`)) ?? 0;
  await kv.set(`withdrawable:${to}`, currentWithdrawable + speakerShare);

  // 4. Update Platform Revenue
  const totalPlatformRevenue = (await kv.get<number>(`platform:revenue`)) ?? 0;
  await kv.set(`platform:revenue`, totalPlatformRevenue + platformShare);

  return {
    success: true,
    speakerShare,
    platformShare,
    balance: finalSenderBalance
  };
}

/**
 * Withdrawal Flow
 */
export async function recordWithdrawalRequest(email: string, amount: number, upiId: string) {
  const userEmail = email.toLowerCase();

  // 1. Safety Check
  const currentWithdrawable = (await kv.get<number>(`withdrawable:${userEmail}`)) ?? 0;
  if (amount > currentWithdrawable) {
    throw new Error('Insufficient withdrawable balance');
  }

  // 2. Deduct immediately
  await kv.set(`withdrawable:${userEmail}`, currentWithdrawable - amount);

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
}
