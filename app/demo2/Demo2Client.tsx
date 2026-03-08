'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  CircleDollarSign,
  Palette,
  Heart,
  Globe,
  Menu,
  X,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { checkAvailability, claimUsername } from '../actions';

/*
 * DEMO2: Hybrid Design
 * Neobrutal STRUCTURE (thick borders, hard shadows, bold typography)
 * + Glassmorphic PALETTE (dark bg, glass panels, subtle glows)
 */

function EnergySphere() {
  return (
    <div className="relative w-48 h-48 md:w-96 md:h-96">
      {/* Ambient glow — glass style */}
      <div className="absolute inset-0 bg-gradient-to-tr from-neo-blue via-neo-pink to-neo-green rounded-full blur-[80px] animate-sphere-glow" />
      {/* Core sphere — neobrutal borders + glass fill */}
      <div className="relative w-full h-full border-4 border-white/30 rounded-full overflow-hidden shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] md:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.08)] bg-white/5 backdrop-blur-2xl flex items-center justify-center group cursor-pointer animate-sphere-float">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
        <Zap className="w-20 h-20 md:w-28 md:h-28 text-white/90 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] z-10" />
        <div className="absolute inset-4 border border-white/10 rounded-full" />
      </div>
      {/* Orbits — neobrutal dashed style */}
      <div className="absolute inset-[-40px] border-2 border-dashed border-white/10 rounded-full hidden md:block animate-orbit" />
      <div className="absolute inset-[-80px] border border-white/5 rounded-full hidden md:block animate-orbit-reverse" />
    </div>
  );
}

