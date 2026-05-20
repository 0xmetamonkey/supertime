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
import { useUser, useClerk } from "@clerk/nextjs";
import { checkAvailability, claimUsername } from './actions';

/* ── Extracted: no re-creation on parent re-render ── */
function EnergySphere() {
  return (
    <div className="relative w-48 h-48 md:w-96 md:h-96">
      <div className="absolute inset-0 bg-gradient-to-tr from-neo-blue via-neo-pink to-neo-green rounded-full opacity-30 blur-3xl animate-sphere-glow" />
      <div className="relative w-full h-full border-8 border-black rounded-full overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] bg-white flex items-center justify-center group cursor-pointer animate-sphere-float">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--neo-yellow)_0%,_transparent_70%)] opacity-20 group-hover:opacity-40 transition-opacity" />
        <Zap className="w-24 h-24 text-black fill-neo-yellow animate-pulse" />
        <div className="absolute inset-0 border-[16px] border-black/5 rounded-full" />
      </div>
      <div className="absolute inset-[-40px] border-2 border-dashed border-black/20 rounded-full hidden md:block animate-orbit" />
      <div className="absolute inset-[-80px] border border-black/10 rounded-full hidden md:block animate-orbit-reverse" />
    </div>
  );
}

export default function LandingPageClient({ session, savedUsername }: { session: any, savedUsername: string | null }) {
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
      if (!isAvailable) {
        setError('Username taken. Try another?');
        setLoading(false);
        return;
      }

      if (isLoggedIn) {
        await claimUsername(username);
        window.location.href = '/dashboard';
      } else {
        router.push(`/sign-in?forceRedirectUrl=/dashboard?claim=${username}`);
      }
    } catch (e: any) {
      console.error("Claim Hub Error:", e);
      setError(e.message || "Failed to process request. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-neo-pink selection:text-white">

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-4 border-black ${scrolled ? 'bg-white/90 backdrop-blur-md py-2 shadow-xl' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-black flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_theme(colors.neo-pink)]">
              <Zap className="text-neo-yellow w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter">Supertime</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-8 font-bold uppercase text-xs tracking-widest mr-4">
              <a href="#philosophy" className="hover:text-neo-blue transition-colors">Philosophy</a>
              <a href="#mission" className="hover:text-neo-pink transition-colors">Mission</a>
              <a href="#pricing" className="hover:text-neo-green transition-colors">Pricing</a>
              <a href="#platform" className="hover:text-neo-green transition-colors">Platform</a>
            </div>

            <button
              onClick={() => {
                if (isLoggedIn) window.location.href = '/dashboard';
                else router.push('/sign-in?forceRedirectUrl=/dashboard');
              }}
              className="hidden md:flex neo-btn bg-black text-white hover:bg-zinc-800"
            >
              {isLoggedIn ? 'Dashboard' : 'Log In'}
            </button>

            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0 active:translate-y-0 transition-all font-black"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col p-8 md:hidden animate-slide-in-right">
          <div className="flex justify-between items-center mb-16 px-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_theme(colors.neo-pink)]">
                <Zap className="text-neo-yellow w-6 h-6 fill-current" />
              </div>
              <span className="text-2xl font-black uppercase tracking-tighter text-black">Menu</span>
            </div>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="w-12 h-12 bg-black text-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="flex flex-col gap-8 flex-1 px-4">
            {[
              { href: '#philosophy', label: 'Philosophy', color: 'hover:text-neo-blue' },
              { href: '#mission', label: 'Mission', color: 'hover:text-neo-pink' },
              { href: '#pricing', label: 'Pricing', color: 'hover:text-neo-green' },
              { href: '#platform', label: 'Platform', color: 'hover:text-neo-green' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setShowMobileMenu(false)}
                className={`text-4xl font-black uppercase tracking-widest text-black ${link.color} border-b-4 border-black pb-6 transition-colors`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-8">
            <button
              onClick={() => {
                if (isLoggedIn) window.location.href = '/dashboard';
                else router.push('/sign-in?forceRedirectUrl=/dashboard');
              }}
              className="w-full bg-black text-white py-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(46,213,115,0.4)] font-black uppercase text-2xl tracking-widest flex items-center justify-center gap-4 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              {isLoggedIn ? 'Dashboard' : 'Log In'}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[80vh] md:min-h-screen flex items-center pt-24 md:pt-28 pb-10 md:pb-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-40 -left-20 w-80 h-80 bg-neo-blue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-neo-pink/10 rounded-full blur-3xl animate-pulse" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          <div className="text-center lg:text-left animate-fade-in-up">
            <div className="inline-block px-4 py-1 border-2 border-black bg-neo-yellow mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black uppercase text-xs tracking-[0.2em] text-black">The Exclusive Experience</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl xl:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-4 text-black">
              Your <span className="text-neo-pink">time</span> is<br />
              <span className="text-neo-blue italic">exclusive.</span>
            </h1>

            <p className="text-lg md:text-xl font-bold max-w-xl mb-6 text-zinc-600 mx-auto lg:mx-0">
              Stop giving away your knowledge for free in the DMs. Instantly monetize your audience through seamless video calls and digital storefronts.
            </p>

            <div className="max-w-xl w-full mx-auto lg:mx-0">
              <form onSubmit={handleSubmit} className="relative w-full px-1">
                <div className="flex flex-col sm:flex-row items-stretch bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden w-full">
                  <div className="flex-1 flex items-center px-3 md:px-6 py-4 border-b-4 sm:border-b-0 sm:border-r-4 border-black bg-white min-w-0">
                    <span className="text-zinc-400 font-black mr-1 text-xs md:text-lg shrink-0">supertime.wtf/</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="YOU"
                      className="flex-1 bg-transparent border-none outline-none text-black font-black text-xl md:text-2xl placeholder:text-zinc-200 uppercase min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!username || loading}
                    className="bg-neo-green text-black font-black px-8 md:px-10 py-5 sm:py-0 hover:bg-neo-green/90 transition-colors disabled:opacity-50 uppercase text-lg md:text-xl flex items-center justify-center gap-2 group/btn shrink-0"
                  >
                    {loading ? '...' : (
                      <>
                        Claim <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:translate-x-2 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-4 bg-red-500 text-white font-black p-3 uppercase border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    {error}
                  </div>
                )}
              </form>
              <p className="mt-6 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center lg:text-left">
                Join 5,000+ creators exchanging energy daily
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end animate-fade-in">
            <EnergySphere />
          </div>
        </div>
      </section>

      {/* Marquee Tape */}
      <div className="bg-black py-8 overflow-hidden border-y-4 border-black">
        <div className="flex whitespace-nowrap animate-infinite-scroll">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 md:px-12">
              <span className="text-white font-black text-2xl md:text-4xl uppercase tracking-tighter opacity-50">Your Time Is Exclusive</span>
              <Sparkles className="text-neo-yellow w-6 h-6 md:w-8 md:h-8" />
              <span className="text-white font-black text-2xl md:text-4xl uppercase tracking-tighter">Supertime</span>
              <Zap className="text-neo-blue w-6 h-6 md:w-8 md:h-8 fill-neo-blue" />
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-square bg-neo-pink border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white text-4xl font-black uppercase">Focus is the real currency.</h3>
              </div>
              <div className="absolute top-4 right-4 grid grid-cols-4 gap-2">
                {[...Array(16)].map((_, i) => <div key={i} className="w-2 h-2 bg-black rounded-full" />)}
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 border-4 border-black bg-neo-yellow -z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
          </div>

          <div>
            <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-8">
              Stop managing. <span className="text-neo-blue underline decoration-4 underline-offset-8">Start monetizing.</span>
            </h2>
            <p className="text-2xl font-bold text-zinc-600 mb-8 leading-relaxed">
              In a world of infinite noise, your focused attention is the most valuable asset you own. Supertime builds the elegant infrastructure that lets you charge for access to your brain seamlessly.
            </p>
            <div className="space-y-6">
              {[
                { icon: Zap, label: 'Instant Settlement', desc: 'Secure payments directly to your wallet.', color: 'bg-neo-blue' },
                { icon: ShieldCheck, label: 'Frictionless Scheduling', desc: 'No more back-and-forth emails.', color: 'bg-neo-green' },
                { icon: Heart, label: 'Human-First Connection', desc: 'High-quality encrypted video calls.', color: 'bg-neo-pink' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default text-black">
                  <div className={`${item.color} p-2 border-2 border-black`}>
                    <item.icon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <span className="font-black uppercase tracking-tight block">{item.label}</span>
                    <span className="font-bold text-zinc-500 text-sm block">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section id="platform" className="py-24 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-8xl font-black uppercase mb-6">Everything you <span className="text-neo-yellow">need.</span></h2>
            <p className="text-xl text-zinc-400 font-bold uppercase tracking-widest">Three core pillars designed to eliminate friction</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'The Storefront', desc: 'A gorgeous, link-in-bio optimized profile that showcases your digital products and call availability in one place.', color: 'neo-blue', icon: Globe },
              { step: '02', title: 'The Call Engine', desc: 'Sync your calendar and let clients book 1:1 sessions instantly. We handle the timezone math, the meeting link, and the payment.', color: 'neo-pink', icon: CircleDollarSign },
              { step: '03', title: 'The AI Autopilot', desc: 'Connect your Instagram and automatically send your storefront link to anyone who DMs you a specific keyword.', color: 'neo-green', icon: Palette }
            ].map((feature, i) => (
              <div key={i} className="relative group p-10 border-4 border-white bg-zinc-900 shadow-[12px_12px_0px_0px_#fff] hover:shadow-[8px_8px_0px_0px_#fff] hover:translate-x-1 hover:translate-y-1 transition-all">
                <div className="text-7xl font-black mb-6 opacity-20 outline-text">{feature.step}</div>
                <feature.icon className="w-12 h-12 text-white mb-6" />
                <h3 className="text-3xl font-black uppercase mb-4">{feature.title}</h3>
                <p className="text-zinc-400 font-bold leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-zinc-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-8xl font-black uppercase mb-6">
              Simple <span className="bg-neo-yellow px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">pricing.</span>
            </h2>
            <p className="text-lg text-zinc-500 font-bold uppercase tracking-widest">
              Start for free, upgrade when you're scaling mass impact.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="flex flex-col p-10 md:p-12 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-black mb-1">Creator</h3>
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Everything you need to start</p>
                </div>
                <div className="w-12 h-12 bg-neo-blue border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Zap className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter text-black">₹0</span>
                  <span className="text-zinc-500 font-black text-lg uppercase">/forever</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {['Unlimited Storefront Products', 'Unlimited Calendar Bookings', 'Integrated Payment Processing', 'Automated Client Emails', 'Basic Analytics Dashboard'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-black">
                    <div className="w-5 h-5 bg-neo-green border-2 border-black flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-black" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  const form = document.querySelector('form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                  const input = form?.querySelector('input');
                  input?.focus();
                }}
                className="w-full bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 py-4 font-black uppercase transition-all">
                Claim Free Store
              </button>
            </div>

            {/* Pro Tier */}
            <div className="flex flex-col p-10 md:p-12 border-4 border-black bg-neo-yellow relative overflow-hidden h-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="absolute top-6 right-8 bg-black text-white font-black text-xs px-4 py-1.5 uppercase tracking-widest border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] z-20">
                Pro
              </div>
              <div className="mb-8 flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-black mb-1">Enterprise</h3>
                  <p className="text-black/60 font-bold text-xs uppercase tracking-widest">For creators doing volume</p>
                </div>
              </div>
              <div className="mb-10 relative z-10">
                <div className="flex items-baseline gap-2 text-black">
                  <span className="text-6xl font-black tracking-tighter">₹999</span>
                  <span className="text-black/60 font-black text-lg uppercase">/month</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1 relative z-10">
                {['Everything in Free', 'Zero Supertime transaction fees', 'Unlimited Instagram Auto-DMs', 'Custom Domain Support', 'Deep Analytics & Conversion Tracking', 'Priority Support Queue'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-black">
                    <div className="w-5 h-5 bg-white border-2 border-black flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-black" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  const form = document.querySelector('form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                  const input = form?.querySelector('input');
                  input?.focus();
                }}
                className="w-full bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 py-4 font-black uppercase transition-all relative z-10">
                Upgrade to Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-24 px-6 relative overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-1 bg-black" />
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl md:text-8xl font-black uppercase mb-12 leading-none">
            Your time is <span className="bg-neo-yellow px-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">finite.</span> Your influence is <span className="text-neo-pink">infinite.</span>
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-zinc-800 leading-tight mb-16">
            "We are building the infrastructure for the knowledge economy. A platform where human attention is treated with reverence, and expertise is exchanged seamlessly."
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                const form = document.querySelector('form');
                form?.scrollIntoView({ behavior: 'smooth' });
                const input = form?.querySelector('input');
                input?.focus();
              }}
              className="neo-btn bg-neo-pink text-white hover:bg-neo-pink/90 scale-110"
            >
              Claim your identity
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-20 px-6 border-t-8 border-neo-pink">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-12 h-12 bg-neo-green flex items-center justify-center border-2 border-white shadow-[4px_4px_0px_0px_#fff]">
                <Zap className="text-black w-7 h-7 fill-black" />
              </div>
              <span className="text-4xl font-black uppercase tracking-tighter">Supertime</span>
            </div>
            <p className="max-w-xs font-bold text-zinc-400 uppercase tracking-widest leading-loose">
              The premier operations system for knowledge creators. Build your store, automate your DMs, and host calls effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-pink">Platform</h4>
              <ul className="space-y-2 font-bold uppercase text-sm">
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Storefront</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Call Engine</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-blue">Company</h4>
              <ul className="space-y-2 font-bold uppercase text-sm">
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Manifesto</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-green">Connect</h4>
              <ul className="space-y-2 font-bold uppercase text-sm">
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Twitter / X</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Discord Community</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Support Email</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">
          <span>© 2026 Supertime Inc. All rights reserved.</span>
          <span>Designed for focus.</span>
        </div>
      </footer>
    </div>
  );
}
