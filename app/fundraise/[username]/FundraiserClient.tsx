/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import {
  Heart,
  Share2,
  Copy,
  CheckCircle,
  Zap,
  Users,
  ArrowRight,
  MessageCircle,
  X,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FundraiserClientProps {
  username: string;
  fundraiser: {
    title: string;
    story: string;
    videoUrl?: string;
    imageUrl?: string;
    goalAmount: number;
    raisedAmount: number;
    donorCount: number;
    createdAt: string;
    isActive: boolean;
  };
  supporters: { name: string; amount: number; date: string }[];
  profileImage: string;
}

export default function FundraiserClient({
  username,
  fundraiser,
  supporters: initialSupporters,
  profileImage,
}: FundraiserClientProps) {
  const [donateAmount, setDonateAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [raisedAmount, setRaisedAmount] = useState(fundraiser.raisedAmount);
  const [donorCount, setDonorCount] = useState(fundraiser.donorCount);
  const [supporters, setSupporters] = useState(initialSupporters);

  const progressPercent = Math.min(100, Math.round((raisedAmount / fundraiser.goalAmount) * 100));
  const daysActive = Math.max(1, Math.ceil((Date.now() - new Date(fundraiser.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

  const handleDonate = async () => {
    const amount = parseInt(donateAmount);
    if (!amount || amount < 1) return;

    setIsDonating(true);
    try {
      // 1. Create order
      const res = await fetch('/api/fundraise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-order', amount, username }),
      });
      const order = await res.json();
      if (!order.orderId) {
        setIsDonating(false);
        return;
      }

      // 2. Open Razorpay
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: `Support ${username}`,
        description: fundraiser.title,
        image: profileImage || undefined,
        handler: async (response: any) => {
          // 3. Verify and record
          await fetch('/api/fundraise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify',
              username,
              amount,
              donorName: donorName || 'Anonymous',
              razorpay_payment_id: response.razorpay_payment_id,
            }),
          });

          setRaisedAmount(prev => prev + amount);
          setDonorCount(prev => prev + 1);
          setSupporters(prev => [{ name: donorName || 'Anonymous', amount, date: new Date().toISOString() }, ...prev]);
          setDonateSuccess(true);
          setShowDonateModal(false);
          setTimeout(() => setDonateSuccess(false), 5000);
        },
        theme: { color: '#FF6B9D' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Donation error:', err);
    } finally {
      setIsDonating(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://supertime.wtf/fundraise/${username}`;

  const handleShare = (platform: 'copy' | 'whatsapp' | 'x') => {
    const text = `${fundraiser.title} — Please support @${username} 🙏`;
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + shareUrl)}`, '_blank');
    } else if (platform === 'x') {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    }
  };

  const presetAmounts = [199, 499, 999, 2999, 4999];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* SUCCESS BANNER */}
      <AnimatePresence>
        {donateSuccess && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-neo-green text-background py-4 text-center border-b border-border shadow-sm"
          >
            <p className="font-semibold text-sm">Thank you for your support! 💛 Your generosity means the world.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-neo-pink" />
            <span className="text-sm font-bold tracking-tight">Supertime</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleShare('copy')}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-border rounded-lg font-medium text-xs bg-surface hover:bg-background transition-colors shadow-sm"
            >
              {copiedLink ? <><CheckCircle className="w-3.5 h-3.5 text-neo-green" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Share</>}
            </button>
            <button
              onClick={() => setShowDonateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg font-medium text-xs bg-neo-pink text-white hover:opacity-90 transition-opacity shadow-sm"
            >
              <Heart className="w-3.5 h-3.5" /> Donate Now
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* LEFT: STORY */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Image or Video */}
            {(fundraiser.videoUrl || fundraiser.imageUrl) && (
              <div className="border border-border shadow-sm rounded-2xl overflow-hidden bg-background">
                {fundraiser.videoUrl ? (
                  <video
                    src={fundraiser.videoUrl}
                    controls
                    poster={fundraiser.imageUrl || undefined}
                    className="w-full aspect-video object-cover"
                  />
                ) : fundraiser.imageUrl ? (
                  <img src={fundraiser.imageUrl} alt={fundraiser.title} className="w-full aspect-video object-cover" />
                ) : null}
              </div>
            )}

            {/* Creator Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 border border-border shadow-sm rounded-full overflow-hidden bg-background shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} className="w-full h-full" />
                )}
              </div>
              <div>
                <a href={`/${username}`} className="font-bold text-lg tracking-tight hover:text-neo-pink transition-colors">
                  @{username}
                </a>
                <p className="text-[10px] font-medium text-muted uppercase tracking-widest mt-1">Organizer · {daysActive} day{daysActive > 1 ? 's' : ''} active</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-none text-foreground">
              {fundraiser.title}
            </h1>

            {/* Story */}
            <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface shadow-sm">
              <h3 className="text-base font-semibold flex items-center gap-2 pb-4 border-b border-border text-foreground mb-6">
                <MessageCircle className="w-5 h-5 text-muted" /> The Story
              </h3>
              <div className="prose-sm max-w-none">
                {fundraiser.story.split('\n').map((paragraph, i) => (
                  <p key={i} className="text-sm font-medium text-foreground leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Share Strip */}
            <div className="border border-border p-6 rounded-2xl bg-surface shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-muted">Share this fundraiser — every share helps 💛</p>
              <div className="flex gap-3">
                <button onClick={() => handleShare('whatsapp')} className="flex-1 py-3 bg-[#25D366] text-white border border-transparent rounded-xl font-medium text-xs shadow-sm hover:opacity-90 transition-opacity">
                  WhatsApp
                </button>
                <button onClick={() => handleShare('x')} className="flex-1 py-3 bg-foreground text-background border border-transparent rounded-xl font-medium text-xs shadow-sm hover:opacity-90 transition-opacity">
                  Post on 𝕏
                </button>
                <button onClick={() => handleShare('copy')} className="flex-1 py-3 bg-background text-foreground border border-border rounded-xl font-medium text-xs shadow-sm hover:bg-surface transition-colors">
                  {copiedLink ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Supporters */}
            {supporters.length > 0 && (
              <div className="border border-border p-6 md:p-8 rounded-2xl bg-surface shadow-sm">
                <h3 className="text-base font-semibold flex items-center gap-2 pb-4 border-b border-border text-foreground mb-6">
                  <Users className="w-5 h-5 text-muted" /> Supporters ({donorCount})
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {supporters.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-neo-pink/10 border border-neo-pink/20 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4 text-neo-pink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{s.name}</p>
                        <p className="text-[10px] font-medium text-muted mt-0.5">
                          {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className="font-semibold text-neo-green text-lg">₹{s.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: DONATION CARD (Sticky) */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              {/* Progress Card */}
              <div className="border border-border rounded-2xl bg-surface p-6 md:p-8 shadow-sm">
                {/* Raised Amount */}
                <div className="mb-1">
                  <span className="text-4xl md:text-5xl font-bold tabular-nums text-neo-green">
                    ₹{raisedAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-widest mb-6">
                  raised of <span className="text-foreground font-semibold">₹{fundraiser.goalAmount.toLocaleString()}</span> goal
                </p>

                {/* Progress Bar */}
                <div className="h-4 bg-background border border-border rounded-full overflow-hidden mb-6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-neo-green"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-background border border-border rounded-xl text-center">
                    <span className="block text-2xl font-bold text-foreground">{donorCount}</span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted mt-1">Supporters</span>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-xl text-center">
                    <span className="block text-2xl font-bold text-foreground">{progressPercent}%</span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted mt-1">Funded</span>
                  </div>
                </div>

                {/* Quick Donate Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {presetAmounts.slice(0, 3).map(amt => (
                    <button
                      key={amt}
                      onClick={() => { setDonateAmount(String(amt)); setShowDonateModal(true); }}
                      className="py-3 border border-border rounded-xl font-semibold text-sm bg-background shadow-sm hover:border-neo-pink transition-all text-foreground"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {presetAmounts.slice(3).map(amt => (
                    <button
                      key={amt}
                      onClick={() => { setDonateAmount(String(amt)); setShowDonateModal(true); }}
                      className="py-3 border border-border rounded-xl font-semibold text-sm bg-background shadow-sm hover:border-neo-pink transition-all text-foreground"
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Main Donate Button */}
                <button
                  onClick={() => setShowDonateModal(true)}
                  className="w-full py-4 bg-neo-pink text-white border border-transparent rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" /> Donate Now
                </button>

                <p className="text-[10px] font-medium text-muted mt-4 text-center">
                  100% goes directly to {username} · Powered by Razorpay
                </p>
              </div>

              {/* Share Card */}
              <div className="border border-border rounded-2xl bg-surface p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2 text-muted"><Share2 className="w-4 h-4" /> Spread the word</p>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full py-3 bg-[#25D366] text-white border border-transparent rounded-xl font-medium text-xs shadow-sm hover:opacity-90 transition-opacity mb-2"
                >
                  Share on WhatsApp
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full py-3 bg-background text-foreground border border-border rounded-xl font-medium text-xs shadow-sm hover:bg-surface transition-colors"
                >
                  {copiedLink ? '✓ Link Copied' : 'Copy Fundraiser Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* DONATE MODAL */}
      <AnimatePresence>
        {showDonateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDonateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface border border-border rounded-2xl shadow-xl p-8 max-w-md w-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Support {username}</h2>
                  <p className="text-[10px] font-medium text-muted uppercase tracking-widest mt-1">Every rupee counts 💛</p>
                </div>
                <button onClick={() => setShowDonateModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1.5">Your Name (optional)</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full border border-border rounded-xl bg-background p-3 font-medium text-sm outline-none focus:border-neo-pink transition-all text-foreground"
                />
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1.5">Donation Amount (₹)</label>
                <input
                  type="number"
                  value={donateAmount}
                  onChange={e => setDonateAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="w-full border border-border rounded-xl bg-background p-3 font-semibold text-xl outline-none focus:border-neo-pink transition-all text-foreground"
                />
              </div>

              {/* Preset Amounts */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {presetAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setDonateAmount(String(amt))}
                    className={`py-2 border border-border rounded-lg font-medium text-[10px] transition-all ${donateAmount === String(amt)
                      ? 'bg-neo-pink border-neo-pink text-white'
                      : 'bg-background hover:border-neo-pink text-foreground'
                      }`}
                  >
                    ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              {/* Donate Button */}
              <button
                onClick={handleDonate}
                disabled={isDonating || !donateAmount || parseInt(donateAmount) < 1}
                className="w-full py-4 bg-neo-pink text-white border border-transparent rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDonating ? 'Processing...' : <><Heart className="w-5 h-5" /> Donate ₹{donateAmount || '0'}</>}
              </button>

              <p className="text-[10px] font-medium text-muted mt-4 text-center">
                Secure payment via Razorpay · 100% goes to the creator
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 opacity-50">
            <Zap className="w-5 h-5 text-neo-pink" />
            <span className="font-bold text-xs tracking-tight text-foreground">Supertime</span>
          </div>
          <p className="text-[10px] font-medium text-muted uppercase tracking-[0.2em]">Empowering artists, one contribution at a time</p>
        </div>
      </footer>
    </div>
  );
}
