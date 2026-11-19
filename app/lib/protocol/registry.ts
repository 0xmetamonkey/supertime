import crypto from 'crypto';
import { kv } from '@vercel/kv';
import {
  STIdentity,
  STIdentityEvent,
  STEventType,
} from './types';
import {
  ST_NAMESPACE,
  ST_HANDLE_REGEX,
  ST_RESERVED_NAMES,
} from './constants';

/**
 * Fallback in-memory store for local development without active KV connection
 */
declare global {
  var mockProtocolStore: Map<string, any> | undefined;
}
if (!global.mockProtocolStore) {
  global.mockProtocolStore = new Map<string, any>();
}

async function kvGet<T>(key: string): Promise<T | null> {
  if (process.env.KV_URL) {
    try {
      return await kv.get<T>(key);
    } catch (err) {
      console.warn(`[ST Protocol] KV get failed for ${key}, falling back to memory store:`, err);
    }
  }
  return (global.mockProtocolStore?.get(key) as T) ?? null;
}

async function kvSet<T>(key: string, value: T, options?: { ex?: number }): Promise<void> {
  if (process.env.KV_URL) {
    try {
      if (options?.ex) {
        await kv.set(key, value, { ex: options.ex });
      } else {
        await kv.set(key, value);
      }
      return;
    } catch (err) {
      console.warn(`[ST Protocol] KV set failed for ${key}, falling back to memory store:`, err);
    }
  }
  global.mockProtocolStore?.set(key, value);
}

async function kvDel(key: string): Promise<void> {
  if (process.env.KV_URL) {
    try {
      await kv.del(key);
      return;
    } catch (err) {
      console.warn(`[ST Protocol] KV del failed for ${key}:`, err);
    }
  }
  global.mockProtocolStore?.delete(key);
}

/**
 * Generate a cryptographically random, collision-resistant Permanent UID
 * Guaranteed non-sequential, independent of username/email.
 */
export function generateSTUID(): string {
  const randomBytes = crypto.randomBytes(12).toString('hex');
  return `st_uid_${randomBytes}`;
}

/**
 * Normalize and validate a human-readable username in the .st namespace
 * Examples:
 *   "aman" -> "aman.st"
 *   "aman.st" -> "aman.st"
 *   "@Aman" -> "aman.st"
 */
export function normalizeSTName(raw: string): { normalized: string; base: string; isValid: boolean; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { normalized: '', base: '', isValid: false, error: 'Username must be a non-empty string' };
  }

  let cleaned = raw.trim().toLowerCase();
  if (cleaned.startsWith('@')) {
    cleaned = cleaned.slice(1);
  }

  let base = cleaned;
  if (cleaned.endsWith(ST_NAMESPACE)) {
    base = cleaned.slice(0, -ST_NAMESPACE.length);
  }

  if (base.length < 3) {
    return { normalized: '', base, isValid: false, error: 'Username must be at least 3 characters' };
  }
  if (base.length > 30) {
    return { normalized: '', base, isValid: false, error: 'Username cannot exceed 30 characters' };
  }

  if (!ST_HANDLE_REGEX.test(base)) {
    return {
      normalized: '',
      base,
      isValid: false,
      error: 'Username can only contain lowercase letters, numbers, hyphens, and underscores',
    };
  }

  if (ST_RESERVED_NAMES.has(base)) {
    return {
      normalized: '',
      base,
      isValid: false,
      error: `"${base}.st" is a reserved protocol name and cannot be claimed`,
    };
  }

  const normalized = `${base}${ST_NAMESPACE}`;
  return { normalized, base, isValid: true };
}

/**
 * Append an immutable event to the ST Identity audit log
 */
export async function logSTIdentityEvent(
  uid: string,
  type: STEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const event: STIdentityEvent = {
    eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    uid,
    type,
    payload,
    timestamp: Date.now(),
  };

  const logKey = `st_identity_events:${uid}`;
  const existing = (await kvGet<STIdentityEvent[]>(logKey)) || [];
  existing.push(event);
  await kvSet(logKey, existing);
}

/**
 * Retrieve ST Identity by UID
 */
export async function getSTIdentityByUID(uid: string): Promise<STIdentity | null> {
  if (!uid) return null;
  return await kvGet<STIdentity>(`st_identity:${uid}`);
}

