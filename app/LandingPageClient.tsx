'use client';

import React, { useState } from 'react';
import { loginWithGoogle, checkAvailability } from './actions';

export default function LandingPageClient({ session, savedUsername }: { session: any, savedUsername: string | null }) {
  const [username, setUsername] = useState('');
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

    await loginWithGoogle(username);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

      {/* Top Nav - Login for returning users */}
      <nav className="absolute top-0 right-0 p-6 z-20">
        {!isLoggedIn && (
          <button
            onClick={() => loginWithGoogle('/')}
            className="text-zinc-400 font-bold text-sm hover:text-white transition-colors"
          >
            Already have an account? Log In
          </button>
        )}
        {isLoggedIn && savedUsername && (
          <button
            onClick={() => window.location.href = '/studio'}
            className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full hover:bg-zinc-200 transition-colors"
          >
            Enter Studio →
          </button>
        )}
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

        {/* Show different UI based on login state */}
        {isLoggedIn && savedUsername ? (
          // Logged in WITH username -> Go to studio
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <p className="text-zinc-400 mb-4">Welcome back, <span className="text-white font-bold">{savedUsername}</span>!</p>
            <button
              onClick={() => window.location.href = '/studio'}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Enter Studio
            </button>
          </div>
        ) : isLoggedIn && !savedUsername ? (
          // Logged in WITHOUT username -> Admirer View
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">My Account</h2>
              <p className="text-zinc-400 mb-6">Manage your credits and transactions.</p>
              <button
                onClick={() => window.location.href = '/wallet'}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Open Wallet
              </button>
              <button
                onClick={() => import('./actions').then(mod => mod.logout())}
                className="mt-4 text-zinc-500 text-xs font-bold hover:text-white"
              >
                Sign Out
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
              <div className="relative flex justify-center"><span className="px-2 bg-black text-zinc-500 text-xs">OR BECOME A CREATOR</span></div>
            </div>

            <form onSubmit={handleSubmit} className="w-full relative group opacity-75 hover:opacity-100 transition-opacity">
              <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-2 pl-4">
                <span className="text-zinc-500 font-mono text-sm">supertime.wtf/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="claim-username"
                  className="flex-1 bg-transparent border-none outline-none text-white font-bold h-12 ml-1 min-w-0"
                />
                <button
                  type="submit"
                  disabled={!username || loading}
                  className="bg-zinc-800 text-white font-bold rounded-xl px-4 h-12 hover:bg-zinc-700 transition-colors disabled:opacity-50 text-xs"
                >
                  {loading ? '...' : 'Claim'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // NOT logged in -> Show claim form (will trigger login)
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
            <p className="text-zinc-600 text-xs mt-6">
              Claiming will sign you in with Google
            </p>
          </div>
        )}

        <div className="mt-16 text-zinc-600 text-xs">
          <p>Set your rate • Go live • Get paid per minute</p>
        </div>
      </div>
    </main>
  );
}
