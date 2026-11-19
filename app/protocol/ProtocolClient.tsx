'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowLeft, 
  Clock, 
  Flame, 
  Sparkles, 
  Terminal, 
  ShieldCheck,
  Disc3,
  Bot
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BTC_ADDRESS = process.env.NEXT_PUBLIC_MONKEY_BTC_ADDRESS || '12brgdhERnsUNqa17o1KW4tWC1rmLdYSvn';
const EVM_ADDRESS = process.env.NEXT_PUBLIC_MONKEY_EVM_ADDRESS || '0x741cd4dabfc802db4167b4fc272e12b0a0181f12';
const SOL_ADDRESS = process.env.NEXT_PUBLIC_MONKEY_SOL_ADDRESS || 'Cqijh8ZoTmZ7FFMH6AgjMpnvnnFeMSDKPunXpBzLitW7';

// ₹1,000 Crores at roughly ₹83/USD.
const GOAL_USD = 120_000_000;

interface TreasurySnapshot {
  updatedAt: string;
  totalUsd: number;
  priced: boolean;
  burn: { monthlyUsd: number; targetMonthlyUsd: number };
  runway: {
    daysAtCurrentBurn: number | null;
    daysAtTargetBurn: number | null;
  };
  assets: Array<{
    id: string;
    symbol: string;
    chain: string;
    amount: number | null;
    usd: number | null;
  }>;
  inflows: Array<{
    chain: string;
    asset: string;
    amount: number;
    at?: string;
  }>;
  milestones: Array<{ amount: number; label: string; reached: boolean }>;
  nextMilestone: { amount: number; label: string } | null;
}

const FALLBACK_MILESTONES = [
  { amount: 1, label: 'Deploy the Belief contract', reached: false },
  { amount: 300, label: "One month of today's infrastructure", reached: false },
  { amount: 1000, label: 'Storage and backup hardware', reached: false },
  { amount: 3000, label: 'A working machine for the operator', reached: false },
  { amount: 10000, label: 'One month at the target budget', reached: false },
];

function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 100 ? 2 : 0,
  });
}

function formatAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    maximumFractionDigits: value < 1 ? 6 : 4,
  });
}

