import crypto from 'crypto';
import { kv } from '@vercel/kv';
import { STChallenge, STAssociatedWallet, STNetworkType } from '../types';
import { ST_CHALLENGE_TTL_SECONDS, ST_SUPPORTED_NETWORKS } from '../constants';
import { getSTIdentityByUID, logSTIdentityEvent } from '../registry';
import { evmWalletAdapter } from './evm';

declare global {
  var mockChallengeStore: Map<string, STChallenge> | undefined;
}
if (!global.mockChallengeStore) {
  global.mockChallengeStore = new Map<string, STChallenge>();
}

async function kvGetChallenge(nonce: string): Promise<STChallenge | null> {
  const key = `st_challenge:${nonce}`;
  if (process.env.KV_URL) {
    try {
      return await kv.get<STChallenge>(key);
    } catch {}
  }
  return global.mockChallengeStore?.get(nonce) ?? null;
}

async function kvSetChallenge(challenge: STChallenge): Promise<void> {
  const key = `st_challenge:${challenge.nonce}`;
  if (process.env.KV_URL) {
    try {
      await kv.set(key, challenge, { ex: ST_CHALLENGE_TTL_SECONDS });
      return;
    } catch {}
  }
  global.mockChallengeStore?.set(challenge.nonce, challenge);
}

async function kvBurnChallenge(nonce: string): Promise<void> {
  const key = `st_challenge:${nonce}`;
  if (process.env.KV_URL) {
    try {
      await kv.del(key);
      return;
    } catch {}
  }
  global.mockChallengeStore?.delete(nonce);
}

/**
 * Generate a cryptographically secure, time-bounded challenge for wallet ownership verification
 */
export async function createWalletChallenge(params: {
  uid: string;
  address: string;
  networkType: STNetworkType;
}): Promise<{ success: boolean; challenge?: STChallenge; error?: string }> {
  const identity = await getSTIdentityByUID(params.uid);
  if (!identity) {
    return { success: false, error: 'Identity not found' };
  }

  let normalizedAddress = params.address.trim();
  if (params.networkType === 'evm') {
    if (!evmWalletAdapter.validateAddress(normalizedAddress)) {
      return { success: false, error: 'Invalid EVM address format' };
    }
    normalizedAddress = evmWalletAdapter.normalizeAddress(normalizedAddress);
  } else {
    return { success: false, error: `Network type ${params.networkType} adapter coming soon` };
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const issuedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + ST_CHALLENGE_TTL_SECONDS * 1000).toISOString();

  const message = evmWalletAdapter.formatChallengeMessage({
    address: normalizedAddress,
    uid: identity.uid,
    username: identity.currentUsername,
    nonce,
    issuedAt,
    expiresAt,
  });

  const challenge: STChallenge = {
    nonce,
    uid: identity.uid,
    address: normalizedAddress,
    networkType: params.networkType,
    message,
    issuedAt: now,
    expiresAt: now + ST_CHALLENGE_TTL_SECONDS * 1000,
  };

  await kvSetChallenge(challenge);

  return { success: true, challenge };
}

/**
 * Verify a signed challenge and link the self-custody wallet to the ST Identity
 */
