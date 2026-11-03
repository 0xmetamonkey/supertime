'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Edit2
} from 'lucide-react';
import QRCode from 'qrcode';

interface CreatorQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  profileImage?: string;
  creatorId?: string;
}

type QRColorTheme = {
  id: string;
  name: string;
  dark: string;
  light: string;
  accent: string;
};

const THEMES: QRColorTheme[] = [
  { id: 'classic', name: 'Classic Dark', dark: '#0a0a0a', light: '#ffffff', accent: 'bg-zinc-900 text-white' },
  { id: 'violet', name: 'Neon Violet', dark: '#6366f1', light: '#ffffff', accent: 'bg-indigo-600 text-white' },
  { id: 'emerald', name: 'Cyber Emerald', dark: '#059669', light: '#ffffff', accent: 'bg-emerald-600 text-white' },
  { id: 'rose', name: 'Sunset Rose', dark: '#e11d48', light: '#ffffff', accent: 'bg-rose-600 text-white' },
];

export default function CreatorQRCodeModal({
  isOpen,
  onClose,
  username: initialUsername,
  displayName: initialDisplayName,
  profileImage,
  creatorId
}: CreatorQRCodeModalProps) {
  const [activeUsername, setActiveUsername] = useState(initialUsername || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsernameInput, setTempUsernameInput] = useState(initialUsername || '');
  const [selectedTheme, setSelectedTheme] = useState<QRColorTheme>(THEMES[0]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync initialUsername prop
  useEffect(() => {
    if (initialUsername) {
      setActiveUsername(initialUsername);
      setTempUsernameInput(initialUsername);
    }
  }, [initialUsername]);

  // Compute profile URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://supertime.wtf';
  const cleanUsername = (activeUsername || 'creator').replace(/^@+/, '').trim().toLowerCase();
  const profileUrl = `${baseUrl}/${cleanUsername}`;
  const displayTitle = initialDisplayName || cleanUsername;
  const userTag = `@${cleanUsername}`;

  // Generate QR code data URL whenever username or theme changes
  useEffect(() => {
    if (!isOpen || !cleanUsername) return;

    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(profileUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: selectedTheme.dark,
        light: selectedTheme.light,
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, cleanUsername, profileUrl, selectedTheme]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Custom Username Submission
  const handleSaveCustomUsername = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitized = tempUsernameInput.replace(/^@+/, '').trim().toLowerCase();
    if (sanitized) {
      setActiveUsername(sanitized);
    }
    setIsEditingUsername(false);
  };

  // Copy Profile URL
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Download QR Code PNG directly
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `${cleanUsername}-qr-code.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate and Download Full Branded Creator ID Card
  const handleDownloadBrandedCard = async () => {
    if (!qrDataUrl) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#09090b');
    bgGradient.addColorStop(1, '#18181b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Inner Card Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Header badge
    ctx.fillStyle = selectedTheme.dark === '#0a0a0a' ? '#ffffff' : selectedTheme.dark;
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SUPERTIME CREATOR ID', width / 2, 90);

    // Subtitle
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Scan to connect and explore creative universe', width / 2, 120);

    // QR Code Container Box
    const qrBoxSize = 440;
    const qrBoxX = (width - qrBoxSize) / 2;
    const qrBoxY = 160;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
    ctx.fill();

    // Draw QR image
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = qrDataUrl;

    await new Promise((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrBoxX + 20, qrBoxY + 20, qrBoxSize - 40, qrBoxSize - 40);
        resolve(null);
      };
    });

    // Center Supertime logo badge
    const badgeSize = 56;
    const badgeX = width / 2 - badgeSize / 2;
    const badgeY = qrBoxY + qrBoxSize / 2 - badgeSize / 2;

    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', width / 2, qrBoxY + qrBoxSize / 2);

    // Reset baseline
    ctx.textBaseline = 'alphabetic';

    // Creator Information
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(displayTitle, width / 2, 670);

    ctx.fillStyle = '#71717a';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillText(userTag, width / 2, 715);

    // Verified / Creator ID Pill
    if (creatorId) {
      ctx.fillStyle = '#27272a';
      const idText = `CREATOR ID: ${creatorId.slice(0, 16)}`;
      ctx.beginPath();
      ctx.roundRect(width / 2 - 140, 745, 280, 36, 18);
      ctx.fill();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '14px monospace';
      ctx.fillText(idText, width / 2, 768);
    }

    // Bottom link
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(`supertime.wtf/${cleanUsername}`, width / 2, 850);

    // Footer
    ctx.fillStyle = '#52525b';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('Monetize your existence, and make art.', width / 2, 920);

    // Download Canvas
    const link = document.createElement('a');
    link.download = `${cleanUsername}-creator-pass.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Native share if supported
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayTitle} on Supertime`,
          text: `Check out ${displayTitle}'s profile on Supertime`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-surface border border-border text-foreground rounded-3xl shadow-2xl overflow-hidden z-10 my-8"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-foreground/5 border border-border flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg leading-tight">Creator ID & QR Code</h3>
                  <p className="text-xs text-muted">Scan to open creator profile directly</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full hover:bg-foreground/5 text-muted hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              {/* Branded ID Preview Card */}
              <div
                ref={cardRef}
                className="relative rounded-2xl p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-xl overflow-hidden flex flex-col items-center text-center"
              >
                {/* Decorative glow */}
                <div
                  className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: selectedTheme.dark === '#0a0a0a' ? '#6366f1' : selectedTheme.dark }}
                />

                {/* Card Tag */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-semibold tracking-wider uppercase text-zinc-300 mb-4">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Supertime Creator Pass
                </div>

                {/* Creator Avatar & Info */}
                <div className="flex items-center gap-3 mb-4">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={displayTitle}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-bold text-lg flex items-center justify-center border-2 border-white/20 shadow-md">
                      {cleanUsername.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <h4 className="font-bold text-base text-white leading-snug">{displayTitle}</h4>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-zinc-400">{userTag}</p>
                      <button
                        onClick={() => setIsEditingUsername(!isEditingUsername)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Change ID / Handle"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Custom Handle Input */}
                <AnimatePresence>
                  {isEditingUsername && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleSaveCustomUsername}
                      className="w-full flex items-center gap-2 mb-4 overflow-hidden"
                    >
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">@</span>
                        <input
                          type="text"
                          value={tempUsernameInput}
                          onChange={(e) => setTempUsernameInput(e.target.value)}
                          placeholder="creator_handle"
                          className="w-full bg-zinc-800 border border-zinc-700 pl-7 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-white text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
                      >
                        Set
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* The QR Code Render with Center Watermark */}
                <div className="relative p-3.5 bg-white rounded-2xl shadow-lg border border-zinc-200">
                  {isGenerating || !qrDataUrl ? (
                    <div className="w-52 h-52 flex flex-col items-center justify-center text-zinc-400 gap-2">
                      <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Generating QR...</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={qrDataUrl}
                        alt={`QR code for ${displayTitle}`}
                        className="w-52 h-52 rounded-lg"
                      />
                      {/* Centered S watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
                          S
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Link Display */}
                <p className="mt-4 text-xs font-mono text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg max-w-full truncate">
                  supertime.wtf/{cleanUsername}
                </p>
              </div>

              {/* Theme Customizer */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <Palette className="w-3.5 h-3.5" />
                  QR Color Accent
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((theme) => {
                    const isSelected = selectedTheme.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedTheme(theme)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-foreground bg-foreground/5 text-foreground shadow-sm'
                            : 'border-border text-muted hover:border-foreground/40 hover:text-foreground'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: theme.dark === '#0a0a0a' ? '#18181b' : theme.dark }}
                        />
                        <span className="truncate">{theme.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleDownloadBrandedCard}
                    disabled={isGenerating || !qrDataUrl}
                    className="w-full bg-foreground text-background font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Pass
                  </button>

                  <button
                    onClick={handleDownloadQR}
                    disabled={isGenerating || !qrDataUrl}
                    className="w-full bg-surface border border-border font-semibold text-foreground py-3 px-4 rounded-xl hover:bg-foreground/5 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    QR Image Only
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-3 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Profile Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="w-full py-2.5 px-3 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
