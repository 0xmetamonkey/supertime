'use client';
import { useState } from "react";
import { loginWithGoogle, checkAvailability } from "../actions";

export default function SetupPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setError('');
    setLoading(true);

    const isAvailable = await checkAvailability(username);
    if (!isAvailable) {
      setError('Taken. Try another?');
      setLoading(false);
      return;
    }

    // Since we are already logged in (presumably), 
    // loginWithGoogle will act as a "Bind this user to this name" action
    // because it redirects to /[username], which auto-claims for logged-in users.
    await loginWithGoogle(username);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Almost there!</h1>
      <p className="text-zinc-400 mb-8 max-w-sm">
        You've signed in successfully. Now, choose your unique Supertime handle.
      </p>

      <form onSubmit={handleClaim} className="w-full max-w-sm">
        <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-2 pl-4 mb-4">
          <span className="text-zinc-500 font-mono">supertime.wtf/</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="username"
            className="flex-1 bg-transparent border-none outline-none text-white font-bold h-12 ml-1"
            autoFocus
          />
        </div>

        {error && <div className="text-red-500 font-bold mb-4">{error}</div>}

        <button
          disabled={!username || loading}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Claiming...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}
