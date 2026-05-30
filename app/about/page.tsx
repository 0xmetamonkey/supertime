'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Globe } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background antialiased transition-colors duration-300">
      {/* Top Header Navigation */}
      <Header />

      {/* Main Content Area */}
      <main className="w-full px-6 sm:px-8 md:px-12 py-16 md:py-24 max-w-4xl mx-auto space-y-16">
        {/* Intro Manifesto */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Our thoughts on time & presence.
          </h1>
          <p className="text-xl md:text-2xl text-muted leading-relaxed font-normal pt-2">
            The modern internet was built to hijack attention. We are building the opposite: a digital space designed for focus, value, and true human connection.
          </p>
        </div>

        {/* The Core Values Grid */}
        <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-border">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">1. Human over algorithmic feeds</h3>
            <p className="text-muted text-base leading-relaxed">
              We do not use algorithms to maximize your screen time. There is no endless feed to scroll through, no vanity metrics, and no noise. Just real, intentional interactions when you choose to connect.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">2. Mutual respect for time</h3>
            <p className="text-muted text-base leading-relaxed">
              We believe a creator's time is valuable. By offering structured, paid micro-consultations, we foster conversations where both sides are fully present, prepared, and respectful of the exchange.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">3. Built in the open</h3>
            <p className="text-muted text-base leading-relaxed">
              We are building Supertime for the long term. This means being completely transparent about our business model, sharing our engineering challenges, and maintaining a public roadmap driven directly by our community.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background">
              <span className="font-bold text-sm">₹</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground">4. Zero-friction compensation</h3>
            <p className="text-muted text-base leading-relaxed">
              Whether you are an expert programmer, an indie artist, or a startup advisor, getting paid for your knowledge should be instant and seamless. We handle the heavy lifting so you can focus on the talk.
            </p>
          </div>
        </div>

        {/* Narrative / Letter Block */}
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 space-y-6 shadow-sm">
          <h4 className="font-semibold text-lg text-foreground">Why "supertime.wtf"?</h4>
          <p className="text-muted text-base leading-relaxed">
            Because the current state of digital connection is, quite frankly, broken. We spend hours liking, commenting, and double-tapping, yet we feel more disconnected than ever. Supertime is our protest—a quiet sandbox where you can book a direct video link, share a focused conversation, and build relationships that outlast any temporary social network.
          </p>
          <div className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100" 
                alt="Supertime Team"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Built with intent</p>
              <p className="text-xs text-muted">The Supertime Engineering & Design Team</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      {/* Footer */}
      <Footer />
    </div>
  );
}
