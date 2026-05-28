'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Menu, X, Check } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { checkAvailability, claimUsername } from './actions';

export default function LandingPageClient({ 
  session, 
  savedUsername,
  featuredCreators = []
}: { 
  session: any, 
  savedUsername: string | null,
  featuredCreators?: any[]
}) {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isLoggedIn = !!clerkUser;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        window.location.href = '/dashboard';
      } else {
        router.push(`/sign-in?forceRedirectUrl=/dashboard?claim=${username}`);
      }
    } catch (e: any) {
      console.error("Claim Hub Error:", e);
      setError(e.message || "Failed to process request. Try again.");
      setLoading(false);
    }
  };

  // Mock fallback creators
  const mockCreators = [
    {
      name: "Ananya",
      role: "Writer",
      desc: "Sunday letters & life conversations",
      time: "30 min",
      price: "₹299",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
      isReal: false
    },
    {
      name: "Kabir",
      role: "Musician",
      desc: "Music, process and everything in between",
      time: "45 min",
      price: "₹399",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
      isReal: false
    },
    {
      name: "Mei",
      role: "Artist",
      desc: "Show your work sessions",
      time: "30 min",
      price: "₹299",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400",
      isReal: false
    },
    {
      name: "Arjun",
      role: "Filmmaker",
      desc: "Script notes & story discussions",
      time: "45 min",
      price: "₹399",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400",
      isReal: false
    }
  ];

  // Merge real creators from KV with mock fallback creators
  const displayCreators = [...featuredCreators];
  if (displayCreators.length < 4) {
    const needed = 4 - displayCreators.length;
    for (let i = 0; i < needed; i++) {
      const mock = mockCreators[i % mockCreators.length];
      displayCreators.push(mock);
    }
  }

  // Pre-configured neutral portraits for real creators who haven't uploaded an avatar yet
  const fallbackAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400"
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#111111] font-sans selection:bg-[#111111] selection:text-white antialiased">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#F8F8F6]/90 backdrop-blur-md border-b border-[#E8E8E8] py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <span className="text-xl font-bold tracking-tight">supertime</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8 text-sm font-medium text-[#6B6B6B]">
              <a href="/explore" className="hover:text-[#111111] transition-colors">Explore</a>
              <a href="#creators" className="hover:text-[#111111] transition-colors">Creators</a>
              <a href="#pricing" className="hover:text-[#111111] transition-colors">Pricing</a>
              <a href="#about" className="hover:text-[#111111] transition-colors">About</a>
              <a href="#roadmap" className="hover:text-[#111111] transition-colors">Roadmap</a>
            </div>

            <button
              onClick={() => {
                if (isLoggedIn) window.location.href = '/dashboard';
                else router.push('/sign-in?forceRedirectUrl=/dashboard');
              }}
              className="hidden md:block text-sm font-medium text-[#111111] hover:text-[#6B6B6B] transition-colors"
            >
              {isLoggedIn ? 'Dashboard' : 'Sign in'}
            </button>

            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden text-[#111111] focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[1000] bg-[#F8F8F6] flex flex-col p-8 md:hidden">
          <div className="flex justify-between items-center mb-12">
            <span className="text-xl font-bold tracking-tight">supertime</span>
            <button onClick={() => setShowMobileMenu(false)} className="text-[#111111]">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-6 flex-1 text-lg font-medium text-[#6B6B6B]">
            <a href="/explore" onClick={() => setShowMobileMenu(false)} className="hover:text-[#111111] transition-colors">Explore</a>
            <a href="#creators" onClick={() => setShowMobileMenu(false)} className="hover:text-[#111111] transition-colors">Creators</a>
            <a href="#pricing" onClick={() => setShowMobileMenu(false)} className="hover:text-[#111111] transition-colors">Pricing</a>
            <a href="#about" onClick={() => setShowMobileMenu(false)} className="hover:text-[#111111] transition-colors">About</a>
            <a href="#roadmap" onClick={() => setShowMobileMenu(false)} className="hover:text-[#111111] transition-colors">Roadmap</a>
          </div>

          <div className="pt-8 border-t border-[#E8E8E8]">
            <button
              onClick={() => {
                if (isLoggedIn) window.location.href = '/dashboard';
                else router.push('/sign-in?forceRedirectUrl=/dashboard');
              }}
              className="w-full bg-[#111111] text-white py-4 rounded-full font-medium transition-colors hover:bg-zinc-800"
            >
              {isLoggedIn ? 'Dashboard' : 'Sign in'}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 md:pt-48 pb-20 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-12 md:gap-16 items-start">
          <div className="md:col-span-8 space-y-8">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-[#111111] leading-[1.05]">
              Intentional<br />time with humans.
            </h1>
            <p className="text-lg md:text-xl text-[#6B6B6B] leading-relaxed max-w-xl">
              Supertime is a calm space to connect with creators, thinkers, artists and experts. Real conversations. Not endless content.
            </p>

            {/* Claim Box */}
            <div className="max-w-lg pt-4">
              <form onSubmit={handleSubmit} className="relative w-full">
                <div className="flex flex-col sm:flex-row items-stretch bg-white border border-[#E8E8E8] rounded-xl overflow-hidden shadow-sm hover:border-[#111111] transition-all">
                  <div className="flex-1 flex items-center px-4 py-3.5 bg-white">
                    <span className="text-[#6B6B6B] font-medium mr-0.5 select-none text-base">supertime.com/</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="flex-1 bg-transparent border-none outline-none text-[#111111] font-medium text-base placeholder:text-[#B5B5B5] lowercase min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!username || loading}
                    className="bg-[#111111] text-white font-medium px-6 py-3.5 sm:py-0 hover:bg-zinc-800 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-1 shrink-0"
                  >
                    {loading ? '...' : (
                      <>
                        Claim name <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-3 text-sm font-medium text-red-500">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="md:col-span-4 md:pt-4 space-y-6">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">A better way to connect</h4>
            <ul className="space-y-3 text-base text-[#6B6B6B] font-normal leading-relaxed">
              <li>No feeds.</li>
              <li>No algorithms.</li>
              <li>Just people.</li>
              <li>Real time.</li>
              <li>Real conversations.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Creator Grid Section */}
      <section id="creators" className="py-20 md:py-32 border-t border-[#E8E8E8]/60 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#111111]">Meet some humans</h2>
            <a href="/explore" className="text-sm font-medium text-[#111111] hover:text-[#6B6B6B] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayCreators.map((creator, i) => {
              const imageSrc = creator.image || fallbackAvatars[i % fallbackAvatars.length];
              return (
                <div 
                  key={i} 
                  onClick={() => {
                    if (creator.isReal) {
                      router.push(`/${creator.name}`);
                    }
                  }}
                  className={`flex flex-col space-y-4 group ${creator.isReal ? 'cursor-pointer' : ''}`}
                >
                  <div className="aspect-[4/5] bg-zinc-100 rounded-xl overflow-hidden relative border border-[#E8E8E8]/50 shadow-sm transition-all duration-300 group-hover:border-[#111111]/30">
                    <img
                      src={imageSrc}
                      alt={creator.name}
                      className="w-full h-full object-cover grayscale contrast-[1.05] group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="space-y-1.5 px-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-lg text-[#111111] group-hover:underline decoration-1 underline-offset-4">
                        {creator.isReal ? `@${creator.name}` : creator.name}
                      </span>
                      <span className="text-[#6B6B6B] text-sm font-medium">{creator.role}</span>
                    </div>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed line-clamp-2">{creator.desc}</p>
                    <div className="flex gap-2 text-xs font-semibold text-[#111111] pt-1 items-center">
                      <span>{creator.time}</span>
                      <span className="text-[#E8E8E8]">•</span>
                      <span>{creator.price}</span>
                      {creator.isReal && (
                        <>
                          <span className="text-[#E8E8E8]">•</span>
                          <span className="text-[10px] bg-[#111111] text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">Active</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission / Belief Section */}
      <section id="about" className="py-20 md:py-32 border-t border-[#E8E8E8]/60">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 md:gap-16 items-start">
          <div className="md:col-span-7">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-[#111111] leading-tight max-w-lg">
              We believe the internet can be calm, intentional and human.
            </h2>
          </div>
          <div className="md:col-span-5 space-y-6">
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              Supertime is building the infrastructure for meaningful conversations. A place where time, attention and compensation are aligned.
            </p>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              We're here for the long term and we're building in the open. Follow our roadmap and grow with us.
            </p>
            <div className="pt-2">
              <a href="#roadmap" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111] hover:text-[#6B6B6B] transition-colors">
                Read our thoughts <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Pricing (Are.na style) */}
      <section id="pricing" className="py-20 md:py-32 border-t border-[#E8E8E8]/60 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#111111]">Simple, straightforward pricing</h2>
            <p className="text-base text-[#6B6B6B] leading-relaxed">
              No hidden fees, no complicated matrices. We keep it completely transparent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16 max-w-4xl mx-auto">
            {/* Free tier */}
            <div className="space-y-6 p-2">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#111111]">Creator (Free)</h3>
                <p className="text-4xl font-bold tracking-tight text-[#111111]">₹0</p>
                <p className="text-[#6B6B6B] text-sm">Always free, perfect for getting started.</p>
              </div>
              <ul className="space-y-3.5 text-sm text-[#6B6B6B] pt-4 border-t border-[#E8E8E8]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Unlimited storefront products</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Unlimited calendar bookings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Secure 1:1 call hosting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Standard transaction fees apply</span>
                </li>
              </ul>
            </div>

            {/* Premium tier */}
            <div className="space-y-6 p-2">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#111111]">Supertime Premium</h3>
                <p className="text-4xl font-bold tracking-tight text-[#111111]">₹999 <span className="text-lg font-normal text-[#6B6B6B]">/ month</span></p>
                <p className="text-[#6B6B6B] text-sm">For volume creators requiring customized configurations.</p>
              </div>
              <ul className="space-y-3.5 text-sm text-[#6B6B6B] pt-4 border-t border-[#E8E8E8]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Zero transaction fees from our end</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Custom domains & branding removal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Priority support infrastructure</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-20 md:py-32 border-t border-[#E8E8E8]/60 bg-[#F8F8F6]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#111111]">On our roadmap</h2>
            <a href="#roadmap" className="text-sm font-medium text-[#111111] hover:text-[#6B6B6B] flex items-center gap-1 transition-colors">
              View roadmap <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              {
                status: "In progress",
                title: "Mobile apps",
                desc: "Native apps for iOS and Android built specifically for smooth interaction on the go."
              },
              {
                status: "In progress",
                title: "Instant calls",
                desc: "One tap conversation setups with creators when they are online and available."
              },
              {
                status: "Planned",
                title: "Group conversations",
                desc: "Small group sessions, workshops, and gatherings within structured circles."
              },
              {
                status: "Planned",
                title: "Realtime infrastructure",
                desc: "Building our own ultra-low latency WebRTC video & audio engine for high fidelity presence."
              }
            ].map((item, i) => (
              <div key={i} className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'In progress' ? 'bg-[#111111]' : 'bg-[#D1D1CB]'}`} />
                  {item.status}
                </div>
                <h3 className="font-semibold text-lg text-[#111111]">{item.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E8] py-8 bg-[#F8F8F6]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-[#6B6B6B]">
          <span>© 2024 Supertime</span>
          <div className="flex gap-6 text-[#6B6B6B]">
            <a href="#about" className="hover:text-[#111111] transition-colors">About</a>
            <a href="#roadmap" className="hover:text-[#111111] transition-colors">Roadmap</a>
            <a href="/privacy" className="hover:text-[#111111] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#111111] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
