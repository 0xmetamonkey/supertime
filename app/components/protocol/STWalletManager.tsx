'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Wallet,
  Plus,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  Key,
  Globe,
  Star
} from 'lucide-react';
import { STIdentity, STAssociatedWallet } from '@/app/lib/protocol/types';

export default function STWalletManager() {
  const [identity, setIdentity] = useState<STIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchIdentity = async () => {
    try {
      const res = await fetch('/api/st/identity/me');
      if (res.ok) {
        const data = await res.json();
        if (data.identity) {
          setIdentity(data.identity);
        }
      }
    } catch (err: any) {
      console.error('[STWalletManager] Failed to load identity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentity();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConnectWallet = async () => {
    setError(null);
    setConnecting(true);

    try {
      // 1. Check if window.ethereum exists
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or Rabby.');
      }

      const ethereum = (window as any).ethereum;

      // 2. Request user account
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No account selected in your wallet.');
      }
      const address = accounts[0];

      // 3. Request challenge nonce from ST ID Protocol
      const challengeRes = await fetch('/api/st/wallet/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, networkType: 'evm' }),
      });
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok || !challengeData.challenge) {
        throw new Error(challengeData.error || 'Failed to generate wallet verification challenge.');
      }

      // 4. Request EIP-191 personal signature from user's self-custody wallet
      const message = challengeData.challenge.message;
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // 5. Submit signature for server-side verification and association
      const verifyRes = await fetch('/api/st/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce: challengeData.challenge.nonce,
          signature,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.wallet) {
        throw new Error(verifyData.error || 'Cryptographic signature verification failed.');
      }

      // 6. Refresh identity
      await fetchIdentity();
    } catch (err: any) {
      console.error('[STWalletManager] Connect error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleRemoveWallet = async (walletId: string) => {
    if (!confirm('Are you sure you want to remove this wallet from your ST Identity?')) return;
    try {
      const res = await fetch(`/api/st/wallet/${encodeURIComponent(walletId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchIdentity();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove wallet');
      }
    } catch (err: any) {
      alert(err.message || 'Error removing wallet');
    }
  };

  const handleSetPrimary = async (walletId: string) => {
    try {
      const res = await fetch(`/api/st/wallet/${encodeURIComponent(walletId)}`, {
        method: 'PATCH',
      });
      if (res.ok) {
        await fetchIdentity();
      }
    } catch (err: any) {
      console.error('Failed to set primary wallet:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-border flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identity Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-surface to-background border border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ST ID Protocol (v0.1)</span>
            </div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>{identity?.currentUsername || 'Anonymous'}</span>
            </h3>
            <div className="flex items-center gap-2 text-xs font-mono text-muted">
              <span>UID: {identity?.uid}</span>
              <button
                onClick={() => identity && handleCopy('uid', identity.uid)}
                className="hover:text-foreground transition-colors"
                title="Copy permanent UID"
              >
                {copiedKey === 'uid' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleConnectWallet}
            disabled={connecting}
            className="px-4 py-2.5 rounded-xl bg-foreground text-background font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Connect Self-Custody Wallet</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Connected Wallets List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
            Associated Self-Custody Wallets ({identity?.wallets.length || 0})
          </h4>
          <span className="text-[11px] text-muted">Zero-custody: Keys remain exclusively in your wallet</span>
        </div>

        {(!identity?.wallets || identity.wallets.length === 0) ? (
          <div className="p-8 rounded-2xl bg-surface border border-dashed border-border text-center space-y-2">
            <Wallet className="w-8 h-8 text-muted mx-auto opacity-50" />
            <p className="text-sm font-medium text-foreground">No Web3 wallets linked yet</p>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              Link an Ethereum, Base, or Polygon address to receive on-chain belief stakes resolved through your <span className="font-mono text-foreground">{identity?.currentUsername}</span> handle.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {identity.wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-foreground/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-foreground break-all">
                      {wallet.address}
                    </span>
                    {wallet.isPrimary && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>Primary</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted uppercase font-mono">{wallet.networkType}</span>
                    <span className="text-muted text-[10px]">•</span>
                    <span className="text-[10px] text-muted">
                      Chains: {wallet.supportedChains.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(wallet.id, wallet.address)}
                    className="p-2 rounded-lg hover:bg-background text-muted hover:text-foreground transition-colors cursor-pointer"
                    title="Copy Address"
                  >
                    {copiedKey === wallet.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {!wallet.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(wallet.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-muted hover:text-foreground hover:bg-background transition-colors cursor-pointer"
                    >
                      Set Primary
                    </button>
                  )}

                  <button
                    onClick={() => handleRemoveWallet(wallet.id)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove Wallet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
