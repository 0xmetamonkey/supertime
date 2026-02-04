'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, X, MoreHorizontal } from 'lucide-react';

export default function InAppBrowserPrompt() {
  const [isInApp, setIsInApp] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<'instructions' | 'tip'>('instructions');

  useEffect(() => {
    const ua = window.navigator.userAgent || window.navigator.vendor;
    const isInstagram = ua.indexOf('Instagram') > -1;
    const isFacebook = (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1);

    if (isInstagram || isFacebook) {
      setIsInApp(true);

      // Phase Timer: Instructions (0-5s) -> Tip (5-8s) -> Close
      const tipTimer = setTimeout(() => setPhase('tip'), 5000);
      const closeTimer = setTimeout(() => setIsVisible(false), 8000);

      return () => {
        clearTimeout(tipTimer);
        clearTimeout(closeTimer);
      };
    }
  }, []);

  if (!isInApp || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pointer-events-none p-4 pt-20">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="w-full max-w-sm bg-neo-yellow border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 pointer-events-auto"
      >
        <div className="flex justify-between items-center mb-2">
          <div className="bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
            {phase === 'instructions' ? 'Browser optimization' : 'Pro Tip'}
          </div>
          <button onClick={() => setIsVisible(false)} className="text-black hover:scale-110 transition-transform">
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'instructions' ? (
            <motion.div
              key="instructions"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
            >
              <h3 className="text-lg font-black uppercase tracking-tighter mb-1 italic leading-none">
                Open in External Browser
              </h3>
              <p className="text-[10px] font-bold text-black/80 mb-3 uppercase leading-tight">
                Recommended for video calls & PWA installs.
              </p>
              <div className="flex items-center gap-2 bg-neo-blue text-white p-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <MoreHorizontal className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black uppercase leading-none">Tap (···) then "Open in Browser"</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tip"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
            >
              <h3 className="text-lg font-black uppercase tracking-tighter mb-1 italic leading-none">
                Add to Home Screen
              </h3>
              <p className="text-[10px] font-bold text-black/80 uppercase leading-tight">
                You can always add this app to your home screen from the Chrome menu for a cleaner experience!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
