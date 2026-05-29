'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Zap, CheckCircle2 } from 'lucide-react';
import { useUser } from "@clerk/nextjs";

export default function RoadmapPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const roadmapItems = [
    {
      phase: "In progress",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      items: [
        {
          title: "Supabase & WhatsApp/Truecaller Migration",
          desc: "Moving away from Clerk to self-hosted Supabase Auth combined with WhatsApp OTP and Truecaller 1-tap verification for seamless, global, and highly scalable user onboarding."
        },
        {
          title: "Native Mobile Apps (Capacitor)",
          desc: "Dedicated Android and iOS apps designed to make booking, presence notifications, and 1:1 call streams fully portable and smooth on mobile devices."
        },
        {
          title: "Instant Video Call Presences",
          desc: "Allowing creators to toggle their 'active status' online, enabling users to launch instant micro-calls directly from the profile without prior calendar booking."
        }
      ]
    },
    {
      phase: "Planned",
      icon: <Clock className="w-5 h-5 text-zinc-400" />,
      items: [
        {
          title: "Group Circles & Gathering Rooms",
          desc: "Expanding the 1:1 video structure to support micro-workshops, group mentorship panels, and structured town halls with up to 10 participants."
        },
        {
          title: "Ultra-low Latency WebRTC Presence Core",
          desc: "Developing custom WebRTC media servers to route high-fidelity audio/video streams with ultra-low delay globally."
        }
      ]
    },
    {
      phase: "Completed",
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      items: [
        {
          title: "0ms Local Authentication",
          desc: "Optimized server-side route guards using local cryptographic session validation, reducing network-bound Clerk middleware lag to absolute zero."
        },
        {
          title: "Parallel Database KV Engines",
          desc: "Refactored creator listings and search feeds to fetch data concurrently via parallel promise executions, boosting page load speeds by 10x."
        },
        {
          title: "Liquid Wide Design Alignment",
          desc: "Fully expanded the application and discovery pages to wide liquid layouts, removing legacy borders to deliver an open, edge-to-edge luxury aesthetic."
        }
      ]
    }
  ];

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
        {/* Intro */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-[#111111] leading-[1.05]">
            Our roadmap.
          </h1>
          <p className="text-xl md:text-2xl text-[#6B6B6B] leading-relaxed font-normal pt-2">
            We are building in public. Here is a live, transparent look at what we are building, what is planned next, and what has recently landed.
          </p>
        </div>

        {/* Timeline List */}
        <div className="space-y-16 pt-8 border-t border-[#E8E8E8]">
          {roadmapItems.map((group, index) => (
            <div key={index} className="space-y-8">
              <div className="flex items-center gap-3">
                {group.icon}
                <h2 className="text-2xl font-bold uppercase tracking-wider text-[#111111] text-sm">
                  {group.phase}
                </h2>
              </div>

              <div className="grid gap-6">
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-white border border-[#E8E8E8] rounded-xl p-6 md:p-8 space-y-3 shadow-sm hover:border-[#111111] transition-colors duration-300">
                    <h3 className="text-lg font-bold text-[#111111]">{item.title}</h3>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
