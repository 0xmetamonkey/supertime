/**
 * ST ID Protocol (The Protocol) — Type Definitions (v0.1)
 *
 * Core principles:
 * 1. Globally unique, permanent UID independent of username and email.
 * 2. Human-readable namespace (`.st`).
 * 3. Multi-wallet self-custody with signed challenge ownership proofs.
 * 4. Zero custody of private keys; zero unilateral access to funds.
 */

export type STNetworkType = 'evm' | 'bitcoin' | 'solana';

export type STAccountStatus = 'active' | 'suspended';

export interface STPublicKey {
  keyId: string;
  keyType: 'ed25519' | 'secp256k1';
  publicKey: string;
  addedAt: number;
}

export interface STOwnershipProof {
  type: 'eip191_signature';
  message: string;
  signature: string;
  nonce: string;
}

export interface STAssociatedWallet {
  id: string; // e.g. "w_evm_0x741cd4dabfc802db4167b4fc272e12b0a0181f12"
  networkType: STNetworkType;
  address: string; // normalized, checksummed if EVM
  supportedChains: string[]; // ["ethereum", "base", "polygon", "arbitrum", "optimism"]
  isPrimary: boolean;
  verifiedAt: number;
  ownershipProof: STOwnershipProof;
}

export interface STProfileRef {
  email: string;
  displayName?: string;
  legacyUsername?: string;
}

export interface STIdentity {
  uid: string; // "st_uid_..."
  currentUsername: string; // "aman.st"
  previousUsernames: string[];
  createdAt: number;
  updatedAt: number;
  status: STAccountStatus;
  profileRef: STProfileRef;
  publicKeys: STPublicKey[];
  wallets: STAssociatedWallet[];
}

export type STEventType =
  | 'identity_created'
  | 'username_claimed'
  | 'username_updated'
  | 'wallet_associated'
  | 'wallet_removed'
  | 'primary_wallet_changed';

export interface STIdentityEvent {
  eventId: string;
  uid: string;
  type: STEventType;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface STChallenge {
  nonce: string;
  uid: string;
  address: string;
  networkType: STNetworkType;
  message: string;
  issuedAt: number;
  expiresAt: number;
}

export interface STNameResolution {
  stName: string; // "aman.st"
  uid: string; // "st_uid_..."
  network: string; // "base", "ethereum", etc.
  address: string; // "0x..."
  isPrimary: boolean;
  verifiedAt: number;
}

export interface STSupportedNetwork {
  id: string; // "base"
  name: string; // "Base"
  networkType: STNetworkType;
  chainId?: number;
  isTestnet?: boolean;
}
