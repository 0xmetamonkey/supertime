'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: 'Explore', href: '/explore' },
    { label: 'About', href: '/about' },
    { label: 'Roadmap', href: '/roadmap' },
  ];

  return (
    <header className="border-b border-border py-4 bg-background/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div className="w-full px-6 sm:px-8 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => router.push('/')}>
          <span className="text-lg font-bold tracking-tight">
            supertime
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest bg-foreground text-background px-1.5 py-0.5 rounded-full shadow-sm">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-gray-200/80 dark:hover:bg-zinc-800/80 rounded-full transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {!isSignedIn ? (
            <div className="flex items-center gap-1 sm:gap-3 sm:ml-4">
              <button
                onClick={() => router.push('/sign-in?forceRedirectUrl=/dashboard')}
                className="px-2 sm:px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-gray-200/80 dark:hover:bg-zinc-800/80 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/sign-up?forceRedirectUrl=/setup')}
                className="bg-foreground text-background hover:opacity-90 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                Sign up
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              className="border border-border text-foreground hover:bg-foreground hover:text-background px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              Dashboard
            </button>
          )}

          {/* Header Sun/Moon Toggle in the end top corner */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0 ml-1 sm:ml-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
