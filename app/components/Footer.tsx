'use client';

import React from 'react';

export default function Footer() {

  return (
    <footer className="border-t border-border py-8 bg-surface text-foreground transition-colors duration-300 mt-24">
      <div className="w-full px-6 sm:px-8 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-muted">
        <span>© 2026 Supertime</span>
        <div className="flex gap-6">
          <a href="/about" className="hover:text-foreground transition-colors">About</a>
          <a href="/roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}
