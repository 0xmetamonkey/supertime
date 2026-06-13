'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'zh-CN', label: '简体中文 (Chinese)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'pt', label: 'Português (Portuguese)' },
  { code: 'it', label: 'Italiano (Italian)' }
];

export default function GoogleTranslator() {
  const [currentLang, setCurrentLang] = useState('en');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // 1. Define the global initialization callback required by the Google Translate element
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          // Simple layout ensures minimal markup is injected
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    // 2. Track the active translation cookie set by Google (googtrans) to set initial select state
    const checkCookie = () => {
      const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
      if (match && match[1]) {
        setCurrentLang(match[1]);
      } else {
        setCurrentLang('en');
      }
    };

    checkCookie();
    const interval = setInterval(checkCookie, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const langCode = e.target.value;
    setCurrentLang(langCode);

    // Get the hidden native Google Translate selector element
    const googleSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (googleSelect) {
      googleSelect.value = langCode;
      // Dispatch a change event to trigger Google Translate's internal translation handler
      googleSelect.dispatchEvent(new Event('change'));
    } else {
      // Fallback: If element is not loaded yet, write cookie directly
      if (langCode === 'en') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      } else {
        document.cookie = `googtrans=/en/${langCode}; path=/;`;
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
      }
      window.location.reload();
    }
  };

  return (
    <>
      {/* Hidden container for Google Translate element */}
      <div id="google_translate_element" className="hidden" />

      {/* Global CSS overrides to hide standard Google Translate bar and highlights */}
      <style jsx global>{`
        /* Hide Google Translate top-bar/banner entirely */
        iframe.goog-te-banner-frame,
        .goog-te-banner-frame,
        .goog-te-banner {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        /* Hide translation highlight tooltips */
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
        }
        /* Disable text yellow highlighters when hovering translated sentences */
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
        }
        /* Hide original text tooltip popups */
        #goog-gt-tt {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>

      {/* Beautiful Custom-Styled Minimalist Dropdown Selector */}
      <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#111111] transition-colors cursor-pointer select-none">
        <Globe className="w-3.5 h-3.5 text-[#6B6B6B]" />
        <select
          value={currentLang}
          onChange={handleLangChange}
          className="bg-transparent border-none outline-none font-medium text-xs text-[#6B6B6B] hover:text-[#111111] transition-colors cursor-pointer pr-1 focus:ring-0 focus:ring-offset-0 focus:outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-[#F8F8F6] text-[#111111]">
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Load Google Translate Script asynchronously */}
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
    </>
  );
}
