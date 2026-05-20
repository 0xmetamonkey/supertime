'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowRight,
  Sparkles,
  Globe,
  CircleDollarSign,
  Palette,
  Heart,
  Menu,
  X,
  CheckCircle2,
  MousePointer2,
  Lock,
  Layers,
  Smartphone
} from 'lucide-react';

/* ── Custom Component: Floating Element ── */
function FloatingCard({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  return (
    <div 
      className={`absolute transition-all duration-700 animate-sphere-float ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function NewDemoClient() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-slide-pink selection:text-white bg-grid">
      
      {/* Navigation */}
      <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-[95%] max-w-7xl mx-auto rounded-full border-4 border-black bg-white/80 backdrop-blur-md px-6 py-3 flex justify-between items-center ${scrolled ? 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black flex items-center justify-center rounded-full">
            <Zap className="text-slide-yellow w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tighter">SUPERTIME</span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-black uppercase text-xs tracking-widest">
          <a href="#features" className="hover:text-slide-blue transition-colors">Product</a>
          <a href="#showcase" className="hover:text-slide-pink transition-colors">Showcase</a>
          <a href="#pricing" className="hover:text-slide-yellow transition-colors">Pricing</a>
          <button className="neo-brutal-btn bg-black text-white px-6 py-2 rounded-full text-xs">
            Join Waitlist
          </button>
        </div>

        <button onClick={() => setShowMobileMenu(true)} className="md:hidden">
          <Menu className="w-8 h-8" />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6 animate-fade-in-up">
            <span className="bg-slide-yellow w-1.5 h-1.5 rounded-full" />
            <span className="font-black uppercase text-[9px] tracking-widest">The Future of Creative Work</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.95] tracking-tighter mb-6 animate-fade-in-up">
            Monetize your <br />
            <span className="bg-slide-blue px-3 inline-block -rotate-1 rounded-xl">Expertise</span> <br />
            <span className="relative">
              instantly.
              <svg className="absolute -bottom-1 left-0 w-full h-3 text-slide-pink" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 25 20 50 10 T 100 10" fill="none" stroke="currentColor" strokeWidth="6" />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl font-bold max-w-xl mx-auto mb-10 text-zinc-600 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            The all-in-one platform for creators to sell sessions, digital products, and subscriptions without the technical headache.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <button className="neo-brutal-btn bg-black text-white px-8 py-4 rounded-2xl text-lg w-full sm:w-auto">
              Get Started Free
            </button>
            <button className="neo-brutal-btn bg-white text-black px-8 py-4 rounded-2xl text-lg w-full sm:w-auto">
              View Demo
            </button>
          </div>
        </div>

        {/* Floating Background Elements */}
        <FloatingCard className="top-40 left-[10%] hidden lg:block" delay={0}>
          <div className="bg-slide-yellow p-5 border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg]">
            <MousePointer2 className="w-6 h-6 fill-black" />
          </div>
        </FloatingCard>

        <FloatingCard className="top-60 right-[15%] hidden lg:block" delay={500}>
          <div className="bg-white p-4 border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[12deg]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="w-24 h-1.5 bg-zinc-200 rounded mb-1.5" />
            <div className="w-16 h-1.5 bg-zinc-100 rounded" />
          </div>
        </FloatingCard>

        <FloatingCard className="bottom-20 left-[20%] hidden lg:block" delay={1000}>
          <div className="bg-slide-pink p-4 border-[3px] border-black rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Heart className="w-6 h-6 text-black fill-current" />
          </div>
        </FloatingCard>
      </section>


      {/* Bento Grid Features */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Large Bento Card */}
          <div className="md:col-span-2 bg-white border-[3px] border-black rounded-[50px] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-slide-blue border-[3px] border-black rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black uppercase mb-3">Your Storefront, <br />Your Brand.</h3>
              <p className="text-base font-bold text-zinc-600 max-w-sm">
                Customizable pages that look professional in seconds. No coding, no complicated builders.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-slide-blue/20 to-transparent pointer-events-none" />
            <div className="mt-8 flex gap-3">
              <span className="px-3 py-1.5 bg-zinc-100 border-2 border-black rounded-full font-black text-[10px]">SEO READY</span>
              <span className="px-3 py-1.5 bg-zinc-100 border-2 border-black rounded-full font-black text-[10px]">MOBILE FIRST</span>
              <span className="px-3 py-1.5 bg-zinc-100 border-2 border-black rounded-full font-black text-[10px]">CUSTOM DOMAINS</span>
            </div>
          </div>

          {/* Small Bento Card */}
          <div className="bg-slide-yellow border-[3px] border-black rounded-[50px] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <CircleDollarSign className="w-8 h-8 text-slide-yellow" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-1">Instant Payouts</h3>
            <p className="font-bold text-sm">Money in your account as soon as you sell.</p>
          </div>

          {/* Vertical Bento Card */}
          <div className="bg-slide-pink border-[3px] border-black rounded-[50px] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div className="w-12 h-12 bg-white border-[3px] border-black rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-3">Secure & Private</h3>
              <p className="font-bold text-sm">Enterprise-grade security for you and your clients.</p>
            </div>
          </div>

          {/* Wide Bento Card */}
          <div className="md:col-span-2 bg-black text-white border-[3px] border-black rounded-[50px] p-8 shadow-[10px_10px_0px_0px_#fbbf24] flex items-center gap-6">
            <div className="flex-1">
              <h3 className="text-3xl font-black uppercase mb-3 text-slide-yellow">Automation is here.</h3>
              <p className="text-zinc-400 font-bold mb-5 text-sm">
                Connect your social media and let Supertime handle the inquiries while you sleep.
              </p>
              <button className="bg-white text-black px-5 py-2.5 rounded-xl font-black uppercase text-xs">
                Explore Workflows
              </button>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-3">
              <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-zinc-700">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-zinc-700">
                <Layers className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Marquee Ticker */}
      <div className="bg-black py-6 border-y-8 border-black overflow-hidden mt-12 mb-24 rotate-[-1deg]">
        <div className="flex whitespace-nowrap animate-infinite-scroll">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-12 px-12">
              <span className="text-slide-yellow font-black text-4xl uppercase italic">Build Your Empire</span>
              <Sparkles className="text-white w-10 h-10" />
              <span className="text-white font-black text-4xl uppercase">No Fees Forever</span>
              <Sparkles className="text-slide-pink w-10 h-10" />
              <span className="text-slide-blue font-black text-4xl uppercase italic">Join 10k+ Creators</span>
              <Sparkles className="text-white w-10 h-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <section className="bg-slide-yellow py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black uppercase mb-10 tracking-tighter">
            Ready to <br />Level up?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="bg-white p-1.5 rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-md flex items-center px-5">
              <input 
                type="text" 
                placeholder="supertime.wtf/you" 
                className="bg-transparent border-none outline-none flex-1 font-black text-lg placeholder:text-zinc-300"
              />
            </div>
            <button className="neo-brutal-btn bg-black text-white px-10 py-4 rounded-[30px] text-xl w-full sm:w-auto">
              Claim Link
            </button>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="py-20 px-6 bg-white border-t-4 border-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-black flex items-center justify-center rounded-full">
              <Zap className="text-slide-yellow w-7 h-7 fill-current" />
            </div>
            <span className="text-3xl font-black tracking-tighter">SUPERTIME</span>
          </div>
          
          <div className="flex gap-12 font-black uppercase text-xs tracking-widest">
            <a href="#" className="hover:underline">Twitter</a>
            <a href="#" className="hover:underline">Instagram</a>
            <a href="#" className="hover:underline">Contact</a>
            <a href="#" className="hover:underline">Privacy</a>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            © 2026 Supertime Inc. Built with love and caffeine.
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] bg-white p-8 flex flex-col animate-slide-in-right">
          <div className="flex justify-between items-center mb-12">
            <span className="text-2xl font-black uppercase">Menu</span>
            <button onClick={() => setShowMobileMenu(false)}>
              <X className="w-10 h-10" />
            </button>
          </div>
          <div className="flex flex-col gap-8 text-4xl font-black uppercase">
            <a href="#" onClick={() => setShowMobileMenu(false)}>Product</a>
            <a href="#" onClick={() => setShowMobileMenu(false)}>Showcase</a>
            <a href="#" onClick={() => setShowMobileMenu(false)}>Pricing</a>
            <a href="#" onClick={() => setShowMobileMenu(false)}>Login</a>
          </div>
        </div>
      )}

    </div>
  );
}
