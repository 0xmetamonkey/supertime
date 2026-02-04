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
    <div className="relative w-64 h-64 md:w-96 md:h-96">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-tr from-neo-blue via-neo-pink to-neo-green rounded-full opacity-30 blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full h-full border-8 border-black rounded-full overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] bg-white flex items-center justify-center group cursor-pointer"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--neo-yellow)_0%,_transparent_70%)] opacity-20 group-hover:opacity-40 transition-opacity" />
        <Zap className="w-24 h-24 text-black fill-neo-yellow animate-pulse" />
        <div className="absolute inset-0 border-[16px] border-black/5 rounded-full" />
      </motion.div>

      {/* Small orbiting items */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-40px] border-2 border-dashed border-black/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-80px] border border-black/10 rounded-full"
      />
    </div>
  );

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

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-neo-pink selection:text-white transition-colors duration-300">

      {/* Subtle Mouse Follower */}
      <div
        className="fixed w-8 h-8 pointer-events-none z-[100] transition-transform duration-150 ease-out hidden md:block"
        style={{
          left: `${mousePos.x - 16}px`,
          top: `${mousePos.y - 16}px`,
        }}
      >
        <div className="w-full h-full border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-neo-yellow/40" />
      </div>

      {/* Dynamic Navigation */}
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
              <a href="#platform" className="hover:text-neo-green transition-colors">Platform</a>
            </div>

            <button
              onClick={() => loginWithGoogle('/')}
              className="neo-btn bg-black text-white hover:bg-zinc-800"
            >
              {isLoggedIn ? 'Dashboard' : 'Log In'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 md:pt-28 pb-20 px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-40 -left-20 w-80 h-80 bg-neo-blue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-neo-pink/10 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center lg:text-left"
          >
            <motion.div variants={itemVariants} className="inline-block px-4 py-1 border-2 border-black bg-neo-yellow mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black uppercase text-xs tracking-[0.2em] text-black">The World's First Energy Exchange</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl xl:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-4 text-black">
              Turn your <span className="text-neo-pink">time</span><br />
              into <span className="text-neo-blue italic">pure art.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl font-bold max-w-xl mb-6 text-zinc-600 mx-auto lg:mx-0">
              We believe our time is your most beautiful asset. A mission to make each moment an asset that evolves into blissful human connection.
            </motion.p>

            <motion.div variants={itemVariants} className="max-w-xl w-full">
              <form onSubmit={handleSubmit} className="relative w-full">
                <div className="flex flex-col sm:flex-row items-stretch bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden w-full">
                  <div className="flex-1 flex items-center px-4 md:px-6 py-4 border-b-4 sm:border-b-0 sm:border-r-4 border-black bg-white min-w-0">
                    <span className="text-zinc-400 font-black mr-1 text-sm md:text-lg shrink-0">supertime.wtf/</span>
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
      <div className="bg-black py-8 overflow-hidden border-y-4 border-black">
        <div className="flex whitespace-nowrap animate-infinite-scroll">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-12">
              <span className="text-white font-black text-4xl uppercase tracking-tighter opacity-50">Moment is Art</span>
              <Sparkles className="text-neo-yellow w-8 h-8" />
              <span className="text-white font-black text-4xl uppercase tracking-tighter">Energy Exchange</span>
              <Zap className="text-neo-blue w-8 h-8 fill-neo-blue" />
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
                <h3 className="text-white text-4xl font-black uppercase">Pure Blissful Art</h3>
              </div>
              {/* Decorative dots */}
              <div className="absolute top-4 right-4 grid grid-cols-4 gap-2">
                {[...Array(16)].map((_, i) => <div key={i} className="w-2 h-2 bg-black rounded-full" />)}
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 border-4 border-black bg-neo-yellow -z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
          </div>

          <div>
            <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-8">
              Time isn't just <span className="text-neo-blue underline decoration-4 underline-offset-8">money.</span>
            </h2>
            <p className="text-2xl font-bold text-zinc-600 mb-8 leading-relaxed">
              In a world of noise, a focused moment is the rarest currency. Supertime transforms your presence into a tradeable asset, ensuring every exchange is intentional, beautiful, and deeply valued.
            </p>
            <div className="space-y-6">
              {[
                { icon: Zap, label: 'Instant Settlement', color: 'bg-neo-blue' },
                { icon: ShieldCheck, label: 'Secure Energy Exchange', color: 'bg-neo-green' },
                { icon: Heart, label: 'Human-First Connection', color: 'bg-neo-pink' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default text-black">
                  <div className={`${item.color} p-2 border-2 border-black`}>
                    <item.icon className="w-6 h-6 text-black" />
                  </div>
                  <span className="font-black uppercase tracking-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Platform (Cards) */}
      <section id="platform" className="py-24 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-8xl font-black uppercase mb-6">How it <span className="text-neo-yellow">works.</span></h2>
            <p className="text-xl text-zinc-400 font-bold uppercase tracking-widest">Three steps to artistic freedom</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Claim Identity',
                desc: 'Reserve your personalized energy portal. A unique link designed by you, for your world.',
                color: 'neo-blue',
                icon: Globe
              },
              {
                step: '02',
                title: 'Set Your Value',
                desc: 'Quantum pricing for your time. Audio or video, you decide the worth of your presence.',
                color: 'neo-pink',
                icon: CircleDollarSign
              },
              {
                step: '03',
                title: 'Exchange Energy',
                desc: 'Host seamless calls. Every second is compensated instantly, every moment recorded as art.',
                color: 'neo-green',
                icon: Palette
              }
            ].map((feature, i) => (
              <div key={i} className={`relative group p-10 border-4 border-white bg-zinc-900 shadow-[12px_12px_0px_0px_#fff] hover:shadow-[16px_16px_0px_0px_theme(colors.${feature.color})] transition-all`}>
                <div className="text-7xl font-black mb-6 opacity-20 outline-text">{feature.step}</div>
                <feature.icon className={`w-12 h-12 text-theme(colors.${feature.color}) mb-6`} />
                <h3 className="text-3xl font-black uppercase mb-4">{feature.title}</h3>
                <p className="text-zinc-400 font-bold leading-relaxed">{feature.desc}</p>
                <div className={`absolute top-4 right-4 w-4 h-4 rounded-full bg-theme(colors.${feature.color})`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-24 px-6 relative overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-1 bg-black" />
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl md:text-8xl font-black uppercase mb-12 leading-none">
            Your time is <span className="bg-neo-yellow px-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">Infinite</span> potential.
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-zinc-800 leading-tight mb-16">
            "We are building a future where human attention is redirected from mindless scrolling to purposeful, beautiful exchange. Every call on Supertime is a brushstroke on the canvas of your life."
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="neo-btn bg-neo-pink text-white hover:bg-neo-pink/90 scale-110">
              Join the Mission
            </button>
            <button className="neo-btn bg-white text-black hover:bg-zinc-100 scale-110">
              Read Manifest_01
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
      </footer>

    </div>
  );
}
