/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Menu, X, QrCode } from 'lucide-react';
import CreatorQRCodeModal from './CreatorQRCodeModal';

export default function Header() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { theme, setTheme } = useTheme();

  // true = mobile menu is open, false = closed
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null);

  // Check if current user is logged in as a creator or artist (not fan)
  useEffect(() => {
    if (!isSignedIn) {
      setIsCreator(false);
      setCreatorUsername(null);
      return;
    }
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => {
        if (data.isCreator) {
          setIsCreator(true);
          setCreatorUsername(data.username);
        } else {
          setIsCreator(false);
        }
      })
      .catch(() => setIsCreator(false));
  }, [isSignedIn]);

  const navItems = [
     { label: 'Creators', href: '/'  },
    { label: 'Find Creators', href: '/explore' },
   
    
    { label: 'About', href: '/about' },
    { label: 'Roadmap', href: '/roadmap' },
  ];

  // Small helper: go to a page and close the mobile menu
  const goTo = (url: string) => {
    setMenuOpen(false);
    router.push(url);
  };

  return (
    <header className="border-b border-border py-4 bg-background/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div className="w-full px-6 sm:px-8 md:px-12 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => goTo('/')}>
          <span className="text-lg font-bold tracking-tight">supertime</span>
          <span className="text-[9px] font-bold uppercase tracking-widest bg-foreground text-background px-1.5 py-0.5 rounded-full shadow-sm">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">

          {/* WEB: nav links (hidden on phone) */}
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

          {/* WEB: auth buttons (hidden on phone) */}
          <div className="hidden sm:flex items-center gap-3 sm:ml-4">
            {!isSignedIn ? (
              <>
                <button
                  onClick={() => router.push('/sign-in?forceRedirectUrl=/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-gray-200/80 dark:hover:bg-zinc-800/80 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  Sign in
                </button>
                <button
                  onClick={() => router.push('/sign-up?forceRedirectUrl=/dashboard')}
                  className="bg-foreground text-background hover:opacity-90 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  Sign up
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/dashboard')}
                className="border border-border text-foreground hover:bg-foreground hover:text-background px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                Dashboard
              </button>
            )}
          </div>

          {/* QR Code generator trigger: ONLY for logged-in creator/artist accounts */}
          {isSignedIn && isCreator && (
            <button
              onClick={() => setQrModalOpen(true)}
              className="p-2 rounded-full hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0 cursor-pointer"
              aria-label="Generate Creator QR Code"
              title="Generate Creator QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}

          {/* Theme toggle (web + mobile) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* MOBILE: menu button (hidden on web) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 rounded-full hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE: dropdown menu (only when menuOpen is true, hidden on web) */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border mt-4 px-6 pt-3 flex flex-col gap-1">

          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-muted hover:text-foreground hover:bg-gray-200/80 dark:hover:bg-zinc-800/80 rounded-lg transition-all duration-200"
            >
              {item.label}
            </a>
          ))}

          {isSignedIn && isCreator && (
            <button
              onClick={() => { setMenuOpen(false); setQrModalOpen(true); }}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-muted hover:text-foreground hover:bg-gray-200/80 dark:hover:bg-zinc-800/80 rounded-lg transition-all duration-200 cursor-pointer text-left"
            >
              <QrCode className="w-4 h-4" />
              <span>Generate QR Code</span>
            </button>
          )}

          <div className="flex gap-3 pt-3 pb-1">
            {!isSignedIn ? (
              <>
                <button
                  onClick={() => goTo('/sign-in?forceRedirectUrl=/dashboard')}
                  className="flex-1 border border-border text-foreground px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  onClick={() => goTo('/sign-up?forceRedirectUrl=/dashboard')}
                  className="flex-1 bg-foreground text-background px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
                >
                  Sign up
                </button>
              </>
            ) : (
              <button
                onClick={() => goTo('/dashboard')}
                className="flex-1 border border-border text-foreground px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      )}

      {/* Creator QR Code Modal: ONLY for logged-in creator/artist accounts */}
      {isSignedIn && isCreator && (
        <CreatorQRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          username={creatorUsername || user?.username || ''}
          displayName={user?.fullName || user?.firstName || creatorUsername || ''}
          profileImage={user?.imageUrl}
          creatorId={user?.id}
        />
      )}
    </header>
  );
}