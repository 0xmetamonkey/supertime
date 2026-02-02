'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Clock, ArrowRight, Heart } from 'lucide-react';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch('/api/waitlist').then(r => r.json()).then(d => setCount(d.count || 0));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setCount(c => c + 1);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-neo-pink selection:text-white overflow-hidden relative">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* Floating Color Blobs */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#CEFF1A]/30 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF52D9]/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto flex justify-between items-center p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-black flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#CEFF1A]">
            <Zap className="text-[#CEFF1A] w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">
            Super<span className="text-[#FF52D9]">Time</span>
          </h1>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-12 md:pt-20 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#CEFF1A] mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#CEFF1A]" />
            <span className="text-xs font-black uppercase tracking-widest">Coming Soon</span>
          </motion.div>

          {/* Main Headline */}
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
            Monetize
            <br />
            <span className="italic text-[#FF52D9]">Your Time.</span>
          </h2>

          <p className="max-w-lg mx-auto text-lg md:text-xl text-zinc-600 font-medium mb-12">
            Paid video calls for creators. Set your rate. Get paid per minute.
            <span className="text-black font-bold"> It's that simple.</span>
          </p>

          {/* Signup Form */}
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#CEFF1A] border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] max-w-md mx-auto"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h3 className="text-2xl font-black uppercase mb-2">You're In!</h3>
                <p className="text-black/70 font-bold">We'll notify you at launch.</p>
                <div className="mt-6 pt-6 border-t-4 border-black">
                  <p className="text-sm font-black uppercase">
                    <span className="text-[#FF52D9]">{count}</span> early adopters
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] max-w-md mx-auto space-y-4"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="YOUR NAME"
                  className="w-full bg-zinc-100 border-4 border-black px-4 py-4 font-bold uppercase placeholder:text-zinc-400 focus:outline-none focus:border-[#FF52D9] transition-colors"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOUR EMAIL"
                  required
                  className="w-full bg-zinc-100 border-4 border-black px-4 py-4 font-bold uppercase placeholder:text-zinc-400 focus:outline-none focus:border-[#FF52D9] transition-colors"
                />
                <motion.button
                  type="submit"
                  disabled={status === 'loading'}
                  whileHover={{ scale: 1.02, x: 4, y: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-black text-[#CEFF1A] font-black py-5 text-xl uppercase tracking-wider border-4 border-black shadow-[6px_6px_0px_0px_#CEFF1A] hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {status === 'loading' ? (
                    'Joining...'
                  ) : (
                    <>
                      Get Early Access
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {status === 'error' && (
                  <p className="text-red-500 text-sm font-bold uppercase">Something went wrong. Try again.</p>
                )}

                {count > 0 && (
                  <p className="text-zinc-500 text-sm font-bold uppercase pt-4">
                    <span className="text-[#FF52D9]">{count}</span> people already joined
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
        >
          {[
            { icon: Clock, title: 'Per-Minute Billing', desc: 'Set your rate. Earn every minute.' },
            { icon: Zap, title: 'Instant Payouts', desc: 'Get paid directly to your UPI.' },
            { icon: Heart, title: 'Build Your Audience', desc: 'Your link. Your fans. Your income.' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#CEFF1A] transition-all"
            >
              <feature.icon className="w-8 h-8 mb-4 text-[#FF52D9]" />
              <h3 className="font-black uppercase text-lg mb-2">{feature.title}</h3>
              <p className="text-zinc-600 font-medium text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-4 border-black py-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
          © 2026 SuperTime • Designed for Creators
        </p>
      </footer>
    </main>
  );
}
