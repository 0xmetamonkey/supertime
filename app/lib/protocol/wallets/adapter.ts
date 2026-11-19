import { STNetworkType } from '../types';

export interface VerifySignatureParams {
  address: string;
  message: string;
  signature: string;
}

export interface IWalletAdapter {
  networkType: STNetworkType;
  validateAddress(address: string): boolean;
  normalizeAddress(address: string): string;
  verifySignature(params: VerifySignatureParams): Promise<boolean>;
  formatChallengeMessage(params: {
    address: string;
    uid: string;
    username: string;
    nonce: string;
    issuedAt: string;
    expiresAt: string;
  }): string;
}
