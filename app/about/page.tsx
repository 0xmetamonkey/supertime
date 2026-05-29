'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Globe } from 'lucide-react';
import { useUser } from "@clerk/nextjs";

export default function AboutPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#111111] font-sans selection:bg-[#111111] selection:text-white antialiased">
      {/* Top Header Navigation */}
      <header className="border-b border-[#E8E8E8]/60 py-4 bg-[#F8F8F6]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-6 sm:px-8 md:px-12 flex justify-between items-center">
          <span className="text-lg font-bold tracking-tight cursor-pointer" onClick={() => router.push('/')}>
            supertime
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                router.push('/#claim');
              }}
              className="bg-[#111111] hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            >
              Claim profile
            </button>
            <button
              onClick={() => {
                if (isSignedIn) router.push('/dashboard');
                else router.push('/sign-in?forceRedirectUrl=/dashboard');
              }}
              className="border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            >
              {isSignedIn ? 'Dashboard' : 'Sign in'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full px-6 sm:px-8 md:px-12 py-16 md:py-24 max-w-4xl mx-auto space-y-16">
        {/* Intro Manifesto */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-[#111111] leading-[1.05]">
            Our thoughts on time & presence.
          </h1>
          <p className="text-xl md:text-2xl text-[#6B6B6B] leading-relaxed font-normal pt-2">
            The modern internet was built to hijack attention. We are building the opposite: a digital space designed for focus, value, and true human connection.
          </p>
        </div>

        {/* The Core Values Grid */}
        <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-[#E8E8E8]">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center text-white">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-[#111111]">1. Human over algorithmic feeds</h3>
            <p className="text-[#6B6B6B] text-base leading-relaxed">
              We do not use algorithms to maximize your screen time. There is no endless feed to scroll through, no vanity metrics, and no noise. Just real, intentional interactions when you choose to connect.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-[#111111]">2. Mutual respect for time</h3>
            <p className="text-[#6B6B6B] text-base leading-relaxed">
              We believe a creator's time is valuable. By offering structured, paid micro-consultations, we foster conversations where both sides are fully present, prepared, and respectful of the exchange.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center text-white">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-[#111111]">3. Built in the open</h3>
            <p className="text-[#6B6B6B] text-base leading-relaxed">
              We are building Supertime for the long term. This means being completely transparent about our business model, sharing our engineering challenges, and maintaining a public roadmap driven directly by our community.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center text-white">
              <span className="font-bold text-sm">₹</span>
            </div>
            <h3 className="text-xl font-semibold text-[#111111]">4. Zero-friction compensation</h3>
            <p className="text-[#6B6B6B] text-base leading-relaxed">
              Whether you are an expert programmer, an indie artist, or a startup advisor, getting paid for your knowledge should be instant and seamless. We handle the heavy lifting so you can focus on the talk.
            </p>
          </div>
        </div>

        {/* Narrative / Letter Block */}
        <div className="bg-white border border-[#E8E8E8] rounded-2xl p-8 md:p-12 space-y-6 shadow-sm">
          <h4 className="font-semibold text-lg text-[#111111]">Why "supertime.wtf"?</h4>
          <p className="text-[#6B6B6B] text-base leading-relaxed">
            Because the current state of digital connection is, quite frankly, broken. We spend hours liking, commenting, and double-tapping, yet we feel more disconnected than ever. Supertime is our protest—a quiet sandbox where you can book a direct video link, share a focused conversation, and build relationships that outlast any temporary social network.
          </p>
          <div className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100" 
                alt="Supertime Team"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">Built with intent</p>
              <p className="text-xs text-[#6B6B6B]">The Supertime Engineering & Design Team</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E8] py-8 bg-[#F8F8F6] mt-24">
        <div className="w-full px-6 sm:px-8 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-[#6B6B6B]">
          <span>© 2026 Supertime</span>
          <div className="flex gap-6 text-[#6B6B6B]">
            <a href="/about" className="hover:text-[#111111] transition-colors">About</a>
            <a href="/roadmap" className="hover:text-[#111111] transition-colors">Roadmap</a>
            <a href="/privacy" className="hover:text-[#111111] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#111111] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
