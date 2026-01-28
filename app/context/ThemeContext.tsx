'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'neo' | 'slick';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ... (imports remain)
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('neo'); // Server default
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('supertime-theme') as Theme;
    if (saved && (saved === 'neo' || saved === 'slick')) {
      setTheme(saved);
    }
    setMounted(true);
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('supertime-theme', newTheme);
  };

  const toggleTheme = () => {
    handleSetTheme(theme === 'neo' ? 'slick' : 'neo');
  };

  const contextValue = { theme, setTheme: handleSetTheme, toggleTheme };

  // Prevent hydration mismatch / flash of wrong theme
  // CRITICAL: Must still wrap in Provider because children (like LandingPageClient) use useTheme()
  if (!mounted) {
    return (
      <ThemeContext.Provider value={contextValue}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={theme === 'neo' ? 'theme-neo' : 'theme-slick'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
