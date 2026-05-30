'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border py-4 bg-background/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div className="w-full px-6 sm:px-8 md:px-12 flex justify-between items-center">
        <span className="text-lg font-bold tracking-tight cursor-pointer" onClick={() => router.push('/')}>
          supertime
        </span>

        <div className="flex items-center gap-6">
          <nav className="hidden sm:flex items-center gap-6">
            <a href="/explore" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
              Explore
            </a>
            <a href="/about" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
              About
            </a>
            <a href="/roadmap" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
              Roadmap
            </a>
          </nav>

          <button
            onClick={() => {
              if (isSignedIn) router.push('/dashboard');
              else router.push('/sign-in?forceRedirectUrl=/dashboard');
            }}
            className="border border-border text-foreground hover:bg-foreground hover:text-background px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
          >
            {isSignedIn ? 'Dashboard' : 'Sign in'}
          </button>

          {/* Header Sun/Moon Toggle in the end top corner */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
