/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Store,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import SetupChecklist from './SetupChecklist';

interface OverviewTabProps {
  username: string | null;
  withdrawable: number;
  balance: number;
  initialSettings?: any;
  setActiveTab: (tab: string) => void;
  onOpenQrModal?: () => void;
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
};

export default function OverviewTab({ username, withdrawable, balance, initialSettings, setActiveTab, onOpenQrModal }: OverviewTabProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://supertime.wtf';
  const cleanUsername = (username || '').replace(/^@+/, '').trim().toLowerCase();
  const profileUrl = cleanUsername ? `${baseUrl}/${cleanUsername}` : '';

  useEffect(() => {
    if (!cleanUsername) return;
    let isMounted = true;
    setIsGeneratingQr(true);

    QRCode.toDataURL(profileUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#0a0a0a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate preview QR:', err);
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanUsername, profileUrl]);

  const handleCopyLink = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `${cleanUsername}-qr-code.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!profileUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${cleanUsername} on Supertime`,
          text: `Check out @${cleanUsername} on Supertime`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      {/* HEADER SECTION */}
      <motion.section variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            Welcome, <span className="text-muted">{username || 'Explorer'}</span>.
          </h1>
          <p className="text-sm text-muted mt-1">Here&apos;s how your presence is doing today</p>
        </div>
        {username && (
          <div className="flex items-center gap-3">
            {onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className="flex items-center gap-2 bg-surface border border-border text-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-foreground/5 transition-colors shadow-sm cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </button>
            )}
            <button
              onClick={() => window.open('/studio', '_blank')}
              className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Access Studio
            </button>
          </div>
        )}
      </motion.section>

      {/* SETUP CHECKLIST */}
      <SetupChecklist
        username={username || ''}
        initialSettings={initialSettings}
        onNavigateTab={setActiveTab}
        onOpenQrModal={onOpenQrModal}
      />

      {/* CREATOR ID & QR CODE CARD */}
      {username && (
        <motion.div
          variants={itemVariants}
          className="bg-surface border border-border p-6 rounded-2xl shadow-sm transition-colors mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Scannable QR thumbnail + User info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* QR Code thumbnail */}
              <div
                onClick={onOpenQrModal}
                className="relative group cursor-pointer shrink-0 w-28 h-28 bg-white dark:bg-white rounded-2xl p-2 border border-border shadow-sm flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-foreground/20 transition-all"
                title="Click to expand & customize QR Pass"
              >
                {isGeneratingQr || !qrDataUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1.5">
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-medium">Loading...</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={qrDataUrl}
                      alt={`QR code for ${cleanUsername}`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {/* Centered S watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-6 h-6 rounded-md bg-zinc-950 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                        S
                      </div>
                    </div>
                    {/* Hover overlay hint */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                  </>
                )}
              </div>

              {/* Text metadata */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-foreground">Creator ID & QR Code</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">Ready</span>
                </div>
                <p className="text-xs text-muted mt-1 max-w-lg">
                  Instant scannable QR code for your profile. Download high-resolution PNGs or generate full digital creator passes for social stories, stream overlays, and print.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs font-mono text-muted">
                    ID: <span className="text-foreground font-semibold">@{cleanUsername}</span>
                  </span>
                  <span className="text-xs text-muted">•</span>
                  <a
                    href={`/${cleanUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-muted hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    supertime.wtf/{cleanUsername}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: QR Code Action Options */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-end lg:self-center shrink-0">
              {onOpenQrModal && (
                <button
                  onClick={onOpenQrModal}
                  className="px-4 py-2.5 bg-foreground text-background font-medium text-xs sm:text-sm rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  title="Open Pass customizer with color themes and branded card"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Customize & Pass</span>
                </button>
              )}

              <button
                onClick={handleDownloadQR}
                disabled={!qrDataUrl}
                className="px-3.5 py-2.5 bg-surface border border-border text-foreground font-medium text-xs sm:text-sm rounded-xl hover:bg-foreground/5 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                title="Download direct QR code PNG image"
              >
                <Download className="w-4 h-4" />
                <span>Download QR</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 bg-surface border border-border text-foreground font-medium text-xs sm:text-sm rounded-xl hover:bg-foreground/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Copy profile link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="px-3.5 py-2.5 bg-surface border border-border text-foreground font-medium text-xs sm:text-sm rounded-xl hover:bg-foreground/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Share QR profile"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ANALYTICS GRID */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Earnings Card */}
        <motion.div variants={itemVariants} className="bg-surface border border-border text-foreground p-6 rounded-2xl shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Total Earnings</span>
              <h2 className="text-3xl font-medium mt-2">₹{withdrawable.toLocaleString()}</h2>
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">First month</span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <motion.div initial={{ width: 0 }} animate={{ width: '10%' }} className="h-full bg-blue-500 rounded-full" />
          </div>
          <p className="text-xs text-muted mt-3">₹0 pending clearance</p>
          <button
            onClick={() => setActiveTab('wallet')}
            className="w-full py-2.5 bg-background text-foreground text-xs font-semibold rounded-lg hover:bg-surface transition-colors flex items-center justify-center gap-2 mt-4"
          >
            Wallet & Payouts <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </motion.div>

        {/* Storefront Card */}
        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-2xl border border-border shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Storefront</span>
              <h2 className="text-3xl font-medium text-foreground mt-2">Your Store</h2>
            </div>
            <Store className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted">Active Products</span>
              <span className="font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted">Booking Templates</span>
              <span className="font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted">Digital Revenue</span>
              <span className="font-semibold text-foreground">₹0</span>
            </div>
            <button
              onClick={() => setActiveTab('storefront')}
              className="w-full py-2.5 bg-background text-foreground text-xs font-semibold rounded-lg hover:bg-surface transition-colors flex items-center justify-center gap-2 mt-2"
            >
              Configure Storefront <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
