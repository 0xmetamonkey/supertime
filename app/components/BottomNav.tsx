'use client';

import React, { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

function BottomNavContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();

  const currentTab = searchParams?.get('tab');
  const chatTo = searchParams?.get('to');

  // Hide bottom nav on immersive fullscreen video / call screens OR active mobile chat view
  const isImmersiveMode =
    pathname?.startsWith('/roulette') ||
    pathname?.startsWith('/hourglass') ||
    pathname?.startsWith('/supertalks') ||
    pathname?.startsWith('/talktime') ||
    pathname?.startsWith('/studio/room') ||
    (pathname === '/dashboard' && currentTab === 'inbox' && Boolean(chatTo));

  if (isImmersiveMode) {
    return null;
  }
  const isHome = pathname === '/';
  const isInbox = (pathname === '/dashboard' && currentTab === 'inbox') || pathname === '/chat';
  const isStudio = pathname?.startsWith('/dashboard') && currentTab !== 'inbox';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-border/40 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all duration-300"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold transition-all relative group cursor-pointer active:scale-95 duration-150"
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              isHome
                ? 'text-foreground bg-surface shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              isHome ? 'text-foreground font-bold' : 'text-muted'
            }`}
          >
            Home
          </span>
          {isHome && (
            <motion.div
              layoutId="bottom-nav-active-pill"
              className="absolute top-1 w-1 h-1 rounded-full bg-foreground"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        {/* Tab 2: Inbox / Direct Messages */}
        <button
          onClick={() => {
            if (!isSignedIn) {
              router.push('/sign-in?forceRedirectUrl=/dashboard?tab=inbox');
            } else {
              router.push('/dashboard?tab=inbox');
            }
          }}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold transition-all relative group cursor-pointer active:scale-95 duration-150"
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              isInbox
                ? 'text-foreground bg-surface shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              isInbox ? 'text-foreground font-bold' : 'text-muted'
            }`}
          >
            Inbox
          </span>
          {isInbox && (
            <motion.div
              layoutId="bottom-nav-active-pill"
              className="absolute top-1 w-1 h-1 rounded-full bg-foreground"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        {/* Tab 3: Studio Dashboard / You */}
        <button
          onClick={() => {
            if (!isSignedIn) {
              router.push('/sign-in?forceRedirectUrl=/dashboard');
            } else {
              router.push('/dashboard');
            }
          }}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold transition-all relative group cursor-pointer active:scale-95 duration-150"
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              isStudio
                ? 'text-foreground bg-surface shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              isStudio ? 'text-foreground font-bold' : 'text-muted'
            }`}
          >
            Studio
          </span>
          {isStudio && (
            <motion.div
              layoutId="bottom-nav-active-pill"
              className="absolute top-1 w-1 h-1 rounded-full bg-foreground"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>
    </nav>
  );
}

export default function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
