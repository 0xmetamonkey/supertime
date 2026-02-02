'use client';

import { useState, useEffect } from 'react';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch('/api/waitlist').then(r => r.json()).then(d => setCount(d.count || 0));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setCount(c => c + 1);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#CEFF1A]/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-5xl font-black italic tracking-tighter">
            Super<span className="text-[#CEFF1A]">Time</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">
            Monetize Your Time
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-[#CEFF1A]/10 border border-[#CEFF1A] rounded-2xl p-8 animate-in zoom-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black mb-2">You're In!</h2>
            <p className="text-zinc-400">We'll notify you when we launch.</p>
            <p className="text-[#CEFF1A] font-bold mt-4">{count} early adopters</p>
          </div>
        ) : (
          <>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-8 mb-6">
              <h2 className="text-2xl font-black mb-2">Join the Waitlist</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Be first to monetize your time with paid video calls.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#CEFF1A] transition-colors"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#CEFF1A] transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[#CEFF1A] text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 uppercase tracking-wide"
                >
                  {status === 'loading' ? 'Joining...' : 'Get Early Access'}
                </button>
              </form>

              {status === 'error' && (
                <p className="text-red-500 text-sm mt-4">Something went wrong. Try again.</p>
              )}
            </div>

            {count > 0 && (
              <p className="text-zinc-500 text-sm">
                <span className="text-[#CEFF1A] font-bold">{count}</span> people already joined
              </p>
            )}
          </>
        )}

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-xs text-zinc-500 uppercase">Earn per minute</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">🎥</div>
            <p className="text-xs text-zinc-500 uppercase">Video & Audio</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-xs text-zinc-500 uppercase">Instant Payouts</p>
          </div>
        </div>
      </div>
    </main>
  );
}
