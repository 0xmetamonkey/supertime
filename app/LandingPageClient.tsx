'use client';

import React, { useState } from 'react';
import { useTheme } from './context/ThemeContext';
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

    try {
      const isAvailable = await checkAvailability(username);
      if (!isAvailable) {
        setError('Username taken. Try another?');
        setLoading(false);
        return;
      }

      if (isLoggedIn) {
        await claimUsername(username);
        window.location.href = '/studio';
      } else {
        await loginWithGoogle(username);
      }
    } catch (e: any) {
      console.error("Claim Hub Error:", e);
      setError(e.message || "Failed to process request. Try again.");
      setLoading(false);
    }
  };

  const { theme } = useTheme();

  // --------------------------------------------------------------------------
  // SLICK THEME (Glassmorphism)
  // --------------------------------------------------------------------------
  if (theme === 'slick') {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

        {/* Top Nav */}
        <nav className="absolute top-0 right-0 p-6 z-20">
          <button
            onClick={() => loginWithGoogle('/')}
            className="text-zinc-400 font-bold text-sm hover:text-white transition-colors"
          >
            Log In
          </button>
        </nav>

        <div className="max-w-md w-full text-center z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Supertime
          </h1>
          <p className="text-zinc-400 text-lg mb-2">
            Get paid for video & audio calls.
          </p>
          <p className="text-zinc-500 text-sm mb-10">
            Claim your link. Share it. Start earning.
          </p>

          <div>
            <form onSubmit={handleSubmit} className="w-full relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative flex items-center bg-zinc-900 border border-zinc-700 rounded-2xl p-2 pl-4">
                <span className="text-zinc-500 font-mono text-sm">supertime.wtf/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="yourname"
                  className="flex-1 bg-transparent border-none outline-none text-white font-bold h-12 ml-1 min-w-0"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!username || loading}
                  className="bg-white text-black font-bold rounded-xl px-6 h-12 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Claim →'}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mt-3 font-bold">{error}</p>}
            </form>
            <p className="text-zinc-600 text-[10px] mt-6 uppercase">
              Claiming will sign you in with Google
            </p>
          </div>

          <div className="mt-16 text-zinc-600 text-xs uppercase tracking-widest">
            <p>Set rate • Go live • Get paid</p>
          </div>

          {/* SYSTEM STATUS (DEBUG BYPASS) */}
          {isLoggedIn && (
            <div className="mt-12 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl w-full font-mono text-left">
              <p className="text-[10px] text-zinc-500 uppercase mb-2 animate-pulse">Session Diagnostic (Logged In)</p>
              <div className="space-y-2 text-[10px] text-zinc-400">
                <div className="bg-black p-2 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-600">Email:</span>
                  <span className="text-white truncate max-w-[150px]">{session?.user?.email}</span>
                </div>
                <div className="bg-black p-2 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-600">Username:</span>
                  <span className="text-white">{savedUsername || 'NOT_FOUND'}</span>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/studio'}
                className="w-full mt-4 bg-white text-black font-black py-2 uppercase text-[10px] hover:bg-zinc-200 transition-colors"
              >
                Go to Studio & Go Live →
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // NEO THEME (Default)
  // --------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono">
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      {/* Top Nav */}
      <nav className="absolute top-0 right-0 p-6 z-20">
        <button
          onClick={() => loginWithGoogle('/')}
          className="text-white font-bold text-sm uppercase border-2 border-transparent hover:border-white px-4 py-2 transition-all"
        >
          [ Log In ]
        </button>
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
      </div>

      {/* SYSTEM STATUS (DEBUG) */}
      {isLoggedIn && (
        <div className="mt-12 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl max-w-md w-full z-10 font-mono">
          <p className="text-[10px] text-zinc-500 uppercase mb-2 animate-pulse">Session Diagnostic (Logged In)</p>
          <div className="space-y-2 text-[10px] text-zinc-400">
            <div className="bg-black p-2 rounded border border-zinc-800 flex justify-between">
              <span className="text-zinc-600">Email:</span>
              <span className="text-white truncate max-w-[150px]">{session?.user?.email}</span>
            </div>
            <div className="bg-black p-2 rounded border border-zinc-800 flex justify-between">
              <span className="text-zinc-600">Username:</span>
              <span className="text-white">{savedUsername || 'NULL'}</span>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/studio'}
            className="w-full mt-4 bg-white text-black font-black py-2 uppercase text-[10px] hover:bg-zinc-200 transition-colors"
          >
            Go to Studio & Go Live →
          </button>
        </div>
      )}
    </main>
  );
}
