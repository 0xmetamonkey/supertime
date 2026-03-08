'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CircleDollarSign,
  Palette,
  Heart,
  Globe,
  Menu,
  X,
  Crown,
  ShoppingBag,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useClerk } from "@clerk/nextjs";
import { checkAvailability, claimUsername } from '../actions';

export default function LandingPageClient({ session, savedUsername }: { session: any, savedUsername: string | null }) {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isLoggedIn = !!clerkUser;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => setScrolled(window.scrollY > 50);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const EnergySphere = () => (
    <div className="relative w-48 h-48 md:w-96 md:h-96">
      {/* Soft continuous ambient glow background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-tr from-neo-blue via-neo-pink to-neo-green rounded-full blur-[80px]"
      />
      {/* The core 'Coin' glass sphere */}
      <motion.div
        animate={{
          y: [0, -15, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full h-full rounded-full overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_0_80px_rgba(255,255,255,0.05)] flex items-center justify-center group cursor-pointer"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
        <Zap className="w-20 h-20 md:w-32 md:h-32 text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] z-10" />
        {/* Inner glass rim for depth */}
        <div className="absolute inset-4 border border-white/10 rounded-full mix-blend-overlay" />
        <div className="absolute inset-8 border border-white/5 rounded-full mix-blend-overlay" />
      </motion.div>

      {/* Orbiting particles (simplified for performance) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-40px] border border-white/5 rounded-full hidden md:block"
      >
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-neo-pink rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_theme(colors.neo-pink)]" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-80px] border border-white/5 rounded-full hidden md:block"
      >
        <div className="absolute bottom-0 right-1/4 w-3 h-3 bg-neo-blue rounded-full translate-x-1/2 translate-y-1/2 shadow-[0_0_15px_theme(colors.neo-blue)]" />
      </motion.div>
    </div>
  );

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
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-white/20 selection:text-white transition-colors duration-300">

      {/* Dynamic Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-zinc-950/80 backdrop-blur-xl border-white/10 py-3 shadow-2xl' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <Zap className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white">Supertime</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8 font-medium text-sm text-zinc-400">
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
              className="hidden md:flex bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              {isLoggedIn ? 'Dashboard' : 'Log In'}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 active:bg-white/20 transition-all"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

      </nav>

      {/* Mobile Slide-over Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[10000] bg-zinc-950/90 flex flex-col p-8 md:hidden"
          >
            <div className="flex justify-between items-center mb-16 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-bold tracking-tighter text-white">Menu</span>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-12 h-12 bg-white/5 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex flex-col gap-6 flex-1 px-4">
              <a
                href="#philosophy"
                onClick={() => setShowMobileMenu(false)}
                className="text-3xl font-semibold tracking-tight text-white/70 hover:text-white border-b border-white/10 pb-6 transition-colors"
              >
                Philosophy
              </a>
              <a
                href="#mission"
                onClick={() => setShowMobileMenu(false)}
                className="text-3xl font-semibold tracking-tight text-white/70 hover:text-white border-b border-white/10 pb-6 transition-colors"
              >
                Mission
              </a>
              <a
                href="#pricing"
                onClick={() => setShowMobileMenu(false)}
                className="text-3xl font-semibold tracking-tight text-white/70 hover:text-white border-b border-white/10 pb-6 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#platform"
                onClick={() => setShowMobileMenu(false)}
                className="text-3xl font-semibold tracking-tight text-white/70 hover:text-white border-b border-white/10 pb-6 transition-colors"
              >
                Platform
              </a>
            </div>

            <div className="pt-8">
              <button
                onClick={() => {
                  if (isLoggedIn) window.location.href = '/studio';
                  else router.push('/sign-in?forceRedirectUrl=/dashboard');
                }}
                className="w-full bg-white text-black py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                {isLoggedIn ? 'Dashboard' : 'Log In'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:min-h-screen flex items-center pt-32 pb-20 px-4 md:px-6 overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-20 left-0 w-[600px] h-[600px] bg-neo-blue/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-neo-pink/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 md:gap-12 items-center relative z-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
              <span className="flex h-2 w-2 rounded-full bg-neo-green animate-pulse"></span>
              <span className="font-semibold text-xs tracking-widest text-zinc-300 uppercase">The Exclusive Experience</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl xl:text-8xl font-bold tracking-tighter mb-6 text-white leading-[1.1]">
              Your time is <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">exclusive.</span>
            </h1>

            <p className="text-lg md:text-xl font-medium max-w-xl mb-10 text-zinc-400 mx-auto lg:mx-0 leading-relaxed">
              Stop giving away your knowledge for free in the DMs. Instantly monetize your audience through seamless video calls and digital storefronts.
            </p>

            <div className="max-w-xl w-full mx-auto lg:mx-0">
              <form onSubmit={handleSubmit} className="relative w-full">
                <div className="flex flex-col sm:flex-row items-stretch bg-white/5 border border-white/10 rounded-2xl md:rounded-full backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all overflow-hidden w-full group focus-within:ring-2 focus-within:ring-white/30 focus-within:bg-white/10 focus-within:border-white/30">
                  <div className="flex-1 flex items-center px-6 py-5 sm:border-r border-white/10 bg-transparent min-w-0">
                    <span className="text-zinc-500 font-semibold mr-1 text-sm md:text-lg shrink-0">supertime.wtf/</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="YOU"
                      className="flex-1 bg-transparent border-none outline-none text-white font-bold text-lg md:text-xl placeholder:text-zinc-700 min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!username || loading}
                    className="bg-white text-black font-semibold px-8 md:px-10 py-5 sm:py-0 hover:bg-zinc-200 transition-colors disabled:opacity-50 text-base md:text-lg flex items-center justify-center gap-2 shrink-0 md:rounded-r-full"
                  >
                    {loading ? '...' : (
                      <>
                        Claim <ArrowRight className="w-5 h-5 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-medium p-4 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> {error}
                  </div>
                )}
              </form>
              <p className="mt-8 text-xs font-semibold text-zinc-600 uppercase tracking-widest text-center lg:text-left">
                Join 5,000+ creators exchanging energy daily
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end mt-10 md:mt-0">
            <EnergySphere />
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="relative order-2 md:order-1">
            <div className="aspect-square rounded-[3rem] bg-zinc-900 border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-neo-pink/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black via-black/80 to-transparent">
                <h3 className="text-white text-3xl md:text-4xl font-bold tracking-tight">Focus is the real currency.</h3>
              </div>
            </div>
            {/* Soft decorative blur */}
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-neo-pink/20 rounded-full blur-[80px] -z-10" />
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-8 tracking-tighter">
              Stop managing <br /><span className="text-zinc-500">start monetizing.</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-12 leading-relaxed font-medium">
              In a world of infinite noise, your focused attention is the most valuable asset you own. Supertime builds the elegant infrastructure that lets you charge for access to your brain seamlessly.
            </p>
            <div className="space-y-4">
              {[
                { icon: Zap, label: 'Instant Settlement', desc: 'Secure payments directly to your wallet.' },
                { icon: ShieldCheck, label: 'Frictionless Scheduling', desc: 'No more back-and-forth emails.' },
                { icon: Heart, label: 'Human-First Connection', desc: 'High-quality encrypted video calls.' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                  <div className={`p-4 rounded-xl bg-white/10 border border-white/10 shrink-0 self-start sm:self-center`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold text-lg text-white mb-1">{item.label}</span>
                    <span className="block font-medium text-zinc-500 text-sm">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Platform (Cards) */}
      <section id="platform" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-white/[0.02] border-y border-white/5" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">Everything you need. <br className="hidden sm:block" /><span className="text-zinc-600">Nothing you don't.</span></h2>
            <p className="text-lg text-zinc-400 font-medium leading-relaxed">Three core pillars designed to eliminate friction between your expertise and your audience's wallet.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'The Storefront',
                desc: 'A gorgeous, link-in-bio optimized profile that showcases your digital products and call availability in one place.',
                icon: Globe
              },
              {
                title: 'The Call Engine',
                desc: 'Sync your calendar and let clients book 1:1 sessions instantly. We handle the timezone math, the meeting link, and the payment.',
                icon: CircleDollarSign
              },
              {
                title: 'The AI Autopilot',
                desc: 'Connect your Instagram and automatically send your storefront link to anyone who DMs you a specific keyword.',
                icon: Palette
              }
            ].map((feature, i) => (
              <div key={i} className={`relative p-10 rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl hover:bg-zinc-800/80 transition-all overflow-hidden group hover:-translate-y-2`}>
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <feature.icon className={`w-8 h-8 text-white`} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-4 text-white">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed font-medium">{feature.desc}</p>
                {/* Subtle soft glow on hover */}
                <div className="absolute inset-x-0 -bottom-32 h-64 bg-white/5 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 overflow-hidden relative">
        {/* Background Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neo-pink/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg text-zinc-400 font-medium max-w-2xl mx-auto">
              Start for free, upgrade when you're scaling mass impact.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="flex flex-col p-10 md:p-12 rounded-[2rem] border border-white/10 bg-zinc-900/40 backdrop-blur-xl transition-all h-full">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-1">Creator</h3>
                  <p className="text-zinc-500 font-medium text-sm">Everything you need to start</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-zinc-400" />
                </div>
              </div>
              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold tracking-tighter text-white">₹0</span>
                  <span className="text-zinc-500 font-medium text-lg">/forever</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {[
                  'Unlimited Storefront Products',
                  'Unlimited Calendar Bookings',
                  'Integrated Payment Processing',
                  'Automated Client Emails',
                  'Basic Analytics Dashboard'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white/10 text-white rounded-xl hover:bg-white/20 py-4 font-semibold transition-colors">
                Claim Free Store
              </button>
            </div>

            {/* Pro Tier */}
            <div className="flex flex-col p-10 md:p-12 rounded-[2rem] border border-white bg-white/5 backdrop-blur-xl relative overflow-hidden h-full">
              {/* Popular Tag */}
              <div className="absolute top-6 right-8 bg-white text-black font-semibold text-xs px-3 py-1 rounded-full z-20 shadow-[0_4px_10px_rgba(255,255,255,0.3)]">
                Pro
              </div>

              {/* Gradient blast background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="mb-8 flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-1">Enterprise</h3>
                  <p className="text-zinc-400 font-medium text-sm">For creators doing volume</p>
                </div>
              </div>
              <div className="mb-10 relative z-10">
                <div className="flex items-baseline gap-2 text-white">
                  <span className="text-6xl font-bold tracking-tighter">₹999</span>
                  <span className="text-zinc-400 font-medium text-lg">/month</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1 relative z-10">
                {[
                  'Everything in Free',
                  'Zero Supertime transaction fees',
                  'Unlimited Instagram Auto-DMs',
                  'Custom Domain Support',
                  'Deep Analytics & Conversion Tracking',
                  'Priority Support Queue',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-white">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white text-black rounded-xl hover:bg-zinc-200 py-4 font-bold transition-colors relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Upgrade to Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-40 px-6 relative overflow-hidden bg-zinc-950/50">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold mb-10 leading-[1.1] tracking-tighter">
            Your time is <span className="text-zinc-500">finite.</span> Your influence is <span className="text-white">infinite.</span>
          </h2>
          <p className="text-xl md:text-2xl font-medium text-zinc-400 leading-relaxed mb-16 max-w-3xl mx-auto">
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
              className="bg-white text-black rounded-full px-8 py-4 font-bold hover:scale-105 transition-transform"
            >
              Claim your identity
            </button>
          </div>
        </div>
        {/* Soft core glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 relative z-10">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Zap className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-bold tracking-tighter">Supertime</span>
            </div>
            <p className="font-medium text-zinc-500 leading-relaxed text-sm">
              The premier operations system for knowledge creators. Build your store, automate your DMs, and host calls effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24 w-full md:w-auto">
            <div className="space-y-4">
              <h4 className="font-semibold text-white tracking-tight">Platform</h4>
              <ul className="space-y-3 font-medium text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Storefront</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Call Engine</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white tracking-tight">Company</h4>
              <ul className="space-y-3 font-medium text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manifesto</a></li>
              </ul>
            </div>
            <div className="space-y-4 col-span-2 sm:col-span-1 border-t sm:border-t-0 border-white/10 pt-8 sm:pt-0">
              <h4 className="font-semibold text-white tracking-tight">Connect</h4>
              <ul className="space-y-3 font-medium text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Twitter / X</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Discord Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support Email</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-zinc-600">
          <span>© 2026 Supertime Inc. All rights reserved.</span>
          <span>Designed for focus.</span>
        </div>
      </footer>
    </div>
  );
}