export async function verifyAndAssociateWallet(params: {
  uid: string;
  nonce: string;
  signature: string;
}): Promise<{ success: boolean; wallet?: STAssociatedWallet; error?: string }> {
  const challenge = await kvGetChallenge(params.nonce);
  if (!challenge) {
    return { success: false, error: 'Challenge expired or not found. Please request a new challenge.' };
  }

  if (challenge.uid !== params.uid) {
    return { success: false, error: 'Challenge does not match authenticated identity' };
  }

  if (Date.now() > challenge.expiresAt) {
    await kvBurnChallenge(params.nonce);
    return { success: false, error: 'Challenge has expired. Please try again.' };
  }

  // 1. Verify cryptographic signature
  let isValidSig = false;
  if (challenge.networkType === 'evm') {
    isValidSig = await evmWalletAdapter.verifySignature({
      address: challenge.address,
      message: challenge.message,
      signature: params.signature,
    });
  }

  if (!isValidSig) {
    return { success: false, error: 'Cryptographic signature verification failed' };
  }

  // 2. Burn challenge nonce immediately (prevent replay)
  await kvBurnChallenge(params.nonce);

  // 3. Load identity and update wallet list
  const identity = await getSTIdentityByUID(challenge.uid);
  if (!identity) {
    return { success: false, error: 'Identity not found' };
  }

  // Derive EVM supported chains from protocol constants
  const evmChains = Object.values(ST_SUPPORTED_NETWORKS)
    .filter((n) => n.networkType === 'evm')
    .map((n) => n.id);

  const walletId = `w_${challenge.networkType}_${challenge.address.toLowerCase()}`;
  const isFirstWallet = identity.wallets.length === 0;

  // Filter out any existing wallet with same address
  const updatedWallets = identity.wallets.filter((w) => w.id !== walletId);

  const newWallet: STAssociatedWallet = {
    id: walletId,
    networkType: challenge.networkType,
    address: challenge.address,
    supportedChains: challenge.networkType === 'evm' ? evmChains : [challenge.networkType],
    isPrimary: isFirstWallet || identity.wallets.every((w) => !w.isPrimary),
    verifiedAt: Date.now(),
    ownershipProof: {
      type: 'eip191_signature',
      message: challenge.message,
      signature: params.signature,
      nonce: params.nonce,
    },
  };

  updatedWallets.push(newWallet);
  identity.wallets = updatedWallets;
  identity.updatedAt = Date.now();

  // 4. Save updated identity
  if (process.env.KV_URL) {
    await kv.set(`st_identity:${identity.uid}`, identity);
  } else if (global.mockProtocolStore) {
    global.mockProtocolStore.set(`st_identity:${identity.uid}`, identity);
  }

  // 5. Emit audit event
  await logSTIdentityEvent(identity.uid, 'wallet_associated', {
    walletId,
    address: challenge.address,
    networkType: challenge.networkType,
  });

  return { success: true, wallet: newWallet };
}

/**
 * Remove an associated wallet from an ST Identity
 */
export async function removeAssociatedWallet(params: {
  uid: string;
  walletId: string;
}): Promise<{ success: boolean; error?: string }> {
  const identity = await getSTIdentityByUID(params.uid);
  if (!identity) {
    return { success: false, error: 'Identity not found' };
  }

  const existingWallet = identity.wallets.find((w) => w.id === params.walletId);
  if (!existingWallet) {
    return { success: false, error: 'Wallet not associated with this identity' };
  }

  identity.wallets = identity.wallets.filter((w) => w.id !== params.walletId);

  // If we removed the primary wallet, reassign primary to the first remaining wallet if any
  if (existingWallet.isPrimary && identity.wallets.length > 0) {
    identity.wallets[0].isPrimary = true;
  }

  identity.updatedAt = Date.now();

  if (process.env.KV_URL) {
    await kv.set(`st_identity:${identity.uid}`, identity);
  } else if (global.mockProtocolStore) {
    global.mockProtocolStore.set(`st_identity:${identity.uid}`, identity);
  }

  await logSTIdentityEvent(identity.uid, 'wallet_removed', {
    walletId: params.walletId,
    address: existingWallet.address,
  });

  return { success: true };
}

/**
 * Set an associated wallet as primary
 */
export async function setPrimaryAssociatedWallet(params: {
  uid: string;
  walletId: string;
}): Promise<{ success: boolean; error?: string }> {
  const identity = await getSTIdentityByUID(params.uid);
  if (!identity) {
    return { success: false, error: 'Identity not found' };
  }

  let found = false;
  identity.wallets = identity.wallets.map((w) => {
    if (w.id === params.walletId) {
      found = true;
      return { ...w, isPrimary: true };
    }
    return { ...w, isPrimary: false };
  });

  if (!found) {
    return { success: false, error: 'Wallet not found on this identity' };
  }

  identity.updatedAt = Date.now();

  if (process.env.KV_URL) {
    await kv.set(`st_identity:${identity.uid}`, identity);
  } else if (global.mockProtocolStore) {
    global.mockProtocolStore.set(`st_identity:${identity.uid}`, identity);
  }

  await logSTIdentityEvent(identity.uid, 'primary_wallet_changed', {
    walletId: params.walletId,
  });

  return { success: true };
}