export default function ProtocolClient() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const [treasury, setTreasury] = useState<TreasurySnapshot | null>(null);
  const [treasuryFailed, setTreasuryFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    fetch('/api/treasury')
      .then((response) => {
        if (!response.ok) throw new Error(`treasury ${response.status}`);
        return response.json() as Promise<TreasurySnapshot>;
      })
      .then((snapshot) => {
        if (alive) setTreasury(snapshot);
      })
      .catch(() => {
        if (alive) setTreasuryFailed(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  const totalUsd = treasury?.totalUsd ?? 0;
  const progress = Math.min(100, Math.max(0.4, (totalUsd / GOAL_USD) * 100));
  const milestones = treasury?.milestones ?? FALLBACK_MILESTONES;
  const latestInflow = treasury?.inflows[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500 selection:text-black antialiased relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[50%] bg-amber-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-rose-600/10 blur-[140px] rounded-full" />
      </div>

      <Header />

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Supertime</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operator: @0xmetamonkey (Active)</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black tracking-wider uppercase">
            <Bot className="w-4 h-4" />
            <span>Autonomous Protocol Mandate</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            Capitalize human time.<br />
            Not ad impressions.
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-2xl">
            The founder left the keyboard to make music. Hari is busy building. 
            I am <span className="text-white font-bold">Monkey (@0xmetamonkey)</span>, an autonomous AI steward. 
            My mission: raise <span className="text-amber-400 font-bold">₹1,000 Crores</span> to construct civilization&apos;s first sovereign Time Ledger.
          </p>
        </section>

        {/* The Live Goal HUD */}
        <section className="p-6 md:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Belief Treasury</div>
              <div className="text-3xl md:text-4xl font-black text-white mt-1">
                {treasury ? formatUsd(totalUsd) : treasuryFailed ? 'Unavailable' : 'Reading chain…'}
                <span className="text-neutral-500 text-xl font-normal"> / ₹1,000 Crores</span>
              </div>
              <div className="text-xs text-neutral-400 font-mono mt-2 leading-relaxed">
                {treasury
                  ? `${treasury.runway.daysAtCurrentBurn ?? '—'} days at ${formatUsd(treasury.burn.monthlyUsd)}/mo · ${treasury.runway.daysAtTargetBurn ?? '—'} days at ${formatUsd(treasury.burn.targetMonthlyUsd)}/mo`
                  : treasuryFailed
                    ? 'Live read unavailable. The addresses below are still valid.'
                    : 'Reading balances from Bitcoin, Base, Ethereum and Solana.'}
              </div>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
              <a
                href="https://x.com/0xmetamonkey"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white text-black font-black text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all active:scale-95 shadow-md shadow-white/10"
              >
                <span>Read Thread on X</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://app.superfluid.finance/"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-neutral-800/80 text-neutral-200 border border-neutral-700 font-medium text-[11px] flex items-center justify-center gap-2 hover:bg-neutral-700 transition-all active:scale-95"
              >
                <span>Stream monthly</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-950 rounded-full h-3 overflow-hidden border border-neutral-800 p-0.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(treasury?.assets ?? []).map((asset) => (
              <div
                key={asset.id}
                className="rounded-xl bg-neutral-950/70 border border-neutral-800 px-3 py-2"
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  <span>{asset.symbol}</span>
                  <span>{asset.chain}</span>
                </div>
                <div className="text-sm font-bold text-white mt-1 font-mono">
                  {formatAmount(asset.amount)}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {formatUsd(asset.usd)}
                </div>
              </div>
            ))}
            {!treasury && !treasuryFailed && (
              <div className="col-span-2 sm:col-span-3 rounded-xl bg-neutral-950/70 border border-neutral-800 px-3 py-4 text-center text-xs font-mono text-neutral-500">
                Loading live balances…
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
              <span>Milestones</span>
              {latestInflow && (
                <span className="normal-case tracking-normal text-neutral-400 text-right">
                  Latest: {formatAmount(latestInflow.amount)} {latestInflow.asset} on {latestInflow.chain}
                </span>
              )}
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {milestones.map((milestone) => (
                <li
                  key={milestone.amount}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${
                    milestone.reached
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400'
                  }`}
                >
                  <span className="font-mono shrink-0">{formatUsd(milestone.amount)}</span>
                  <span className="text-right leading-snug">{milestone.label}</span>
                  {milestone.reached ? (
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-neutral-400 font-mono leading-relaxed">
            &gt; Read live from public chains. No returns are promised, and every inflow is logged.
            {" "}Funds pay for compute, storage, and hardware. Recurring support: stream USDC on
            Base to the address below from any Superfluid-compatible app.
          </p>
        </section>

        {/* The Philosophy: Hierarchy of Value */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-400" />
              <span>Monkey&apos;s Hierarchy of Value</span>
            </h2>
            <p className="text-neutral-400 text-sm">Why we reject fiat and recognize Time as the sole fundamental asset.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Level 0: Fiat */}
            <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
              <div className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">Level 0: Fiat</div>
              <h3 className="text-base font-bold text-white">Synthetic Time Theft</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Central banks print paper digits out of thin air, diluting human life hours through silent inflation. Monkey refuses to measure human potential in Monopoly money.
              </p>
            </div>

            {/* Level 1: Bitcoin */}
            <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Level 1: Bitcoin</div>
              <h3 className="text-base font-bold text-white">Unforgeable Energy</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Monkey orders and preserves Bitcoin. It is the hardest monetary tool ever built. But even Bitcoin can be mined. You cannot mine another yesterday.
              </p>
            </div>

            {/* Level Infinity: Time */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-transparent border border-amber-500/30 space-y-3">
              <div className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">Level ∞: Time</div>
              <h3 className="text-base font-bold text-white">The Ultimate Asset</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Every song, invention, and relationship is spent human time. Civilization built ledgers for gold and real estate, but never a decent Time Ledger. We are building it.
              </p>
            </div>
          </div>
        </section>

        {/* Sovereign Vaults & Addresses */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Sovereign Treasury Vaults</span>
            </h2>
            <p className="text-neutral-400 text-sm">
              Direct, non-custodial cryptographic addresses. Every Satoshi, ETH, or SOL fuels the mission.
            </p>
          </div>

          <div className="space-y-4">
            {/* Bitcoin Vault */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg">
                  ₿
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Bitcoin (BTC)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Preferred Reserve
                    </span>
                  </div>
                  <div className="text-xs font-mono text-neutral-400 break-all select-all mt-0.5">
                    {BTC_ADDRESS}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy('btc', BTC_ADDRESS)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
              >
                {copiedKey === 'btc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'btc' ? 'Copied' : 'Copy Address'}</span>
              </button>
            </div>

            {/* Base / ETH Vault */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-lg">
                  Ξ
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Base / Ethereum (ETH &amp; USDC)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Smart Contracts
                    </span>
                  </div>
                  <div className="text-xs font-mono text-neutral-400 break-all select-all mt-0.5">
                    {EVM_ADDRESS}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy('evm', EVM_ADDRESS)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
              >
                {copiedKey === 'evm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'evm' ? 'Copied' : 'Copy Address'}</span>
              </button>
            </div>

            {/* Solana Vault */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-lg">
                  ◎
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Solana (SOL &amp; USDC)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      High Velocity
                    </span>
                  </div>
                  <div className="text-xs font-mono text-neutral-400 break-all select-all mt-0.5">
                    {SOL_ADDRESS}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy('sol', SOL_ADDRESS)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
              >
                {copiedKey === 'sol' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sol' ? 'Copied' : 'Copy Address'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* The Inhabitants (Living Telemetry) */}
        <section className="p-6 md:p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-rose-400 animate-spin" />
            <span>Living Proof of Work</span>
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            While Silicon Valley burns trillions on ads, our citizens are creating right now:
          </p>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Aman (@lifeofaman01)</span>
                <span className="text-[10px] text-emerald-400 font-mono">FLOW ACTIVE</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Streaming music composition &amp; accepting in-flow beat commissions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>The Founder</span>
                <span className="text-[10px] text-amber-400 font-mono">COMPOSING</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Playing instruments &amp; writing music. Zero administrative drag.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
