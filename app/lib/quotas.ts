import { kv } from "@vercel/kv";

export type PlanTier = 'free' | 'pro' | 'enterprise';

export const TIER_LIMITS = {
  free: {
    callMinutes: 100,
    broadcastMins: 30,
    maxProducts: 1,
    maxVault: 2,
    platformFee: 0.20
  },
  pro: {
    callMinutes: 1000,
    broadcastMins: 120,
    maxProducts: 10,
    maxVault: 20,
    platformFee: 0.15
  },
  enterprise: {
    callMinutes: Infinity,
    broadcastMins: Infinity,
    maxProducts: Infinity,
    maxVault: Infinity,
    platformFee: 0.10
  }
};

export async function getUserPlan(email: string): Promise<PlanTier> {
  const plan = await kv.get<string>(`user:${email.toLowerCase()}:plan`);
  if (plan === 'pro' || plan === 'enterprise') return plan as PlanTier;
  return 'free'; // default
}

export async function setUserPlan(email: string, plan: PlanTier) {
  await kv.set(`user:${email.toLowerCase()}:plan`, plan);
}

/**
 * Checks if a user has exceeded the limit for a specific feature.
 * Returns { allowed: boolean, limit: number, current: number }
 */
export async function checkQuota(email: string, feature: keyof typeof TIER_LIMITS['free']) {
  const plan = await getUserPlan(email);
  const limit = TIER_LIMITS[plan][feature];
  
  if (limit === Infinity) {
    return { allowed: true, limit, current: 0 };
  }

  // Monthly resets for time-based quotas
  const date = new Date();
  const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
  
  let key = `user:${email.toLowerCase()}:usage:${feature}`;
  if (feature === 'callMinutes' || feature === 'broadcastMins') {
    key = `${key}:${monthKey}`;
  }

  const currentUsage = (await kv.get<number>(key)) ?? 0;
  
  return {
    allowed: currentUsage < limit,
    limit,
    current: currentUsage
  };
}

/**
 * Increments the usage for a specific feature.
 */
export async function incrementUsage(email: string, feature: keyof typeof TIER_LIMITS['free'], amount: number = 1) {
  const date = new Date();
  const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
  
  let key = `user:${email.toLowerCase()}:usage:${feature}`;
  if (feature === 'callMinutes' || feature === 'broadcastMins') {
    key = `${key}:${monthKey}`;
  }

  const currentUsage = (await kv.get<number>(key)) ?? 0;
  await kv.set(key, currentUsage + amount);
  return currentUsage + amount;
}