export default function Demo2Page() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isLoggedIn = !!clerkUser;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setError('');
    setLoading(true);
    try {
      const isAvailable = await checkAvailability(username);
      if (!isAvailable) { setError('Username taken. Try another?'); setLoading(false); return; }
      if (isLoggedIn) { await claimUsername(username); window.location.href = '/dashboard'; }
      else { router.push(`/sign-in?forceRedirectUrl=/dashboard?claim=${username}`); }
    } catch (e: any) {
      setError(e.message || "Failed to process request.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-neo-pink/30 selection:text-white">

      {/* Nav — neobrutal structure + dark glass palette */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-4 border-white/10 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-xl py-2 shadow-2xl' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/10 backdrop-blur-md flex items-center justify-center border-2 border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
              <Zap className="text-neo-yellow w-5 h-5" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter">Supertime</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-8 font-bold uppercase text-xs tracking-widest mr-4 text-zinc-400">
              <a href="#philosophy" className="hover:text-white transition-colors">Philosophy</a>
              <a href="#mission" className="hover:text-white transition-colors">Mission</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            </div>

            <button
              onClick={() => {
                if (isLoggedIn) window.location.href = '/dashboard';
                else router.push('/sign-in?forceRedirectUrl=/dashboard');
              }}
              className="hidden md:flex px-6 py-2.5 font-black uppercase text-xs tracking-widest bg-white text-black border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              {isLoggedIn ? 'Dashboard' : 'Log In'}
            </button>

            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden w-10 h-10 bg-white/10 border-2 border-white/20 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[10000] bg-zinc-950 flex flex-col p-8 md:hidden animate-slide-in-right">
          <div className="flex justify-between items-center mb-16 px-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center border-2 border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                <Zap className="text-neo-yellow w-5 h-5" />
              </div>
              <span className="text-2xl font-black uppercase tracking-tighter">Menu</span>
            </div>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="w-12 h-12 bg-white/10 border-2 border-white/20 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:shadow-none transition-all"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="flex flex-col gap-8 flex-1 px-4">
            {['Philosophy', 'Mission', 'Pricing', 'Platform'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                onClick={() => setShowMobileMenu(false)}
                className="text-4xl font-black uppercase tracking-widest text-white/70 hover:text-white border-b-4 border-white/10 pb-6 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="pt-8">
            <button
              onClick={() => {
                if (isLoggedIn) window.location.href = '/dashboard';
                else router.push('/sign-in?forceRedirectUrl=/dashboard');
              }}
              className="w-full bg-white text-black py-6 border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] font-black uppercase text-2xl tracking-widest flex items-center justify-center gap-4 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              {isLoggedIn ? 'Dashboard' : 'Log In'}
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[80vh] md:min-h-screen flex items-center pt-24 md:pt-28 pb-10 md:pb-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-40 -left-20 w-80 h-80 bg-neo-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-neo-pink/5 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          <div className="text-center lg:text-left animate-fade-in-up">
            <div className="inline-block px-4 py-1 border-2 border-white/20 bg-white/5 backdrop-blur-md mb-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <span className="font-black uppercase text-xs tracking-[0.2em] text-neo-yellow">The Exclusive Experience</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl xl:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-4">
              Your <span className="text-neo-pink">time</span> is<br />
              <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent italic">exclusive.</span>
            </h1>

            <p className="text-lg md:text-xl font-bold max-w-xl mb-6 text-zinc-400 mx-auto lg:mx-0">
              Stop giving away your knowledge for free in the DMs. Instantly monetize your audience through seamless video calls and digital storefronts.
            </p>

            <div className="max-w-xl w-full mx-auto lg:mx-0">
              <form onSubmit={handleSubmit} className="relative w-full px-1">
                <div className="flex flex-col sm:flex-row items-stretch bg-white/5 border-4 border-white/15 backdrop-blur-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] sm:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.08)] hover:border-white/25 transition-all overflow-hidden w-full">
                  <div className="flex-1 flex items-center px-3 md:px-6 py-4 border-b-4 sm:border-b-0 sm:border-r-4 border-white/10 min-w-0">
                    <span className="text-zinc-500 font-black mr-1 text-xs md:text-lg shrink-0">supertime.wtf/</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="YOU"
                      className="flex-1 bg-transparent border-none outline-none text-white font-black text-xl md:text-2xl placeholder:text-zinc-700 uppercase min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!username || loading}
                    className="bg-white text-black font-black px-8 md:px-10 py-5 sm:py-0 hover:bg-zinc-200 transition-colors disabled:opacity-50 uppercase text-lg md:text-xl flex items-center justify-center gap-2 group/btn shrink-0"
                  >
                    {loading ? '...' : (
                      <>
                        Claim <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:translate-x-2 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-4 bg-red-500/20 border-4 border-red-500/30 text-red-400 font-black p-3 uppercase shadow-[4px_4px_0px_0px_rgba(239,68,68,0.15)]">
                    {error}
                  </div>
                )}
              </form>
              <p className="mt-6 text-xs font-bold text-zinc-600 uppercase tracking-widest text-center lg:text-left">
                Join 5,000+ creators exchanging energy daily
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end animate-fade-in">
            <EnergySphere />
          </div>
        </div>
      </section>

      {/* Marquee Tape — dark glass version */}
      <div className="bg-white/5 backdrop-blur-md py-8 overflow-hidden border-y-4 border-white/10">
        <div className="flex whitespace-nowrap animate-infinite-scroll">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 md:px-12">
              <span className="text-white/30 font-black text-2xl md:text-4xl uppercase tracking-tighter">Your Time Is Exclusive</span>
              <Sparkles className="text-neo-yellow/60 w-6 h-6 md:w-8 md:h-8" />
              <span className="text-white/60 font-black text-2xl md:text-4xl uppercase tracking-tighter">Supertime</span>
              <Zap className="text-neo-blue/60 w-6 h-6 md:w-8 md:h-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy — dark glass panels with neobrutal borders */}
      <section id="philosophy" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-neo-pink/20 to-neo-blue/10 border-4 border-white/15 shadow-[16px_16px_0px_0px_rgba(255,255,255,0.05)] relative overflow-hidden group backdrop-blur-xl">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all duration-700" />
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white text-4xl font-black uppercase">Focus is the real currency.</h3>
              </div>
              <div className="absolute top-4 right-4 grid grid-cols-4 gap-2">
                {[...Array(16)].map((_, i) => <div key={i} className="w-2 h-2 bg-white/20 rounded-full" />)}
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 border-4 border-white/10 bg-neo-yellow/10 backdrop-blur-lg -z-10 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.03)]" />
          </div>

          <div>
            <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-8">
              Stop managing. <span className="text-neo-blue">Start monetizing.</span>
            </h2>
            <p className="text-2xl font-bold text-zinc-400 mb-8 leading-relaxed">
              In a world of infinite noise, your focused attention is the most valuable asset you own. Supertime builds the elegant infrastructure that lets you charge for access to your brain seamlessly.
            </p>
            <div className="space-y-6">
              {[
                { icon: Zap, label: 'Instant Settlement', desc: 'Secure payments directly to your wallet.', glow: 'neo-blue' },
                { icon: ShieldCheck, label: 'Frictionless Scheduling', desc: 'No more back-and-forth emails.', glow: 'neo-green' },
                { icon: Heart, label: 'Human-First Connection', desc: 'High-quality encrypted video calls.', glow: 'neo-pink' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-4 border-white/10 bg-white/5 backdrop-blur-lg shadow-[6px_6px_0px_0px_rgba(255,255,255,0.03)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default">
                  <div className={`bg-${item.glow}/20 p-2 border-2 border-white/20`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="font-black uppercase tracking-tight block text-white">{item.label}</span>
                    <span className="font-bold text-zinc-500 text-sm block">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Cards — glass panels */}
      <section id="platform" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-white/[0.02] border-y-4 border-white/5" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-8xl font-black uppercase mb-6">Everything you <span className="text-neo-yellow">need.</span></h2>
            <p className="text-xl text-zinc-500 font-bold uppercase tracking-widest">Three core pillars designed to eliminate friction</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'The Storefront', desc: 'A gorgeous, link-in-bio optimized profile that showcases your digital products and call availability in one place.', icon: Globe },
              { step: '02', title: 'The Call Engine', desc: 'Sync your calendar and let clients book 1:1 sessions instantly. We handle the timezone math, the meeting link, and the payment.', icon: CircleDollarSign },
              { step: '03', title: 'The AI Autopilot', desc: 'Connect your Instagram and automatically send your storefront link to anyone who DMs you a specific keyword.', icon: Palette }
            ].map((feature, i) => (
              <div key={i} className="relative group p-10 border-4 border-white/10 bg-white/5 backdrop-blur-xl shadow-[12px_12px_0px_0px_rgba(255,255,255,0.03)] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] hover:translate-x-1 hover:translate-y-1 hover:bg-white/10 transition-all">
                <div className="text-7xl font-black mb-6 opacity-10 text-white">{feature.step}</div>
                <feature.icon className="w-12 h-12 text-white/80 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-black uppercase mb-4">{feature.title}</h3>
                <p className="text-zinc-400 font-bold leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — glass cards with neobrutal borders */}
      <section id="pricing" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neo-pink/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-8xl font-black uppercase mb-6">
              Simple <span className="bg-white/10 backdrop-blur-md px-4 border-4 border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">pricing.</span>
            </h2>
            <p className="text-lg text-zinc-500 font-bold uppercase tracking-widest">
              Start for free, upgrade when you're scaling mass impact.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="flex flex-col p-10 md:p-12 border-4 border-white/10 bg-white/5 backdrop-blur-xl shadow-[8px_8px_0px_0px_rgba(255,255,255,0.03)] h-full">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-1">Creator</h3>
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Everything you need to start</p>
                </div>
                <div className="w-12 h-12 bg-neo-blue/20 border-2 border-white/20 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter">₹0</span>
                  <span className="text-zinc-500 font-black text-lg uppercase">/forever</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {['Unlimited Storefront Products', 'Unlimited Calendar Bookings', 'Integrated Payment Processing', 'Automated Client Emails', 'Basic Analytics Dashboard'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-zinc-300">
                    <div className="w-5 h-5 bg-neo-green/20 border-2 border-white/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-neo-green" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white/10 text-white border-4 border-white/10 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.03)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 hover:bg-white/20 py-4 font-black uppercase transition-all">
                Claim Free Store
              </button>
            </div>

            {/* Pro Tier */}
            <div className="flex flex-col p-10 md:p-12 border-4 border-white bg-white/10 backdrop-blur-xl relative overflow-hidden h-full shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
              <div className="absolute top-6 right-8 bg-white text-black font-black text-xs px-4 py-1.5 uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] z-20">
                Pro
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />

              <div className="mb-8 flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-1">Enterprise</h3>
                  <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">For creators doing volume</p>
                </div>
              </div>
              <div className="mb-10 relative z-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter">₹999</span>
                  <span className="text-zinc-400 font-black text-lg uppercase">/month</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1 relative z-10">
                {['Everything in Free', 'Zero Supertime transaction fees', 'Unlimited Instagram Auto-DMs', 'Custom Domain Support', 'Deep Analytics & Conversion Tracking', 'Priority Support Queue'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-white">
                    <div className="w-5 h-5 bg-white border-2 border-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-black" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white text-black border-4 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 py-4 font-black uppercase transition-all relative z-10">
                Upgrade to Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-6xl md:text-8xl font-black uppercase mb-12 leading-none">
            Your time is <span className="bg-white/10 backdrop-blur-md px-4 border-4 border-white/20 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">finite.</span> Your influence is <span className="text-neo-pink">infinite.</span>
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-zinc-400 leading-tight mb-16">
            "We are building the infrastructure for the knowledge economy. A platform where human attention is treated with reverence, and expertise is exchanged seamlessly."
          </p>
          <button
            onClick={() => {
              const form = document.querySelector('form');
              form?.scrollIntoView({ behavior: 'smooth' });
              form?.querySelector('input')?.focus();
            }}
            className="bg-white text-black px-8 py-4 font-black uppercase tracking-widest border-4 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            Claim your identity
          </button>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-white/10 py-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md flex items-center justify-center border-2 border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                <Zap className="text-white w-6 h-6" />
              </div>
              <span className="text-4xl font-black uppercase tracking-tighter">Supertime</span>
            </div>
            <p className="max-w-xs font-bold text-zinc-500 uppercase tracking-widest leading-loose text-sm">
              The premier operations system for knowledge creators. Build your store, automate your DMs, and host calls effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-pink">Platform</h4>
              <ul className="space-y-2 font-bold uppercase text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Storefront</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Call Engine</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-blue">Company</h4>
              <ul className="space-y-2 font-bold uppercase text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manifesto</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-green">Connect</h4>
              <ul className="space-y-2 font-bold uppercase text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Twitter / X</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Discord Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support Email</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">
          <span>© 2026 Supertime Inc. All rights reserved.</span>
          <span>Designed for focus.</span>
        </div>
      </footer>
    </div>
  );
}
