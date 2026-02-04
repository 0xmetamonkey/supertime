'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9998] pointer-events-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, x: 20 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        className="bg-black text-white border-4 border-white shadow-[8px_8px_0px_0px_theme(colors.neo-pink)] p-4 max-w-[200px] pointer-events-auto relative group"
      >
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute -top-3 -right-3 w-6 h-6 bg-neo-pink text-white rounded-full border-2 border-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>

        <p className="text-[10px] font-black uppercase tracking-widest mb-3 leading-tight">
          Install for better experience
        </p>

        <button
          onClick={handleInstallClick}
          className="w-full bg-neo-green text-black font-black py-2 text-xs flex items-center justify-center gap-2 hover:bg-neo-green/90 transition-colors uppercase"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      </motion.div>
    </div>
  );
}
