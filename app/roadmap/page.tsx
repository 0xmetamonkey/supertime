'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Zap, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function RoadmapPage() {
  const router = useRouter();

  const roadmapItems = [
    {
      phase: "In progress",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      items: [
        {
          title: "The Persistent Audio Studio",
          desc: "Floating global recording widget enabling creators to instantly capture audio 'Feasts' while navigating the dashboard, powered by 100% free browser-native SpeechRecognition."
        },
        {
          title: "Supabase & WhatsApp/Truecaller Migration",
          desc: "Moving away from Clerk to self-hosted Supabase Auth combined with WhatsApp OTP and Truecaller 1-tap verification for seamless, global, and highly scalable user onboarding."
        },
        {
          title: "Native Mobile Apps (Capacitor)",
          desc: "Dedicated Android and iOS apps designed to make booking, presence notifications, and 1:1 call streams fully portable and smooth on mobile devices."
        }
      ]
    },
    {
      phase: "Planned",
      icon: <Clock className="w-5 h-5 text-zinc-400" />,
      items: [
        {
          title: "The Supertime NFT Engine",
          desc: "Every moment recorded is an asset. Allowing creators to mint their audio/text Feasts as NFTs, and introducing on-chain reputation badges for top subscribers."
        },
        {
          title: "DAO Governance Portals",
          desc: "Decentralized voting for human DAO members to standardize terminology (Patrons vs Kadradan) and vote on feature prioritization using $TIME tokens."
        },
        {
          title: "Group Circles & Gathering Rooms",
          desc: "Expanding the 1:1 video structure to support micro-workshops, group mentorship panels, and structured town halls with up to 10 participants."
        }
      ]
    },
    {
      phase: "Completed",
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      items: [
        {
          title: "Inner Circle Subscriptions",
          desc: "Launched 30-day recurring-style access passes powered by Razorpay, unlocking exclusive creator content and generating stable revenue."
        },
        {
          title: "The Feast Editorial Hub",
          desc: "A beautifully styled, markdown-powered timeline where creators can publish locked articles and audio snippets directly to their subscribers."
        },
        {
          title: "0ms Local Authentication",
          desc: "Optimized server-side route guards using local cryptographic session validation, reducing network-bound Clerk middleware lag to absolute zero."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background antialiased transition-colors duration-300">
      {/* Top Header Navigation */}
      <Header />

      {/* Main Content Area */}
      <main className="w-full px-6 sm:px-8 md:px-12 py-16 md:py-24 max-w-4xl mx-auto space-y-16">
        {/* Intro */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Our roadmap.
          </h1>
          <p className="text-xl md:text-2xl text-muted leading-relaxed font-normal pt-2">
            We are building in public. Here is a live, transparent look at what we are building, what is planned next, and what has recently landed.
          </p>
        </div>

        {/* Timeline List */}
        <div className="space-y-16 pt-8 border-t border-border">
          {roadmapItems.map((group, index) => (
            <div key={index} className="space-y-8">
              <div className="flex items-center gap-3">
                {group.icon}
                <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground text-sm">
                  {group.phase}
                </h2>
              </div>

              <div className="grid gap-6">
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-surface border border-border rounded-xl p-6 md:p-8 space-y-3 shadow-sm hover:border-foreground transition-colors duration-300">
                    <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
