'use client';

import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = "fixed bottom-6 right-6" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`${className} z-[9999] w-12 h-12 flex items-center justify-center bg-white dark:bg-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_theme(colors.neo-pink)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none overflow-hidden group`}
      aria-label="Toggle Theme"
    >
      <div className="relative w-6 h-6">
        <Sun className={`absolute inset-0 transition-transform duration-500 ${theme === 'dark' ? 'translate-y-10 rotate-90' : 'translate-y-0 rotate-0'} text-neo-yellow fill-neo-yellow`} />
        <Moon className={`absolute inset-0 transition-transform duration-500 ${theme === 'light' ? '-translate-y-10 -rotate-90' : 'translate-y-0 rotate-0'} text-neo-blue fill-neo-blue`} />
      </div>
    </button>
  );
}
