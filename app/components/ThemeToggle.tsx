'use client';

import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`fixed bottom-6 right-6 z-[9999] px-4 py-2 font-bold uppercase text-xs transition-all shadow-xl
        ${theme === 'neo'
          ? 'bg-[#CEFF1A] text-black border-2 border-white shadow-[4px_4px_0px_0px_#fff] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none'
          : 'bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20'
        }`}
    >
      {theme === 'neo' ? '▣ NEO' : '◉ SLICK'}
    </button>
  );
}