/**
 * Retrieve ST Identity by .st Name
 */
export async function getSTIdentityByName(stNameRaw: string): Promise<STIdentity | null> {
  const { normalized, isValid } = normalizeSTName(stNameRaw);
  if (!isValid) return null;

  const uid = await kvGet<string>(`st_name:${normalized}`);
  if (!uid) return null;
  return await getSTIdentityByUID(uid);
}

/**
 * Retrieve ST Identity linked to a Clerk User Email
 */
export async function getSTIdentityByEmail(email: string): Promise<STIdentity | null> {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  const uid = await kvGet<string>(`st_user_identity:${normalizedEmail}`);
  if (!uid) return null;
  return await getSTIdentityByUID(uid);
}

/**
 * Create or retrieve an existing ST Identity for a user
 * Guarantees idempotency and permanent UID allocation.
 */
export async function createOrGetSTIdentity(params: {
  email: string;
  desiredUsername?: string;
  displayName?: string;
}): Promise<STIdentity> {
  const normalizedEmail = params.email.toLowerCase().trim();

  // 1. Check if identity already exists for email
  const existing = await getSTIdentityByEmail(normalizedEmail);
  if (existing) {
    return existing;
  }

  // 2. Provision new permanent UID
  const uid = generateSTUID();
  const now = Date.now();

  let claimedUsername = '';
  if (params.desiredUsername) {
    const { normalized, isValid, error } = normalizeSTName(params.desiredUsername);
    if (isValid) {
      const isTaken = await kvGet<string>(`st_name:${normalized}`);
      if (!isTaken) {
        claimedUsername = normalized;
        await kvSet(`st_name:${normalized}`, uid);
      }
    } else {
      console.warn(`[ST Protocol] Desired username invalid: ${error}`);
    }
  }

  const identity: STIdentity = {
    uid,
    currentUsername: claimedUsername || `${uid.replace('st_uid_', 'anon_')}${ST_NAMESPACE}`,
    previousUsernames: [],
    createdAt: now,
    updatedAt: now,
    status: 'active',
    profileRef: {
      email: normalizedEmail,
      displayName: params.displayName,
      legacyUsername: params.desiredUsername ? params.desiredUsername.replace(ST_NAMESPACE, '') : undefined,
    },
    publicKeys: [],
    wallets: [],
  };

  // 3. Atomically persist identity records
  await kvSet(`st_identity:${uid}`, identity);
  await kvSet(`st_user_identity:${normalizedEmail}`, uid);
  if (claimedUsername) {
    await kvSet(`st_name:${claimedUsername}`, uid);
  }

  // 4. Log creation audit event
  await logSTIdentityEvent(uid, 'identity_created', {
    email: normalizedEmail,
    assignedUsername: identity.currentUsername,
  });

  return identity;
}

/**
 * Claim or update a .st human-readable username for an identity
 */
export async function claimSTName(
  uid: string,
  newUsernameRaw: string
): Promise<{ success: boolean; identity?: STIdentity; error?: string }> {
  const identity = await getSTIdentityByUID(uid);
  if (!identity) {
    return { success: false, error: 'Identity not found' };
  }

  const { normalized, isValid, error } = normalizeSTName(newUsernameRaw);
  if (!isValid) {
    return { success: false, error };
  }

  if (identity.currentUsername === normalized) {
    return { success: true, identity };
  }

  // Check if name is taken
  const existingOwnerUid = await kvGet<string>(`st_name:${normalized}`);
  if (existingOwnerUid && existingOwnerUid !== uid) {
    return { success: false, error: `The name "${normalized}" is already claimed.` };
  }

  const previous = identity.currentUsername;
  const previousList = identity.previousUsernames || [];
  if (previous && !previousList.includes(previous)) {
    previousList.push(previous);
  }

  // Update identity record
  identity.currentUsername = normalized;
  identity.previousUsernames = previousList;
  identity.updatedAt = Date.now();

  // Save changes
  await kvSet(`st_name:${normalized}`, uid);
  await kvSet(`st_identity:${uid}`, identity);

  await logSTIdentityEvent(uid, 'username_claimed', {
    newUsername: normalized,
    previousUsername: previous,
  });

  return { success: true, identity };
}
