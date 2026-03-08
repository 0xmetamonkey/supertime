"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, ArrowLeft } from 'lucide-react';

const SketchyIcon = ({ className }: { className?: string }) => {
  // Adapt the pure white inverted image to match the text-colors used across the page
  const opacityFilter = className?.includes('zinc-600') ? ' opacity(0.4)' :
    className?.includes('zinc-500') ? ' opacity(0.5)' :
      className?.includes('zinc-400') ? ' opacity(0.7)' : '';

  return (
    <img
      src="/sketchy-logo.jpg"
      alt="Sketchy Icon"
      className={className}
      style={{
        filter: `invert(1) contrast(1.2)${opacityFilter}`,
        mixBlendMode: 'screen',
        objectFit: 'contain'
      }}
    />
  );
};

export default function DemoLandingPage() {
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen bg-black font-sans text-zinc-50 relative overflow-hidden selection:bg-white selection:text-black">
      {/* Background grain texture */}
      <div className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SketchyIcon className="w-8 h-8 text-white" />
            <span className="font-black text-2xl tracking-tighter text-white">supertime</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-bold text-sm tracking-widest uppercase">
            <a href="#platform" className="text-zinc-400 hover:text-white transition-colors">Platform</a>
            <a href="#philosophy" className="text-zinc-400 hover:text-white transition-colors">Philosophy</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <button className="bg-white text-black px-6 py-2 font-black rounded-[255px_15px_225px_15px/15px_225px_15px_255px] hover:bg-zinc-200 transition-colors border-2 border-transparent">
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center relative">

          {/* Main Hero Icon - Pure representation */}
          <motion.div
            animate={{
              y: [-8, 8, -8],
              rotate: [-2, 2, -2]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="relative mb-14 mt-4"
          >
            <SketchyIcon className="w-48 h-48 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
          </motion.div>

          {/* Handdrawn scribbles around text */}
          <div className="absolute top-[25%] left-[5%] text-zinc-700 w-16 h-16 opacity-50 hidden md:block" style={{ transform: 'rotate(-15deg)' }}>
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10,50 Q30,20 50,50 T90,50" />
              <path d="M30,30 L40,60 M60,30 L50,60" />
            </svg>
          </div>

          <div className="absolute bottom-[40%] right-[0%] text-zinc-700 w-24 h-24 opacity-50 hidden md:block" style={{ transform: 'rotate(25deg)' }}>
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="50" cy="50" r="40" strokeDasharray="10 10" />
              <path d="M50,10 L50,90 M10,50 L90,50" />
            </svg>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-black tracking-tighter mb-8 leading-[0.95] text-zinc-50">
            Monetize your <br />
            <span className="inline-block relative">
              <span className="relative z-10 text-white">imperfect</span>
              {/* Sketchy underline */}
              <svg className="absolute -bottom-1 md:-bottom-3 left-0 w-full h-4 text-zinc-300" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q25,20 50,5 T100,10 M5,14 Q30,24 55,9 T95,14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span> time.
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl font-medium mb-16 leading-relaxed">
            Raw, unfiltered knowledge exchange. No polished production needed. Turn your brain into a storefront instantly.
          </p>

          <div className="w-full max-w-lg relative group">
            {/* Input container with monochromatic imperfect styling */}
            <div className="absolute -inset-1 bg-white/20 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] blur-sm opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-black backdrop-blur-xl border-2 border-zinc-700 flex flex-col sm:flex-row items-center p-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] hover:border-zinc-500 transition-colors">
              <div className="w-full sm:w-auto flex items-center px-4 py-3 sm:py-0 border-b sm:border-b-0 sm:border-r border-zinc-800 border-dashed">
                <SketchyIcon className="w-5 h-5 text-zinc-400 mr-2" />
                <span className="text-zinc-500 font-semibold text-lg whitespace-nowrap">supertime.wtf/</span>
              </div>
              <input
                type="text"
                placeholder="you"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 w-full sm:w-auto bg-transparent border-none outline-none text-white font-bold text-xl px-4 py-3 sm:py-0 placeholder:text-zinc-700 text-center sm:text-left"
              />
              <button className="w-full sm:w-auto bg-white text-black px-8 py-4 font-black rounded-[15px_225px_15px_255px/255px_15px_225px_15px] hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-2 sm:mt-0">
                Claim
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section (Imperfect Sketch Cards) */}
      <section id="platform" className="py-24 px-6 relative z-10 border-t-[3px] border-zinc-900 border-dashed">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">Everything you need. <br className="hidden sm:block" /><span className="text-zinc-600">Nothing you don't.</span></h2>
            <p className="text-zinc-500 font-medium text-lg max-w-2xl mx-auto">Three core pillars designed to eliminate friction between your expertise and your audience's wallet.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "The Storefront", desc: "A gorgeous, link-in-bio optimized profile that showcases your digital products and call availability in one place.", rotate: "1deg", delay: 0 },
              { title: "The Call Engine", desc: "Sync your calendar and let clients book 1:1 sessions instantly. We handle the timezone math, the meeting link, and the payment.", rotate: "-2deg", delay: 0.1 },
              { title: "The AI Autopilot", desc: "Connect your Instagram and automatically send your storefront link to anyone who DMs you a specific keyword.", rotate: "1.5deg", delay: 0.2 }
            ].map((item, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: item.delay }}
                viewport={{ once: true }}
                key={i}
                className="bg-black backdrop-blur-xl border-2 border-zinc-800 p-8 hover:bg-zinc-900 transition-all group relative"
                style={{
                  borderRadius: i % 2 === 0 ? '255px 15px 225px 15px/15px 225px 15px 255px' : '15px 225px 15px 255px/255px 15px 225px 15px',
                  transform: `rotate(${item.rotate})`
                }}>

                {/* Sketchy accent shadow (faux drop shadow behind) */}
                <div className="absolute inset-0 border-2 border-zinc-700 -z-10 translate-x-3 translate-y-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{
                    borderRadius: i % 2 === 0 ? '255px 15px 225px 15px/15px 225px 15px 255px' : '15px 225px 15px 255px/255px 15px 225px 15px'
                  }} />

                <SketchyIcon className="w-12 h-12 text-white mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-2xl font-black tracking-tight mb-3 text-white">{item.title}</h3>
                <p className="text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-32 px-6 relative border-t border-zinc-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="relative order-2 md:order-1">
            <div className="aspect-square bg-black border-4 border-zinc-800 relative group p-10 flex flex-col justify-end"
              style={{ borderRadius: '20px 255px 20px 255px/255px 20px 255px 20px' }}>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ borderRadius: 'inherit' }} />
              <h3 className="text-white text-4xl md:text-5xl font-black tracking-tighter relative z-10">Focus is the real currency.</h3>
              {/* Decorative sketchy lines */}
              <svg className="absolute top-10 right-10 w-24 h-24 text-zinc-800" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="50" cy="50" r="40" strokeDasharray="10 15" />
                <path d="M50,10 L50,90 M10,50 L90,50" strokeDasharray="5 10" />
              </svg>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-6xl font-black leading-[1.1] mb-8 tracking-tighter">
              Stop managing. <br /><span className="text-zinc-600">Start monetizing.</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-12 leading-relaxed font-medium">
              In a world of infinite noise, your focused attention is the most valuable asset you own. Supertime builds the elegant infrastructure that lets you charge for access to your brain seamlessly.
            </p>
            <div className="space-y-6">
              {[
                { label: 'Instant Settlement', desc: 'Secure payments directly to your wallet.' },
                { label: 'Frictionless Scheduling', desc: 'No more back-and-forth emails.' },
                { label: 'Human-First Connection', desc: 'High-quality encrypted video calls.' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5 group">
                  <div className="mt-1 p-2 rounded-lg bg-white/5 border-2 border-dashed border-zinc-700 group-hover:border-zinc-500 transition-colors"
                    style={{ borderRadius: i % 2 === 0 ? '10px 5px 10px 5px' : '5px 10px 5px 10px' }}>
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold text-xl text-white mb-1">{item.label}</span>
                    <span className="block font-medium text-zinc-500 text-base">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 overflow-hidden relative border-t-2 border-zinc-900 border-dashed">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-white">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg text-zinc-400 font-medium max-w-2xl mx-auto">
              Start for free, upgrade when you're scaling mass impact.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Tier 1: Basic */}
            <div className="flex flex-col p-10 md:p-12 border-4 border-zinc-800 bg-black transition-all h-full relative group"
              style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white mb-1">Indie</h3>
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Growth Gateway</p>
                </div>
                <SketchyIcon className="w-6 h-6 text-zinc-600" />
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-white">₹0</span>
                  <span className="text-zinc-500 font-bold text-sm">/month</span>
                </div>
                <p className="text-white font-bold text-sm mt-3">+ 10% transaction fee</p>
              </div>
              <ul className="space-y-4 mb-10 flex-1 relative">
                <div className="absolute left-2.5 top-0 w-0.5 h-full bg-zinc-800" />
                {[
                  '1:1 Video Bookings',
                  '1:Many Broadcasts',
                  '2,000 Auto-DMs/mo',
                  'Unlimited Digital Store Items',
                  'Instant Payouts'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-4 font-bold text-sm text-zinc-300 relative z-10 pl-8">
                    <div className="absolute left-0 top-1 w-5 h-5 bg-zinc-800 border-2 border-zinc-600 rounded-sm"
                      style={{ borderRadius: i % 2 === 0 ? '4px 2px 4px 2px' : '2px 4px 2px 4px', transform: `rotate(${i % 2 === 0 ? '4deg' : '-4deg'})` }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-transparent border-2 border-zinc-700 text-white hover:bg-white/5 py-4 font-black transition-colors"
                style={{ borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px' }}>
                Start Free
              </button>
            </div>

            {/* Tier 2: Pro */}
            <div className="flex flex-col p-10 md:p-12 border-4 border-white bg-white/5 backdrop-blur-sm relative overflow-hidden h-full"
              style={{ borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px' }}>
              <div className="absolute top-6 right-8 bg-white text-black font-black text-[10px] px-3 py-1 z-20"
                style={{ borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px', transform: 'rotate(3deg)' }}>
                Most Popular
              </div>

              <div className="mb-6 flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white mb-1">Scale</h3>
                  <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Zero Platform Fees</p>
                </div>
              </div>
              <div className="mb-8 relative z-10">
                <div className="flex items-baseline gap-2 text-white">
                  <span className="text-5xl font-black tracking-tighter">₹2,999</span>
                  <span className="text-zinc-400 font-bold text-sm">/month</span>
                </div>
                <p className="text-white font-black text-sm mt-3 animate-pulse">0% transaction fee</p>
              </div>
              <ul className="space-y-4 mb-10 flex-1 relative z-10">
                <div className="absolute left-2.5 top-0 w-0.5 h-full bg-zinc-700/50" />
                {[
                  'Everything in Indie',
                  '0% Platform Commission',
                  'Unlimited Auto-DMs',
                  'Advanced House of Extsy Analytics',
                  'Remove Supertime Watermarks',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-4 font-bold text-sm text-white relative z-10 pl-8">
                    <div className="absolute left-0 top-1 w-5 h-5 bg-white border-2 border-white rounded-sm"
                      style={{ borderRadius: i % 2 === 0 ? '2px 4px 2px 4px' : '4px 2px 4px 2px', transform: `rotate(${i % 2 === 0 ? '-4deg' : '4deg'})` }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white text-black hover:bg-zinc-200 py-4 font-black transition-colors relative z-10"
                style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}>
                Upgrade to Scale
              </button>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="flex flex-col p-10 md:p-12 border-4 border-zinc-900 bg-black transition-all h-full relative group"
              style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-zinc-500 mb-1">Partners</h3>
                  <p className="text-zinc-600 font-bold text-xs uppercase tracking-widest">White-glove Service</p>
                </div>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-zinc-500">Custom</span>
                </div>
                <p className="text-zinc-600 font-bold text-sm mt-3">Tailored high-volume contracts</p>
              </div>
              <ul className="space-y-4 mb-10 flex-1 relative">
                <div className="absolute left-2.5 top-0 w-0.5 h-full bg-zinc-900" />
                {[
                  'Custom Domain Routing',
                  'Dedicated Account Manager',
                  'API & Webhook Access',
                  'Concierge Store Setup',
                  'Volume Discounts'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-4 font-bold text-sm text-zinc-500 relative z-10 pl-8">
                    <div className="absolute left-0 top-1 w-5 h-5 bg-zinc-900 border-2 border-zinc-800 rounded-sm"
                      style={{ borderRadius: i % 2 === 0 ? '4px 2px 4px 2px' : '2px 4px 2px 4px', transform: `rotate(${i % 2 === 0 ? '4deg' : '-4deg'})` }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-transparent border-2 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 py-4 font-black transition-colors"
                style={{ borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px' }}>
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6 border-t-2 border-zinc-900 text-center relative overflow-hidden max-w-5xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8">
          Build wealth on your <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10">own terms.</span>
            <svg className="absolute -bottom-2 left-0 w-full h-8 text-white/20" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0,10 Q25,20 50,5 T100,10 M5,14 Q30,24 55,9 T95,14 M10,18 Q40,28 70,8 T90,18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="text-xl text-zinc-400 font-medium max-w-2xl mx-auto mb-12">
          Join the rebellion against platform fees and algorithmic gatekeepers. Your knowledge, your audience, your money.
        </p>
        <button className="bg-white text-black px-10 py-5 font-black text-xl rounded-[15px_225px_15px_255px/255px_15px_225px_15px] hover:bg-zinc-200 transition-colors inline-flex items-center gap-3 group">
          Secure your handle
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* Minimal Monochrome Footer */}
      <footer className="border-t-[3px] border-zinc-900 border-dashed py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <SketchyIcon className="w-6 h-6 text-zinc-600" />
            <span className="font-bold tracking-tight text-zinc-500">supertime.wtf © 2026</span>
          </div>
          <div className="flex gap-6 font-bold text-sm tracking-widest uppercase text-zinc-600">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
