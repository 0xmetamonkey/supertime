'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles, ArrowRight, ShieldCheck, Heart, Globe, CircleDollarSign, Palette } from 'lucide-react';

export default function DemoDesignPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-neo-pink overflow-hidden relative">

      {/* Dynamic Background Blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[600px] h-[600px] bg-neo-blue/20 blur-[120px] rounded-full cosmic-blob animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-neo-pink/20 blur-[120px] rounded-full cosmic-blob animate-pulse delay-1000" />
      <div className="fixed top-[30%] right-[10%] w-[400px] h-[400px] bg-neo-green/10 blur-[100px] rounded-full cosmic-blob" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/20 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Zap className="text-neo-yellow w-6 h-6 fill-neo-yellow" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter">Supertime</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8 font-bold uppercase text-[10px] tracking-[0.3em] text-white/50">
              <span className="hover:text-white transition-colors cursor-pointer">Philosophy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Mission</span>
              <span className="hover:text-white transition-colors cursor-pointer">Platform</span>
            </div>
            <button className="px-6 py-2 bg-white text-black font-black uppercase text-xs rounded-full hover:bg-neo-yellow transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Enter Studio
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8">
              <Sparkles className="w-4 h-4 text-neo-yellow" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">The World's First Energy Exchange</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.9] tracking-tighter mb-8">
              Turn your <span className="cosmic-text-gradient italic">time</span><br />
              into <span className="text-white">pure art.</span>
            </h1>

            <p className="text-xl font-medium text-white/60 max-w-lg mb-12 leading-relaxed">
              We believe your presence is a masterpiece. Monetize every moment through high-fidelity human connection.
            </p>

            <div className="max-w-md">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-neo-blue via-neo-pink to-neo-green rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-1.5 backdrop-blur-3xl">
                  <div className="flex-1 px-6 py-4">
                    <span className="text-white/30 font-black mr-1 uppercase text-sm">supertime.wtf/</span>
                    <input
                      type="text"
                      placeholder="YOU"
                      className="bg-transparent border-none outline-none text-white font-black text-xl placeholder:text-white/10 uppercase w-24"
                    />
                  </div>
                  <button className="bg-white text-black font-black px-8 py-4 rounded-xl hover:bg-neo-yellow transition-colors uppercase text-sm flex items-center gap-2">
                    Claim <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative w-80 h-80 md:w-[500px] md:h-[500px]">
              {/* Outer Rings */}
              <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-10 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

              {/* Main Sphere */}
              <div className="absolute inset-20 cosmic-glass rounded-full flex items-center justify-center animate-float shadow-[0_0_100px_rgba(68,97,255,0.2)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-neo-blue/40 via-neo-pink/40 to-neo-green/40 opacity-50" />
                <Zap className="w-32 h-32 md:w-48 md:h-48 text-white fill-white shadow-[0_0_50px_rgba(255,255,255,0.5)] z-20" />

                {/* Internal Liquid Effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--neo-yellow)_0%,_transparent_70%)] opacity-20 blur-3xl"
                />
              </div>

              {/* Orbital Assets */}
              <div className="absolute top-0 right-0 p-4 cosmic-glass rounded-2xl animate-float">
                <CircleDollarSign className="w-6 h-6 text-neo-green" />
              </div>
              <div className="absolute bottom-20 left-0 p-4 cosmic-glass rounded-2xl animate-float delay-700">
                <Palette className="w-6 h-6 text-neo-pink" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Showcase Section: Active Energy Flows */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">Active <span className="cosmic-text-gradient italic">Showcase</span></h2>
              <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Exchanging energy across the digital void</p>
            </div>
            <button className="hidden md:flex items-center gap-2 font-black uppercase text-xs text-neo-yellow hover:text-white transition-colors">
              View all flows <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Nova", status: "In Session", rate: "120", energy: "High", color: "neo-blue" },
              { name: "Aether", status: "Ready", rate: "85", energy: "Pure", color: "neo-pink" },
              { name: "Flux", status: "In Session", rate: "250", energy: "Zen", color: "neo-green" },
              { name: "Koda", status: "Ready", rate: "40", energy: "Warm", color: "neo-yellow" }
            ].map((creator, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="cosmic-glass rounded-3xl overflow-hidden group border-white/5 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className={`h-40 bg-gradient-to-br from-white/5 to-white/10 relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-theme(colors.${creator.color})/10 group-hover:opacity-40 transition-opacity`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-full bg-white/5 border border-white/20 flex items-center justify-center animate-pulse`}>
                      <Zap className={`w-8 h-8 text-theme(colors.${creator.color}) fill-current`} />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black uppercase">{creator.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded-md border border-white/10">{creator.energy}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/40 font-bold uppercase">Rate</span>
                      <span className="text-lg font-black">{creator.rate}<span className="text-xs text-white/40">/min</span></span>
                    </div>
                    <button className={`p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-white group-hover:text-black transition-all`}>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call Preview: The Interface */}
      <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative">
              {/* Desktop-like Window */}
              <motion.div
                initial={{ rotateY: -10, rotateX: 5 }}
                animate={{ rotateY: 5, rotateX: -5 }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
                className="cosmic-glass rounded-[2rem] border-white/20 aspect-video relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
              >
                {/* Mock Video Feed */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

                {/* UI Overlays */}
                <div className="absolute top-8 left-8 flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Live Energy Stream</span>
                </div>

                <div className="absolute bottom-8 inset-x-8 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 font-bold uppercase block tracking-widest">Time Remaining</span>
                    <span className="text-4xl font-black tracking-tighter">14:22</span>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl hover:bg-white/20 transition-all cursor-pointer">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-neo-pink border border-neo-pink/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,245,0.4)] hover:scale-110 transition-all cursor-pointer">
                      <Heart className="w-5 h-5 fill-white" />
                    </div>
                  </div>
                </div>

                {/* Floating Tip Card */}
                <div className="absolute top-8 right-8 w-32 cosmic-glass p-4 rounded-2xl border-white/10 scale-90 origin-top-right animate-float">
                  <span className="text-[8px] text-white/40 font-black uppercase block mb-1">Recent Bonus</span>
                  <span className="text-lg font-black text-neo-green">+$45.00</span>
                </div>
              </motion.div>

              {/* Floating Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-neo-blue/20 blur-[60px] rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-neo-pink/20 blur-[60px] rounded-full" />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-6xl font-black uppercase mb-8 leading-none">A UI that <br /><span className="text-neo-pink">Exhales</span> Precision.</h2>
            <p className="text-xl text-white/50 font-medium leading-relaxed mb-10">
              Forget clunky dashboards. Our interface is a glass canvas that flows around your connection. Every pixel is tuned for focus, beauty, and instant compensation.
            </p>
            <ul className="space-y-6">
              {[
                { label: "Vanish-Mode Controls", desc: "UI that disappears when you don't need it." },
                { label: "Quantum Settlements", desc: "Real-time earnings visible in every Frame." },
                { label: "Glassmorphism Core", desc: "Depth that feels premium on any device." }
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-neo-yellow/20 flex items-center justify-center border border-neo-yellow/50 shrink-0 mt-1">
                    <div className="w-1.5 h-1.5 bg-neo-yellow rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-sm mb-1">{item.label}</h4>
                    <p className="text-white/40 text-xs font-bold leading-tight">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neo-blue/5 to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-12 leading-none">
            Ready to <br /> <span className="cosmic-text-gradient">Ascend?</span>
          </h2>
          <p className="text-xl text-white/40 font-bold uppercase tracking-widest mb-16 max-w-2xl mx-auto">
            The future of human connection isn't just a platform. It's an energy state.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="neo-btn bg-white text-black hover:bg-neo-yellow border-none rounded-full px-12 py-6 text-lg shadow-[0_10px_40px_rgba(255,255,255,0.2)]">
              Claim Your Void
            </button>
            <button className="px-12 py-6 border border-white/10 rounded-full font-black uppercase text-sm hover:bg-white/5 transition-all">
              The Manifesto
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
          <span>© 2026 Energy Exchange Corp</span>
          <div className="flex gap-8">
            <span className="hover:text-white transition-colors cursor-pointer tracking-normal">Twitter</span>
            <span className="hover:text-white transition-colors cursor-pointer tracking-normal">Discord</span>
          </div>
          <span>Designed for Bliss</span>
        </div>
      </footer>
    </div>
  );
}

