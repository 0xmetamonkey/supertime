'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { checkAvailability, claimUsername } from './actions';
import Header from './components/Header';
import Footer from './components/Footer';

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
  const isLoggedIn = !!clerkUser;

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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background antialiased transition-colors duration-300">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <section className="pt-20 md:pt-28 pb-20 md:pb-32">
        <div className="w-full px-6 sm:px-8 md:px-12 grid md:grid-cols-12 gap-12 md:gap-16 items-start">
          <div className="md:col-span-8 space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
              Intentional<br />time with humans.
            </h1>
            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-xl">
              Supertime is a calm space to connect with creators, thinkers, artists and experts. Real conversations. Not endless content.
            </p>

            {/* Claim Box & Explore Duality */}
            <div className="max-w-lg pt-4 space-y-4">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0 bg-transparent sm:bg-surface sm:border sm:border-border sm:rounded-xl sm:overflow-hidden sm:shadow-sm sm:hover:border-foreground sm:focus-within:border-foreground transition-all">
                  <div className="flex-1 flex items-center px-4 py-3.5 bg-surface border border-border sm:border-none rounded-xl sm:rounded-none shadow-sm sm:shadow-none hover:border-foreground focus-within:border-foreground sm:hover:border-transparent sm:focus-within:border-transparent transition-all">
                    <span className="text-muted font-medium mr-0.5 select-none text-sm sm:text-base">supertime.wtf/</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="flex-1 bg-transparent border-none outline-none text-foreground font-medium text-sm sm:text-base placeholder:text-muted/65 lowercase min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!username || loading}
                    className="bg-foreground text-background font-semibold px-6 py-3.5 sm:py-0 rounded-xl sm:rounded-none hover:opacity-90 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-1 shrink-0"
                  >
                    {loading ? '...' : 'Claim'}
                  </button>
                </div>
                {error && (
                  <div className="text-sm font-medium text-red-500 pl-1 mt-2">
                    {error}
                  </div>
                )}
              </form>
              <div className="flex items-center gap-2 pl-1 pt-1">
                <span className="text-muted text-sm">Want to search instead?</span>
                <button
                  type="button"
                  onClick={() => router.push('/explore')}
                  className="text-foreground hover:text-muted font-semibold text-sm underline decoration-1 underline-offset-4 flex items-center gap-1 transition-colors"
                >
                  explore humans <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Features Column (Aligned with subtle left border) */}
          <div className="md:col-span-4 md:border-l md:border-border md:pl-10 space-y-5 self-start md:pt-14 pt-6">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">A better way to connect</h4>
            <ul className="space-y-3 text-base text-muted font-medium leading-none">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                <span>No feeds.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                <span>No algorithms.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                <span>Just people.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                <span>Real time.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                <span>Real conversations.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Creator Grid Section */}
      <section id="creators" className="py-20 md:py-32 border-t border-border bg-surface">
        <div className="w-full px-6 sm:px-8 md:px-12">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Meet some humans</h2>
            <Link href="/explore" className="text-sm font-medium text-foreground hover:text-muted flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayCreators.map((creator, i) => {
              const imageSrc = creator.image || fallbackAvatars[i % fallbackAvatars.length];
              const handle = creator.username || creator.name.toLowerCase();
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (creator.isReal) {
                      router.push(`/${handle}`);
                    }
                  }}
                  className={`flex flex-col space-y-4 group ${creator.isReal ? 'cursor-pointer' : ''}`}
                >
                  <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden relative border border-border shadow-sm transition-all duration-300 group-hover:border-foreground/30">
                    <img
                      src={imageSrc}
                      alt={creator.name}
                      className="w-full h-full object-cover grayscale contrast-[1.05] group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="space-y-1.5 px-1">
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-lg text-foreground group-hover:underline decoration-1 underline-offset-4">
                          {creator.name}
                        </span>
                        <span className="text-muted text-sm font-medium">
                          {creator.role}
                        </span>
                      </div>
                      <div className="text-xs text-muted font-medium">
                        @{handle}
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed line-clamp-2 min-h-[2.75rem]">
                      {creator.desc}
                    </p>
                    <div className="flex gap-2 text-xs font-semibold text-foreground pt-1 items-center">
                      <span>{creator.time}</span>
                      {creator.isReal && (
                        <>
                          <span className="text-border">•</span>
                          <span className="text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">Active</span>
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
      <section id="about" className="py-20 md:py-32 border-t border-border">
        <div className="w-full px-6 sm:px-8 md:px-12 grid md:grid-cols-12 gap-12 md:gap-16 items-start">
          <div className="md:col-span-7">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight max-w-lg">
              We believe the internet can be calm, intentional and human.
            </h2>
          </div>
          <div className="md:col-span-5 space-y-6">
            <p className="text-base text-muted leading-relaxed">
              Supertime is building the infrastructure for meaningful conversations. A place where time, attention and compensation are aligned.
            </p>
            <div className="pt-2">
              <Link href="/about" className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-muted transition-colors">
                Read our thoughts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-20 md:py-32 border-t border-border">
        <div className="w-full px-6 sm:px-8 md:px-12">
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">On our roadmap</h2>
            <Link href="/roadmap" className="text-sm font-medium text-foreground hover:text-muted flex items-center gap-1 transition-colors">
              View roadmap <ArrowRight className="w-4 h-4" />
            </Link>
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
                <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'In progress' ? 'bg-foreground' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                  {item.status}
                </div>
                <h3 className="font-semibold text-lg text-foreground">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
