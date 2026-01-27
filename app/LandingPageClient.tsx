'use client';

import React, { useState } from 'react';
import { loginWithGoogle, checkAvailability, claimUsername } from './actions';
import { useRouter } from 'next/navigation';

export default function LandingPageClient({ session, savedUsername }: { session: any, savedUsername: string | null }) {
  const router = useRouter();
  const [username, setUsername] = useState('');

  // Toggle State: 'creator' (Studio access) or 'admirer' (Wallet/Fan view)
  const [viewMode, setViewMode] = useState<'creator' | 'admirer'>(savedUsername ? 'creator' : 'admirer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLoggedIn = !!session?.user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setError('');
    setLoading(true);

    const isAvailable = await checkAvailability(username);
    if (!isAvailable) {
      setError('Username taken. Try another?');
      setLoading(false);
      return;
    }

    if (isLoggedIn) {
      try {
        await claimUsername(username);
        // Force refresh to update session/data state but router.push is usually enough if we revalidate path
        // For safety on first claim, acceptable to hard reload OR push to studio
        window.location.href = '/studio';
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    } else {
      await loginWithGoogle(username);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono">
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      {/* Top Nav */}
      <nav className="absolute top-0 right-0 p-6 z-20">
        {!isLoggedIn && (
          <button
            onClick={() => loginWithGoogle('/')}
            className="text-white font-bold text-sm uppercase border-2 border-transparent hover:border-white px-4 py-2 transition-all"
          >
            [ Log In ]
          </button>
        )}
        {isLoggedIn && savedUsername && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode(viewMode === 'creator' ? 'admirer' : 'creator')}
              className="text-zinc-400 font-bold text-xs uppercase hover:text-white transition-colors underline decoration-2 underline-offset-4"
            >
              {viewMode === 'creator' ? 'Switch to Fan' : 'Switch to Creator'}
            </button>
            {viewMode === 'creator' && (
              <button
                onClick={() => router.push('/studio')}
                className="bg-[#CEFF1A] text-black font-black text-sm px-6 py-3 border-2 border-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_#fff] transition-all uppercase"
              >
                Enter Studio
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="max-w-md w-full text-center z-10">
        <div className="border-4 border-white bg-black p-8 shadow-[8px_8px_0px_0px_#CEFF1A] mb-12">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2 uppercase leading-none">
            Super
            <span className="text-transparent bg-clip-text bg-white stroke-white" style={{ WebkitTextStroke: '2px white' }}>Time</span>
          </h1>
          <div className="h-1 w-full bg-[#CEFF1A] mb-4"></div>
          <p className="text-white text-lg font-bold uppercase tracking-widest mb-2">
            Time is Money.
          </p>
          <p className="text-zinc-500 text-xs font-mono">
            // Monetize your video & audio calls instantly.
          </p>
        </div>

        {/* Show different UI based on login state and View Mode */}
        {isLoggedIn ? (
          <>
            {/* CREATOR VIEW */}
            {savedUsername && viewMode === 'creator' ? (
              <div className="bg-zinc-900 border-2 border-white p-6 shadow-[6px_6px_0px_0px_#fff]">
                <p className="text-black bg-white inline-block px-2 py-1 font-bold text-xs mb-4 uppercase">Logged In</p>
                <div className="text-2xl font-black text-white mb-6 uppercase">
                  Welcome Back, <span className="text-[#CEFF1A]">{savedUsername}</span>
                </div>
                <button
                  onClick={() => router.push('/studio')}
                  className="w-full bg-[#CEFF1A] text-black font-black text-xl py-4 border-2 border-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_#fff] transition-all uppercase"
                >
                  Enter Studio
                </button>
              </div>
            ) : (
              // ADMIRER VIEW
              <div className="space-y-12">
                {/* 1. MAIN WALLET SECTION */}
                <div className="bg-zinc-900 border-2 border-white p-6 shadow-[6px_6px_0px_0px_#fff] text-left relative">
                  <div className="absolute top-0 right-0 bg-white text-black text-[10px] font-black px-2 py-1 uppercase">
                    Fan Account
                  </div>
                  <div className="flex justify-between items-start mb-6 mt-4">
                    <h2 className="text-3xl font-black text-white uppercase italic">Wallet</h2>
                    <div className="w-4 h-4 bg-[#CEFF1A]"></div>
                  </div>

                  <button
                    onClick={() => router.push('/wallet')}
                    className="w-full bg-white text-black font-black text-lg py-4 border-2 border-black hover:bg-zinc-200 transition-colors uppercase mb-4 flex items-center justify-center gap-2"
                  >
                    Open Wallet →
                  </button>
                  <button
                    onClick={() => import('./actions').then(mod => mod.logout())}
                    className="w-full text-zinc-500 text-xs font-bold uppercase hover:text-white hover:underline text-center"
                  >
                    [ Sign Out ]
                  </button>
                </div>

                {/* 2. CREATOR UPSELL SECTION (Distinct Block) */}
                {!savedUsername && (
                  <div className="p-6 border-2 border-[#CEFF1A] bg-black relative">
                    <div className="absolute -top-3 left-6 px-2 bg-black text-[#CEFF1A] font-black text-xs uppercase border border-[#CEFF1A]">
                      Want to Earn?
                    </div>
                    <p className="text-zinc-400 text-xs font-mono mb-4">
                      Create your own SuperTime link to accept paid calls.
                    </p>

                    {/* Claim Form */}
                    <form onSubmit={handleSubmit} className="w-full group">
                      <div className="flex items-center bg-black border-2 border-zinc-700 p-2 focus-within:border-white transition-all">
                        <span className="text-zinc-600 font-mono text-sm px-2">supertime.wtf/</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="USERNAME"
                          className="flex-1 bg-transparent border-none outline-none text-white font-bold text-lg placeholder:text-zinc-800 uppercase"
                        />
                        <button
                          type="submit"
                          disabled={!username || loading}
                          className="bg-zinc-800 text-white font-bold px-4 py-2 hover:bg-white hover:text-black disabled:opacity-50 text-xs uppercase transition-colors"
                        >
                          {loading ? 'WAIT' : 'CLAIM'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // NOT LOGGED IN
          <div>
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex items-center bg-black border-2 border-white p-2 shadow-[6px_6px_0px_0px_#CEFF1A] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#CEFF1A]">
                <span className="text-zinc-500 font-mono text-sm px-2">supertime.wtf/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="YOURNAME"
                  className="flex-1 bg-transparent border-none outline-none text-white font-black text-xl placeholder:text-zinc-700 uppercase"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!username || loading}
                  className="bg-white text-black font-black px-6 py-3 border-2 border-black hover:bg-zinc-200 disabled:opacity-50 uppercase text-sm"
                >
                  {loading ? '...' : 'CLAIM IT'}
                </button>
              </div>
              {error && <div className="mt-4 bg-red-600 text-white font-bold p-2 text-xs uppercase border-2 border-white shadow-[4px_4px_0px_0px_#fff]">Error: {error}</div>}
            </form>
            <p className="text-zinc-600 text-[10px] mt-8 font-mono uppercase tracking-widest">
              * By claiming, you agree to sign in with Google.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
