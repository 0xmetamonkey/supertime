'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Wallet,
  Globe,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface STIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string; // e.g. "aman" or "aman.st"
}

export default function STIdentityModal({ isOpen, onClose, username }: STIdentityModalProps) {
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('base');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const lookupName = username.endsWith('.st') ? username : `${username}.st`;

    fetch(`/api/st/identity/${encodeURIComponent(lookupName)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.identity) {
          setIdentity(data.identity);
        }
      })
      .catch((err) => console.error('Failed to load identity modal data:', err))
      .finally(() => setLoading(false));
  }, [isOpen, username]);

  useEffect(() => {
    if (!isOpen) return;
    setResolving(true);
    const lookupName = username.endsWith('.st') ? username : `${username}.st`;

    fetch(`/api/st/resolve?name=${encodeURIComponent(lookupName)}&network=${encodeURIComponent(selectedNetwork)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.resolution?.address) {
          setResolvedAddress(data.resolution.address);
        } else {
          setResolvedAddress(null);
        }
      })
      .catch(() => setResolvedAddress(null))
      .finally(() => setResolving(false));
  }, [isOpen, username, selectedNetwork]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const canonicalName = username.endsWith('.st') ? username : `${username}.st`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface text-foreground border border-border shadow-2xl rounded-3xl w-full max-w-md p-6 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>{canonicalName}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </h3>
                <p className="text-[11px] text-muted font-mono">Universal ST Identity</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="py-5 space-y-5">
            {/* Permanent UID Badge */}
            <div className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase font-mono text-muted tracking-wider">Permanent UID</div>
                <div className="text-xs font-mono font-bold text-foreground truncate max-w-[240px]">
                  {loading ? 'Resolving...' : (identity?.uid || 'st_uid_unregistered')}
                </div>
              </div>
              {identity?.uid && (
                <button
                  onClick={() => handleCopy('modal-uid', identity.uid)}
                  className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                  title="Copy UID"
                >
                  {copiedKey === 'modal-uid' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Network Resolver Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Resolve Payment Address</span>
                <span className="text-[10px] text-muted font-mono">ST Name Resolver</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'base', label: 'Base' },
                  { id: 'ethereum', label: 'Ethereum' },
                  { id: 'polygon', label: 'Polygon' },
                ].map((net) => (
                  <button
                    key={net.id}
                    onClick={() => setSelectedNetwork(net.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      selectedNetwork === net.id
                        ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                        : 'bg-background text-muted border-border hover:border-foreground/30'
                    }`}
                  >
                    {net.label}
                  </button>
                ))}
              </div>

              {/* Resolved Output Box */}
              <div className="p-3.5 rounded-xl bg-background border border-border mt-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-muted uppercase">
                    Receiving Address ({selectedNetwork})
                  </div>
                  {resolving && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
                </div>

                {resolving ? (
                  <div className="text-xs text-muted py-1 font-mono">Resolving on-chain...</div>
                ) : resolvedAddress ? (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-mono font-bold text-foreground break-all">
                      {resolvedAddress}
                    </span>
                    <button
                      onClick={() => handleCopy('resolved-addr', resolvedAddress)}
                      className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                      title="Copy Address"
                    >
                      {copiedKey === 'resolved-addr' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-muted py-1">
                    No verified wallet registered for {selectedNetwork} yet.
                  </div>
                )}
              </div>
            </div>

            {/* Self-Custody Guarantee Notice */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-muted space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Self-Custody Guarantee</span>
              </div>
              <p className="leading-relaxed">
                Supertime never holds private keys. All addresses are verified through cryptographic challenge signatures.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
