'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Zap, Sparkles, DollarSign, MessageSquare, Check, Eye, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { checkAvailability, completeOnboarding } from './actions';
import Header from './components/Header';
import Footer from './components/Footer';
import { useLanguage } from './components/LanguageContext';

export type HomepageVariant = 'bold' | 'calm' | 'monetize' | 'direct';

interface VariantData {
  id: HomepageVariant;
  label: string;
  badge: string;
  badgeColor: string;
  title: React.ReactNode;
  subtitle: string;
  featHeader: string;
  features: string[];
  claimBtn: string;
  claimPlaceholder: string;
  beliefTitle: string;
  beliefDesc: string;
}

const VARIANTS: Record<HomepageVariant, VariantData> = {
  bold: {
    id: 'bold',
    label: '⚡ fuck time.',
    badge: 'Raw & High-Conversion',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    title: (
      <>
        <span>fuck time.</span>
        <br />
        <span className="text-foreground/90">its supertime.</span>
      </>
    ),
    subtitle: "Turn your minutes into money. No feed algorithms, no endless scroll traps. Set your rate, share your link, and get paid for real 1:1 human conversations.",
    featHeader: "Why creators switch",
    features: [
      "💰 You set your rate per minute.",
      "⚡ 100% direct instant payouts.",
      "🚫 Zero feed manipulation or ads.",
      "🎙️ High-fidelity 1:1 live calling.",
      "🔒 Total control over your schedule."
    ],
    claimBtn: "Start earning",
    claimPlaceholder: "claim your link",
    beliefTitle: "The attention economy is broken. We're turning time into direct money.",
    beliefDesc: "You shouldn't have to produce free content all day just to feed social media algorithms. Supertime lets you monetize your real attention, insights, and presence with paid 1:1 calls and zero noise."
  },
  calm: {
    id: 'calm',
    label: '🌿 make your time matter',
    badge: 'Calm & Intentional',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    title: (
      <>
        Make your time matter.
      </>
    ),
    subtitle: "Supertime is a calm space to connect with creators, thinkers, artists and experts. Real conversations. Not endless content.",
    featHeader: "A better way to connect",
    features: [
      "No feeds.",
      "No algorithms.",
      "Just people.",
      "Real time.",
      "Real conversations."
    ],
    claimBtn: "Claim",
    claimPlaceholder: "username",
    beliefTitle: "We believe the internet can be calm, intentional and human.",
    beliefDesc: "Supertime was built to rescue digital relationships from the clickbait economy. By providing focused, compensated 1:1 sessions, we unlock authentic human presence without the artificial noise of feeds and alerts."
  },
  monetize: {
    id: 'monetize',
    label: '💎 monetize attention',
    badge: 'Creator Economy Value',
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    title: (
      <>
        <span>Your time has value.</span>
        <br />
        <span className="text-foreground/80">Stop giving it away for free.</span>
      </>
    ),
    subtitle: "The live monetization engine for creators, consultants, and specialists. Book paid 1:1 sessions without the administrative headache or algorithm traps.",
    featHeader: "Creator Economics",
    features: [
      "Keep 90% of your earnings.",
      "Frictionless 1-tap booking.",
      "Ultra-low latency studio.",
      "Built-in tips & supercalls.",
      "Instant direct bank transfers."
    ],
    claimBtn: "Get paid",
    claimPlaceholder: "your handle",
    beliefTitle: "Creators deserve direct compensation for their real presence.",
    beliefDesc: "Stop trading your energy for vanity likes. When people value your insights, they can book your live time with zero friction, zero spam, and immediate value exchange."
  },
  direct: {
    id: 'direct',
    label: '🎯 stop scrolling',
    badge: 'Anti-Social Media',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    title: (
      <>
        <span>Stop scrolling.</span>
        <br />
        <span className="text-foreground/80">Start speaking.</span>
      </>
    ),
    subtitle: "The antidote to superficial social feeds. Get unhurried, focused 1:1 face time with the people whose work and insights you admire.",
    featHeader: "Pure Interaction",
    features: [
      "Zero noise or notification spam.",
      "Dedicated live availability slots.",
      "Seamless in-browser studio.",
      "Authentic, memorable connections.",
      "Fair compensation for everyone."
    ],
    claimBtn: "Join now",
    claimPlaceholder: "reserve handle",
    beliefTitle: "Real presence beats passive consumption every single time.",
    beliefDesc: "Content fatigue is real. The most impactful insights and relationships happen in direct, two-way dialogue between two focused human minds."
  }
};

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
  const { t } = useLanguage();

  const [activeVariant, setActiveVariant] = useState<HomepageVariant>('bold');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isLoggedIn = !!clerkUser;

  // Sync variant with URL query parameter or localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlVar = params.get('v') || params.get('variant');
      if (urlVar && (urlVar in VARIANTS)) {
        setActiveVariant(urlVar as HomepageVariant);
        return;
      }
      const saved = localStorage.getItem('supertime_landing_variant');
      if (saved && (saved in VARIANTS)) {
        setActiveVariant(saved as HomepageVariant);
      }
    } catch (e) {
      // Ignore in SSR
    }
  }, []);

  const handleSelectVariant = (v: HomepageVariant) => {
    setActiveVariant(v);
    try {
      localStorage.setItem('supertime_landing_variant', v);
      const url = new URL(window.location.href);
      url.searchParams.set('v', v);
      window.history.replaceState(null, '', url.toString());
    } catch (e) {
      // Ignore
    }
  };

  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}/?v=${activeVariant}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      // Ignore
    }
  };

  const currentVariant = VARIANTS[activeVariant] || VARIANTS.bold;

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
        await completeOnboarding(username, 'creator');
        window.location.href = '/dashboard';
      } else {
        router.push(`/sign-in?forceRedirectUrl=/dashboard`);
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background antialiased transition-colors duration-300 pb-24">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <section className="pt-20 md:pt-28 pb-20 md:pb-32 transition-all duration-300">
        <div className="w-full px-6 sm:px-8 md:px-12 grid md:grid-cols-12 gap-12 md:gap-16 items-start">
          <div className="md:col-span-8 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 animate-in fade-in slide-in-from-top-2">
              <span className={`inline-block w-2 h-2 rounded-full ${activeVariant === 'bold' ? 'bg-amber-500 animate-pulse' : activeVariant === 'calm' ? 'bg-emerald-500' : activeVariant === 'monetize' ? 'bg-blue-500' : 'bg-purple-500'}`} />
              <span className="text-muted">{currentVariant.badge}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05] transition-all">
              {currentVariant.title}
            </h1>
            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-xl transition-all">
              {currentVariant.subtitle}
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
                      placeholder={currentVariant.claimPlaceholder}
                      className="flex-1 bg-transparent border-none outline-none text-foreground font-medium text-sm sm:text-base placeholder:text-muted/65 lowercase min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!username || loading}
                    className="bg-foreground text-background font-semibold px-6 py-3.5 sm:py-0 rounded-xl sm:rounded-none hover:opacity-90 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-1 shrink-0"
                  >
                    {loading ? '...' : currentVariant.claimBtn}
                  </button>
                </div>
                {error && (
                  <div className="text-sm font-medium text-red-500 pl-1 mt-2">
                    {error}
                  </div>
                )}
              </form>
              <div className="flex items-center gap-2 pl-1 pt-1">
                <span className="text-muted text-sm">{t('wantToSearch')}</span>
                <button
                  type="button"
                  onClick={() => router.push('/explore')}
                  className="text-foreground hover:text-muted font-semibold text-sm underline decoration-1 underline-offset-4 flex items-center gap-1 transition-colors"
                >
                  {t('exploreHumans')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Features Column (Aligned with subtle left border) */}
          <div className="md:col-span-4 md:border-l md:border-border md:pl-10 space-y-5 self-start md:pt-14 pt-6">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">{currentVariant.featHeader}</h4>
            <ul className="space-y-3.5 text-base text-muted font-medium leading-normal">
              {currentVariant.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-2" />
                  <span className="text-foreground/90">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Creator Grid Section */}
      <section id="creators" className="py-20 md:py-32 border-t border-border bg-surface">
        <div className="w-full px-6 sm:px-8 md:px-12">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{t('meetHumans')}</h2>
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
              {currentVariant.beliefTitle}
            </h2>
          </div>
          <div className="md:col-span-5 space-y-6">
            <p className="text-base text-muted leading-relaxed">
              {currentVariant.beliefDesc}
            </p>
            <div className="pt-2">
              <Link href="/about" className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-muted transition-colors">
                {t('readThoughts')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-20 md:py-32 border-t border-border">
        <div className="w-full px-6 sm:px-8 md:px-12">
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{t('roadmapTitle')}</h2>
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

      {/* FLOATING HOMEPAGE VARIANT SWITCHER DOCK */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[95vw] w-auto">
        {isSwitcherOpen ? (
          <div className="bg-surface/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 transition-all animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-muted select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>A/B TEST</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
              {(Object.keys(VARIANTS) as HomepageVariant[]).map((vKey) => {
                const variant = VARIANTS[vKey];
                const isSelected = activeVariant === vKey;
                return (
                  <button
                    key={vKey}
                    onClick={() => handleSelectVariant(vKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-foreground text-background shadow-sm scale-105'
                        : 'bg-surface hover:bg-border/60 text-muted hover:text-foreground border border-border/50'
                    }`}
                  >
                    <span>{variant.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-border/70 pt-1.5 sm:pt-0 sm:pl-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={handleCopyLink}
                title="Copy direct shareable link for this variant"
                className="text-[11px] font-medium text-muted hover:text-foreground px-2 py-1 rounded-lg hover:bg-border/40 transition-colors flex items-center gap-1"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">Copied ?v={activeVariant}</span>
                  </>
                ) : (
                  <>
                    <span>Share link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsSwitcherOpen(false)}
                title="Minimize toolbar"
                className="p-1 text-muted hover:text-foreground rounded-lg hover:bg-border/40 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsSwitcherOpen(true)}
            className="bg-surface/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border shadow-xl hover:shadow-2xl rounded-full px-4 py-2 text-xs font-semibold text-foreground flex items-center gap-2 hover:border-foreground/40 transition-all hover:scale-105"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Variant: {VARIANTS[activeVariant]?.label}</span>
            <ChevronUp className="w-3.5 h-3.5 text-muted" />
          </button>
        )}
      </div>
    </div>
  );
}
