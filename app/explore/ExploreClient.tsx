'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ArrowRight } from 'lucide-react';

export default function ExploreClient({ initialCreators = [] }: { initialCreators: any[] }) {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#F8F8F6] text-[#111111] font-sans selection:bg-[#111111] selection:text-white antialiased">
      {/* Top Header Navigation */}
      <header className="border-b border-[#E8E8E8] py-6 bg-[#F8F8F6]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm font-semibold text-[#6B6B6B] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to supertime
          </button>
          <span className="text-lg font-bold tracking-tight cursor-pointer" onClick={() => router.push('/')}>
            supertime
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#111111] leading-tight">
            Discover humans.
          </h1>
          <p className="text-lg text-[#6B6B6B] max-w-xl leading-relaxed">
            Browse through active writers, musicians, artists, and creators hosting real conversations in real time.
          </p>
        </div>

        {/* Search and Category Filtering UI */}
        <div className="space-y-6">
          <div className="relative max-w-xl">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, bio, or creative field..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-[#E8E8E8] rounded-xl outline-none text-[#111111] font-medium text-base shadow-sm hover:border-[#111111] focus:border-[#111111] transition-all"
            />
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="flex gap-2 flex-wrap pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  activeCategory === category
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#6B6B6B] border-[#E8E8E8] hover:border-[#111111] hover:text-[#111111]'
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
                  <div className="aspect-[4/5] bg-zinc-100 rounded-xl overflow-hidden relative border border-[#E8E8E8] shadow-sm transition-all duration-300 group-hover:border-[#111111]/30">
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
        ) : (
          <div className="text-center py-20 bg-white border border-[#E8E8E8] rounded-2xl p-8 max-w-xl mx-auto space-y-4 shadow-sm">
            <h3 className="text-xl font-bold text-[#111111]">No humans found</h3>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              We couldn't find any creator matching "{searchQuery}" under the category "{activeCategory}".
            </p>
            {searchQuery && (
              <div className="pt-4">
                <button
                  onClick={() => {
                    router.push(`/?claim=${searchQuery}`);
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#111111] text-white font-semibold px-5 py-3 rounded-xl hover:bg-zinc-800 transition-colors text-sm"
                >
                  Claim name @{searchQuery.toLowerCase().replace(/[^a-z0-9_]/g, '')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E8] py-8 bg-[#F8F8F6] mt-24">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-[#6B6B6B]">
          <span>© 2024 Supertime</span>
          <div className="flex gap-6 text-[#6B6B6B]">
            <a href="/#about" className="hover:text-[#111111] transition-colors">About</a>
            <a href="/#roadmap" className="hover:text-[#111111] transition-colors">Roadmap</a>
            <a href="/privacy" className="hover:text-[#111111] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#111111] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
