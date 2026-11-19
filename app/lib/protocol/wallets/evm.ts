import { isAddress, getAddress, verifyMessage } from 'viem';
import { IWalletAdapter, VerifySignatureParams } from './adapter';

export class EVMWalletAdapter implements IWalletAdapter {
  networkType = 'evm' as const;

  validateAddress(address: string): boolean {
    return isAddress(address);
  }

  normalizeAddress(address: string): string {
    return getAddress(address);
  }

  formatChallengeMessage(params: {
    address: string;
    uid: string;
    username: string;
    nonce: string;
    issuedAt: string;
    expiresAt: string;
  }): string {
    return [
      `supertime.wtf wants you to sign in with your Ethereum account:`,
      `${params.address}`,
      ``,
      `Bind wallet to ST Identity:`,
      `Permanent UID: ${params.uid}`,
      `Username: ${params.username}`,
      ``,
      `URI: https://supertime.wtf`,
      `Version: 1`,
      `Nonce: ${params.nonce}`,
      `Issued At: ${params.issuedAt}`,
      `Expiration Time: ${params.expiresAt}`,
    ].join('\n');
  }

  async verifySignature({ address, message, signature }: VerifySignatureParams): Promise<boolean> {
    try {
      if (!this.validateAddress(address)) return false;
      const valid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
      return valid;
    } catch (err) {
      console.warn('[EVMWalletAdapter] Signature verification failed:', err);
      return false;
    }
  }
}

export const evmWalletAdapter = new EVMWalletAdapter();
