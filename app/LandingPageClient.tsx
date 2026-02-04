'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginWithGoogle, checkAvailability, claimUsername } from './actions';
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
  Globe
} from 'lucide-react';

export default function LandingPageClient({ session, savedUsername }: { session: any, savedUsername: string | null }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isLoggedIn = !!session?.user;

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
    <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
      {/* Dynamic Glow Core - The Art is the Color */}
      <div className="absolute inset-0 bg-gradient-to-tr from-neo-blue via-neo-pink to-neo-green opacity-30 blur-[100px] animate-pulse rounded-full" />

      {/* Floating Artifact Layers */}

      <motion.div
        animate={{
          y: [0, -20, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full h-full bg-white/5 backdrop-blur-3xl rounded-full border border-white/20 flex items-center justify-center group shadow-[0_0_50px_rgba(255,255,255,0.05)]"
      >

        <Zap className="w-24 h-24 text-white fill-neo-yellow drop-shadow-[0_0_30px_rgba(206,255,26,0.6)]" />


      </motion.div>

      {/* Simple Orbiting Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-30px] border border-white/10 rounded-full"
      />
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
        window.location.href = '/studio';
      } else {
        await loginWithGoogle(username);
      }
    } catch (e: any) {
      console.error("Claim Hub Error:", e);
      setError(e.message || "Failed to process request. Try again.");
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  const BackgroundArt = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-[#0A0A0B]" />

      {/* Powerful Mesh Gradients - Pure Color Art */}
      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] opacity-30 bg-[radial-gradient(circle_at_center,_var(--neo-blue)_0%,_transparent_70%)] blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, -40, 40, 0],
          y: [0, 60, -60, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[100%] opacity-30 bg-[radial-gradient(circle_at_center,_var(--neo-pink)_0%,_transparent_70%)] blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--neo-green)_0%,_transparent_70%)] blur-[100px]"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-white font-sans selection:bg-neo-pink selection:text-white transition-colors duration-300 custom-scrollbar">
      <BackgroundArt />


      {/* Subtle Mouse Follower */}
      <div
        className="fixed w-8 h-8 pointer-events-none z-[100] transition-transform duration-150 ease-out hidden md:block"
        style={{
          left: `${mousePos.x - 16}px`,
          top: `${mousePos.y - 16}px`,
        }}
      >
        <div className="w-full h-full border-2 border-white rounded-full shadow-[0px_0px_15px_0px_rgba(206,255,26,0.6)] bg-neo-yellow/20 backdrop-blur-sm" />
      </div>

      {/* Dynamic Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/40 backdrop-blur-2xl py-3 border-b border-white/10' : 'bg-transparent py-6 border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:rotate-12 transition-transform">
              <Zap className="text-black w-6 h-6 fill-black" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter text-white">Supertime</span>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden md:flex gap-10 font-bold uppercase text-[10px] tracking-[0.3em] text-white/50">
              <a href="#philosophy" className="hover:text-white hover:tracking-[0.4em] transition-all">Philosophy</a>
              <a href="#mission" className="hover:text-white hover:tracking-[0.4em] transition-all">Mission</a>
              <a href="#platform" className="hover:text-white hover:tracking-[0.4em] transition-all">Platform</a>
            </div>

            <button
              onClick={() => loginWithGoogle('/')}
              className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-full hover:bg-neo-pink hover:text-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {isLoggedIn ? 'Dashboard' : 'Log In'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 md:pt-28 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-block px-4 py-1 border-2 border-white bg-neo-yellow mb-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
              <span className="font-black uppercase text-xs tracking-[0.2em] text-black">The World's First Energy Exchange</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-8xl xl:text-9xl font-black uppercase leading-[0.8] tracking-tighter mb-6 text-white"
            >
              Turn your <span className="text-neo-pink mix-blend-screen drop-shadow-[0_0_30px_rgba(255,0,245,0.5)]">time</span><br />
              into <span className="text-neo-blue italic relative">
                pure art.
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1, duration: 1 }}
                  className="absolute bottom-4 left-0 h-4 bg-neo-green/30 -z-10 skew-x-[-20deg]"
                />
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl md:text-2xl font-bold max-w-xl mb-10 text-zinc-400 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              We believe your time is your most beautiful asset. A mission to make each moment an asset that evolves into blissful human connection.
            </motion.p>

            <motion.div variants={itemVariants} className="max-w-xl w-full">
              <form onSubmit={handleSubmit} className="relative w-full">
                <div className="flex flex-col sm:flex-row items-stretch bg-neutral-900 border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.15)] transition-all overflow-hidden w-full">
                  <div className="flex-1 flex items-center px-4 md:px-6 py-4 border-b-4 sm:border-b-0 sm:border-r-4 border-white bg-neutral-900 min-w-0">
                    <span className="text-zinc-500 font-black mr-1 text-sm md:text-lg shrink-0">supertime.wtf/</span>
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
                  <div className="mt-4 bg-red-500 text-white font-black p-3 uppercase border-4 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
                    {error}
                  </div>
                )}
              </form>
              <p className="mt-6 text-xs font-bold text-zinc-500 uppercase tracking-widest text-left">
                Join 5,000+ creators exchanging energy daily
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex justify-center lg:justify-end"
          >
            <EnergySphere />
          </motion.div>
        </div>
      </section>


      {/* Logo/Asset Tape */}
      <div className="bg-black/40 backdrop-blur-sm py-8 overflow-hidden border-y border-white/10">
        <div className="flex whitespace-nowrap animate-infinite-scroll">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-12">
              <span className="text-white font-black text-4xl uppercase tracking-tighter opacity-20">Moment is Art</span>
              <Sparkles className="text-neo-pink w-8 h-8" />
              <span className="text-white font-black text-4xl uppercase tracking-tighter opacity-80">Energy Exchange</span>
              <Zap className="text-neo-blue w-8 h-8 fill-neo-blue" />
              <span className="text-white font-black text-4xl uppercase tracking-tighter opacity-20">Pure Connection</span>
              <Heart className="text-neo-green w-8 h-8 fill-neo-green" />
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-32 px-6 relative overflow-hidden">
        {/* Artistic Background Assets */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-20 blur-3xl pointer-events-none">
          <div className="w-[500px] h-[500px] bg-neo-pink rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
          <div className="relative group">
            <motion.div
              whileHover={{ rotateY: 20, rotateX: -10 }}
              className="aspect-square bg-neutral-900 border border-white/20 shadow-2xl relative overflow-hidden rounded-3xl"
            >
              <div className="absolute inset-x-0 bottom-0 p-10">
                <h3 className="text-white text-5xl font-black uppercase leading-tight">Pure<br /><span className="text-neo-pink">Blissful</span> Art</h3>
              </div>
            </motion.div>
            {/* Background floating shadow */}
            <div className="absolute -inset-4 bg-white/5 blur-2xl -z-10 rounded-full group-hover:bg-neo-pink/5 transition-colors" />
          </div>

          <div className="perspective-1000">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-6xl md:text-8xl font-black uppercase leading-[0.85] mb-10 text-white italic">
                Time isn't<br />just <span className="text-neo-blue drop-shadow-[0_0_20px_rgba(68,97,255,0.4)]">money.</span>
              </h2>
              <p className="text-2xl font-bold text-zinc-400 mb-12 leading-relaxed">
                In a world of noise, a focused moment is the rarest currency. Supertime transforms your presence into a tradeable asset, ensuring every exchange is intentional, beautiful, and deeply valued.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Zap, label: 'Instant Settlement', color: 'bg-neo-blue' },
                  { icon: ShieldCheck, label: 'Secure Energy', color: 'bg-neo-green' },
                  { icon: Heart, label: 'Human-First', color: 'bg-neo-pink' },
                  { icon: Sparkles, label: 'Pure Art', color: 'bg-neo-yellow' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all cursor-default text-white"
                  >
                    <div className={`${item.color} p-2 rounded-lg`}>
                      <item.icon className="w-6 h-6 text-black" />
                    </div>
                    <span className="font-black uppercase tracking-tight text-sm">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Platform (Cards Redesign) */}
      <section id="platform" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-6xl md:text-9xl font-black uppercase mb-6 text-white tracking-tighter">
                How it <span className="text-neo-yellow text-outline">flows.</span>
              </h2>
              <p className="text-xl text-zinc-500 font-bold uppercase tracking-[0.3em]">The Architecture of Connection</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Identity',
                desc: 'Reserve your personalized energy portal. A unique digital signature.',
                color: 'neo-blue',
                icon: Globe
              },
              {
                step: '02',
                title: 'Valuation',
                desc: 'Quantum pricing for your presence. Audio or video, you set the art rate.',
                color: 'neo-pink',
                icon: CircleDollarSign
              },
              {
                step: '03',
                title: 'Exchange',
                desc: 'Host seamless calls. Instant settlement, every moment preserved as an asset.',
                color: 'neo-green',
                icon: Palette
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="relative group p-12 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl"
              >
                {/* Decorative BG Gradient */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-theme(colors.${feature.color})`} />

                <div className="relative z-10">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6 block">{feature.step} / FLOW</span>
                  <feature.icon className={`w-14 h-14 text-theme(colors.${feature.color}) mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`} />
                  <h3 className="text-4xl font-black uppercase mb-6 text-white">{feature.title}</h3>
                  <p className="text-zinc-400 text-lg font-medium leading-relaxed">{feature.desc}</p>
                </div>

                {/* Hover progress bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
                  <motion.div
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    className={`h-full bg-theme(colors.${feature.color})`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-40 px-6 relative overflow-hidden">
        {/* Simple color spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neo-pink opacity-[0.05] blur-[120px] -z-10" />

        <div className="max-w-4xl mx-auto text-center border border-white/10 p-12 md:p-24 rounded-[3rem] backdrop-blur-3xl bg-white/[0.02]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
          >
            <h2 className="text-6xl md:text-8xl font-black uppercase mb-12 leading-none text-white tracking-tight">
              Your time is <span className="text-neo-yellow drop-shadow-[0_0_30px_#CEFF1A]">Infinite</span> potential.
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-zinc-400 leading-tight mb-16 italic">
              "We are building a future where human attention is redirected from mindless scrolling to purposeful, beautiful exchange. Every call on Supertime is a brushstroke on the canvas of your life."
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="neo-btn bg-white text-black hover:bg-neo-pink hover:text-white border-none px-12 py-6 rounded-full text-xl shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                Join the Mission
              </button>
              <button className="neo-btn bg-black/40 text-white hover:bg-white/10 border border-white/20 px-12 py-6 rounded-full text-xl backdrop-blur-md">
                Read Manifest_01
              </button>
            </div>
          </motion.div>
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
              Created for the architects of the new human connection.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-pink">Platform</h4>
              <ul className="space-y-2 font-bold uppercase text-sm">
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Studio</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Showcase</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">API</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-blue">Ethics</h4>
              <ul className="space-y-2 font-bold uppercase text-sm">
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Manifesto</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-[0.3em] text-neo-green">Connect</h4>
              <ul className="space-y-2 font-bold uppercase text-sm">
                <li><a href="#" className="hover:text-neo-yellow transition-colors">𝕏 (Twitter)</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-neo-yellow transition-colors">Email</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-800 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">
          <span>© 2026 Energy Exchange Corp</span>
          <span>Designed for Bliss</span>
        </div>
      </footer >

    </div >
  );
}
