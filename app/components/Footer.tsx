'use client';

import React, { useState } from 'react';
import FeedbackWidget from './FeedbackWidget';

export default function Footer() {
  const [clicks, setClicks] = useState(0);
  const [showDao, setShowDao] = useState(false);

  return (
    <footer className="border-t border-border py-8 bg-surface text-foreground transition-colors duration-300 mt-24">
      <div className="w-full px-6 sm:px-8 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-muted">
        <span>© 2026 Supertime</span>
        <div className="flex gap-6">
          <a href="/about" className="hover:text-foreground transition-colors">About</a>
          <a href="/roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <FeedbackWidget />
          <button 
            onClick={() => {
              setClicks(c => c + 1);
              if (clicks + 1 >= 10) setShowDao(true);
              if (clicks === 0) setTimeout(() => { if (clicks < 9) window.location.href = '/terms'; }, 1000);
            }}
            className="hover:text-foreground transition-colors"
          >
            Terms
          </button>
        </div>
      </div>
      
      {showDao && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowDao(false)}>
          <div className="text-center space-y-6 max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-24 h-24 mx-auto border-4 border-dashed border-white/20 rounded-full animate-[spin_10s_linear_infinite] flex items-center justify-center">
              <span className="text-4xl">🏴‍☠️</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-widest uppercase glow-effect">The Supertime DAO</h2>
            <p className="text-white/70 font-mono text-sm leading-relaxed">
              We are a decentralized collective of creators, builders, and believers.<br/>
              The roadmap is written by the community. The assets belong to the creators.<br/>
              Soon, $TIME will not just be spent; it will be owned.
            </p>
            <button onClick={() => setShowDao(false)} className="mt-8 px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
              Return to Reality
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
