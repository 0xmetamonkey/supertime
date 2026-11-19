import { STNameResolution, STSupportedNetwork } from './types';
import { ST_SUPPORTED_NETWORKS } from './constants';
import { getSTIdentityByName, normalizeSTName } from './registry';

export interface ResolveSTNameResult {
  success: boolean;
  resolution?: STNameResolution;
  error?: 'INVALID_NAME' | 'UNSUPPORTED_NETWORK' | 'NAME_NOT_FOUND' | 'NO_WALLET_FOR_NETWORK';
  message?: string;
  supportedNetworks?: string[];
}

/**
 * Universal ST Name Resolver
 *
 * Resolves an ST Name (e.g. "aman.st" or "aman") + Network (e.g. "base", "ethereum")
 * to a chain-specific receiving address.
 *
 * Zero-Substitution Guarantee:
 * Never returns a different chain address if the requested network is not registered.
 */
export async function resolveSTName(
  stNameRaw: string,
  requestedNetworkRaw: string
): Promise<ResolveSTNameResult> {
  // 1. Validate requested network
  const networkId = (requestedNetworkRaw || '').trim().toLowerCase();
  const networkConfig: STSupportedNetwork | undefined = ST_SUPPORTED_NETWORKS[networkId];

  if (!networkConfig) {
    return {
      success: false,
      error: 'UNSUPPORTED_NETWORK',
      message: `Network "${networkId}" is not supported by the ST Protocol.`,
      supportedNetworks: Object.keys(ST_SUPPORTED_NETWORKS),
    };
  }

  // 2. Validate and normalize the ST Name
  const { normalized, isValid, error } = normalizeSTName(stNameRaw);
  if (!isValid) {
    return {
      success: false,
      error: 'INVALID_NAME',
      message: error || 'Invalid ST name provided.',
    };
  }

  // 3. Retrieve Identity
  const identity = await getSTIdentityByName(normalized);
  if (!identity || identity.status !== 'active') {
    return {
      success: false,
      error: 'NAME_NOT_FOUND',
      message: `The ST Name "${normalized}" does not exist or is inactive.`,
    };
  }

  // 4. Find matching wallet for requested network
  // A wallet matches if its networkType equals the requested network's type (e.g. 'evm')
  // AND its supportedChains includes the specific chain id (e.g. 'base')
  const matchingWallets = identity.wallets.filter((w) => {
    if (w.networkType !== networkConfig.networkType) return false;
    if (networkConfig.networkType === 'evm') {
      return w.supportedChains.includes(networkConfig.id);
    }
    return true;
  });

  if (matchingWallets.length === 0) {
    return {
      success: false,
      error: 'NO_WALLET_FOR_NETWORK',
      message: `No wallet associated with "${normalized}" supports the "${networkConfig.name}" network.`,
    };
  }

  // Prefer primary wallet if flagged, otherwise first verified wallet
  const selectedWallet = matchingWallets.find((w) => w.isPrimary) || matchingWallets[0];

  const resolution: STNameResolution = {
    stName: normalized,
    uid: identity.uid,
    network: networkConfig.id,
    address: selectedWallet.address,
    isPrimary: selectedWallet.isPrimary,
    verifiedAt: selectedWallet.verifiedAt,
  };

  return {
    success: true,
    resolution,
  };
}

/**
 * Get all supported networks and metadata
 */
export function getSupportedSTNetworks(): STSupportedNetwork[] {
  return Object.values(ST_SUPPORTED_NETWORKS);
}
