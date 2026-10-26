'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useTheme } from './ThemeProvider';
import {
  Sun,
  Moon,
  Compass,
  LayoutDashboard,
  ArrowRight,
  Maximize,
  Minimize2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import SafetyModal from './SafetyModal';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { theme, setTheme } = useTheme();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle error:', e);
    }
  };

  const navLinks = [
    {
      label: 'Supertalks',
      href: '/supertalks',
      isLive: true,
      badge: 'Live',
    },
    { label: 'About', href: '/about' },
    { label: 'Roadmap', href: '/roadmap' },
  ];

  return (
    <>
      <header className="border-b border-border/50 py-3.5 bg-background/80 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 active:scale-95 transition-all">
                ⚡
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-foreground group-hover:opacity-90">
                  supertime
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-surface border border-border text-foreground px-1.5 py-0.5 rounded-full shadow-sm">
                  Beta
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-surface/60 border border-border/50 px-2 py-1 rounded-full shadow-xs backdrop-blur-md">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              if (item.isLive) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>⚡ {item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted hover:text-foreground hover:bg-surface'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Safety Button */}
            <button
              onClick={() => setIsSafetyOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-surface border border-border/80 hover:border-emerald-500/50 text-xs font-medium text-foreground hover:text-emerald-400 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Safety Guidelines & Reporting"
              aria-label="Safety Guidelines"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden xs:inline">Safety</span>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-surface text-muted hover:text-foreground border border-transparent hover:border-border transition-all cursor-pointer active:scale-95"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-surface text-muted hover:text-foreground border border-transparent hover:border-border transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {!isSignedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/sign-in?forceRedirectUrl=/dashboard')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface rounded-full transition-all cursor-pointer whitespace-nowrap"
                >
                  Sign in
                </button>
                <button
                  onClick={() => router.push('/sign-up?forceRedirectUrl=/setup')}
                  className="bg-foreground text-background hover:opacity-90 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1 active:scale-95"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-foreground text-background hover:opacity-90 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5 active:scale-95"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Safety Modal */}
      <SafetyModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
      />
    </>
  );
}
