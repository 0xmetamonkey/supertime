'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, X, MoreHorizontal } from 'lucide-react';

export default function InAppBrowserPrompt() {
  const [isInApp, setIsInApp] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const ua = window.navigator.userAgent || window.navigator.vendor;
    const isInstagram = ua.indexOf('Instagram') > -1;
    const isFacebook = (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1);

    if (isInstagram || isFacebook) {
      setIsInApp(true);
    }
  }, []);

  if (!isInApp || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none p-6 pb-24 md:pb-6">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-neo-yellow border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 pointer-events-auto"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            Browser optimization
          </div>
          <button onClick={() => setIsVisible(false)} className="text-black hover:scale-110 transition-transform">
            <X className="w-6 h-6" />
          </button>
        </div>

        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">
          Open in External Browser
        </h3>

        <p className="text-sm font-bold text-black/80 mb-6 uppercase leading-tight">
          In-app browsers (Instagram/Facebook) often block video calls & PWA installs. For full experience:
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white/40 p-3 border-2 border-black border-dashed">
            <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0">
              <MoreHorizontal className="text-white w-6 h-6" />
            </div>
            <span className="text-xs font-black uppercase">1. Tap the three dots (···)</span>
          </div>

          <div className="flex items-center gap-4 bg-neo-blue text-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ExternalLink className="w-6 h-6 shrink-0" />
            <span className="text-sm font-black uppercase">2. Select "Open in Browser"</span>
          </div>
        </div>

        <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
          Required for Video & Token Settlements
        </p>
      </motion.div>
    </div>
  );
}
