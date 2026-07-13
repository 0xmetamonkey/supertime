/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ArrowRight } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ExploreClient({ initialCreators = [] }: { initialCreators: any[] }) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Hardcoded mock fallback creators to populate if the database is fresh/empty
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

  // Pre-configured neutral portraits for creators with missing images
  const fallbackAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400"
  ];

  // Categories based on standard creator roles
  const categories = ['All', 'Writers', 'Musicians', 'Artists', 'Filmmakers', 'Other'];

  // Combine real database creators with mock fallbacks to show a beautiful page even if KV is empty
  const allCreators = useMemo(() => {
    const list = [...initialCreators];
    // Fill up to at least 4 if needed
    if (list.length < 4) {
      const needed = 4 - list.length;
      for (let i = 0; i < needed; i++) {
        const mock = mockCreators[i % mockCreators.length];
        // Ensure mock is not duplicating name if we already have it
        if (!list.some(c => c.name.toLowerCase() === mock.name.toLowerCase())) {
          list.push(mock);
        }
      }
    }
    return list;
  }, [initialCreators]);

  // Filter creators based on category & search query
  const filteredCreators = useMemo(() => {
    return allCreators.filter(creator => {
      // 1. Category Filter
      if (activeCategory !== 'All') {
        const role = creator.role.toLowerCase();
        if (activeCategory === 'Writers' && !role.includes('writer') && !role.includes('author') && !role.includes('poet')) return false;
        if (activeCategory === 'Musicians' && !role.includes('musician') && !role.includes('singer') && !role.includes('producer') && !role.includes('composer')) return false;
        if (activeCategory === 'Artists' && !role.includes('artist') && !role.includes('designer') && !role.includes('painter') && !role.includes('illustrator')) return false;
        if (activeCategory === 'Filmmakers' && !role.includes('filmmaker') && !role.includes('director') && !role.includes('video')) return false;
        if (activeCategory === 'Other') {
          const matchedStandard = role.includes('writer') || role.includes('author') || role.includes('poet') ||
                                  role.includes('musician') || role.includes('singer') || role.includes('producer') ||
                                  role.includes('artist') || role.includes('designer') || role.includes('painter') ||
                                  role.includes('filmmaker') || role.includes('director');
          if (matchedStandard) return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = creator.name.toLowerCase().includes(query);
        const matchesRole = creator.role.toLowerCase().includes(query);
        const matchesDesc = creator.desc.toLowerCase().includes(query);
        return matchesName || matchesRole || matchesDesc;
      }

      return true;
    });
  }, [allCreators, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background antialiased transition-colors duration-300">
      {/* Top Header Navigation */}
      <Header />

      {/* Hero Section */}
      <main className="w-full px-6 sm:px-8 md:px-12 py-16 md:py-24 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            Discover humans.
          </h1>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Browse through active writers, musicians, artists, and creators hosting real conversations in real time.
          </p>
        </div>

        {/* Search and Category Filtering UI */}
        <div className="flex flex-col items-center max-w-2xl mx-auto w-full space-y-6">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, bio, or creative field..."
              className="w-full pl-12 pr-6 py-4 bg-surface border border-border rounded-xl outline-none text-foreground font-medium text-base shadow-sm hover:border-foreground focus:border-foreground transition-all"
            />
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="flex gap-2 flex-wrap justify-center pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  activeCategory === category
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-surface text-muted border-border hover:border-foreground hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Creator Discovery Grid */}
        {filteredCreators.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-6">
            {filteredCreators.map((creator, i) => {
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
                        <span className="text-muted text-sm font-medium">{creator.role}</span>
                      </div>
                      <div className="text-xs text-muted font-medium">
                        @{handle}
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed line-clamp-2">{creator.desc}</p>
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
        ) : (
          <div className="text-center py-20 bg-surface border border-border rounded-2xl p-8 max-w-xl mx-auto space-y-4 shadow-sm">
            <h3 className="text-xl font-bold text-foreground">No humans found</h3>
            <p className="text-sm text-muted leading-relaxed">
              We couldn&apos;t find any creator matching &quot;{searchQuery}&quot; under the category &quot;{activeCategory}&quot;.
            </p>
            {searchQuery && (
              <div className="pt-4">
                <button
                  onClick={() => {
                    router.push(`/?claim=${searchQuery}`);
                  }}
                  className="inline-flex items-center gap-1.5 bg-foreground text-background font-semibold px-5 py-3 rounded-xl hover:opacity-95 transition-all text-sm"
                >
                  Claim name @{searchQuery.toLowerCase().replace(/[^a-z0-9_]/g, '')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
