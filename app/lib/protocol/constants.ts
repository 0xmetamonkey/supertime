import { STSupportedNetwork } from './types';

/**
 * Protocol Namespace Constants
 */
export const ST_NAMESPACE = '.st';
export const ST_CHALLENGE_TTL_SECONDS = 300; // 5 minutes

/**
 * Handle constraints
 * - 3 to 30 characters
 * - lowercase alphanumeric, hyphens, underscores
 */
export const ST_HANDLE_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

/**
 * Reserved System Namespaces & Accounts
 * Cannot be claimed by regular users to prevent impersonation and routing conflicts.
 */
export const ST_RESERVED_NAMES = new Set([
  'admin',
  'supertime',
  'st',
  'protocol',
  'api',
  'system',
  'operator',
  'monkey',
  'router',
  'resolver',
  'registry',
  'vault',
  'null',
  'undefined',
  'root',
  'help',
  'support',
  'billing',
  'auth',
  'login',
  'signup',
  'dashboard',
  'studio',
  'chat',
  'roulette',
  'talktime',
  'live',
  'explore',
  'wallet',
  'fundraise',
  'treasury',
  'dao',
  'token',
  'genesis'
]);

/**
 * Supported Blockchain Networks
 * Modular list of chains recognized by the Protocol Name Resolver.
 */
export const ST_SUPPORTED_NETWORKS: Record<string, STSupportedNetwork> = {
  // EVM Mainnets
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    networkType: 'evm',
    chainId: 1,
  },
  base: {
    id: 'base',
    name: 'Base',
    networkType: 'evm',
    chainId: 8453,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon PoS',
    networkType: 'evm',
    chainId: 137,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    networkType: 'evm',
    chainId: 42161,
  },
  optimism: {
    id: 'optimism',
    name: 'OP Mainnet',
    networkType: 'evm',
    chainId: 10,
  },

  // Future Adapters
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    networkType: 'bitcoin',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    networkType: 'solana',
  },
};

export const EVM_CHAIN_IDS: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
};
