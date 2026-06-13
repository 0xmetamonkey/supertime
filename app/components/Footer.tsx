'use client';

import React, { useState, useRef } from 'react';
import FeedbackWidget from './FeedbackWidget';
import { useLanguage, Language } from './LanguageContext';

export default function Footer() {
  const [clicks, setClicks] = useState(0);
  const [showDao, setShowDao] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { language, setLanguage, t } = useLanguage();

  return (
    <footer className="border-t border-border py-8 bg-surface text-foreground transition-colors duration-300 mt-24">
      <div className="w-full px-6 sm:px-8 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-muted">
        <div className="flex items-center gap-4">
          <span>© 2026 Supertime</span>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent border-none text-muted hover:text-foreground outline-none cursor-pointer uppercase text-xs font-semibold appearance-none"
          >
            <option value="en" className="bg-background text-foreground">English</option>
            <option value="hi" className="bg-background text-foreground">हिंदी</option>
            <option value="es" className="bg-background text-foreground">Español</option>
            <option value="fr" className="bg-background text-foreground">Français</option>
            <option value="te" className="bg-background text-foreground">తెలుగు</option>
            <option value="ta" className="bg-background text-foreground">தமிழ்</option>
          </select>
        </div>
        <div className="flex gap-6">
          <a href="/about" className="hover:text-foreground transition-colors">About</a>
          <a href="/roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <FeedbackWidget />
          <button 
            onClick={() => {
              const newClicks = clicks + 1;
              setClicks(newClicks);
              
              if (newClicks >= 4) {
                setShowDao(true);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
              }
              
              if (newClicks === 1) {
                timeoutRef.current = setTimeout(() => { 
                  window.location.href = '/terms'; 
                }, 1000);
              }
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
