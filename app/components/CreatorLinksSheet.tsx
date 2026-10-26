'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Globe,
  Instagram,
  Youtube,
  Music,
  ArrowUpRight,
  Sparkles,
  Link2,
  MessageCircle,
  Video
} from 'lucide-react';

export interface CreatorLinksSheetProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  profileImage?: string;
  isVerified?: boolean;
  socials?: Record<string, any>;
  bio?: string;
  onStartCall?: (type: 'video' | 'audio') => void;
}

interface SocialLinkItem {
  id: string;
  label: string;
  handleOrUrl: string;
  fullUrl: string;
  icon: React.ReactNode;
  category: 'social' | 'music' | 'web' | 'profile';
  badge?: string;
}

export default function CreatorLinksSheet({
  isOpen,
  onClose,
  username,
  profileImage,
  isVerified = false,
  socials = {},
  bio,
  onStartCall,
}: CreatorLinksSheetProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedProfile, setCopiedProfile] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Construct canonical profile URL
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${username}`
    : `https://supertime.wtf/${username}`;

  // Parse and build list of active artist links
  const links: SocialLinkItem[] = [];

  if (socials?.instagram) {
    const raw = String(socials.instagram).trim();
    const handle = raw.startsWith('http')
      ? raw.split('/').filter(Boolean).pop() || raw
      : raw.replace('@', '');
    const url = raw.startsWith('http') ? raw : `https://instagram.com/${handle}`;
    links.push({
      id: 'instagram',
      label: 'Instagram',
      handleOrUrl: `@${handle}`,
      fullUrl: url,
      icon: <Instagram className="w-4 h-4 text-pink-500" />,
      category: 'social',
    });
  }

  if (socials?.x) {
    const raw = String(socials.x).trim();
    const handle = raw.startsWith('http')
      ? raw.split('/').filter(Boolean).pop() || raw
      : raw.replace('@', '');
    const url = raw.startsWith('http') ? raw : `https://x.com/${handle}`;
    links.push({
      id: 'x',
      label: 'X (Twitter)',
      handleOrUrl: `@${handle}`,
      fullUrl: url,
      icon: <span className="font-serif text-sm font-bold text-foreground">𝕏</span>,
      category: 'social',
    });
  }

  if (socials?.youtube) {
    const raw = String(socials.youtube).trim();
    const handle = raw.startsWith('http')
      ? raw.split('/').filter(Boolean).pop() || raw
      : raw.replace('@', '');
    const url = raw.startsWith('http') ? raw : `https://youtube.com/${handle.startsWith('@') ? handle : `@${handle}`}`;
    links.push({
      id: 'youtube',
      label: 'YouTube',
      handleOrUrl: handle.startsWith('@') ? handle : `@${handle}`,
      fullUrl: url,
      icon: <Youtube className="w-4 h-4 text-red-500" />,
      category: 'social',
    });
  }

  if (socials?.website) {
    const raw = String(socials.website).trim();
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    const display = raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
    links.push({
      id: 'website',
      label: 'Official Website',
      handleOrUrl: display,
      fullUrl: url,
      icon: <Globe className="w-4 h-4 text-blue-500" />,
      category: 'web',
    });
  }

  if (socials?.spotify) {
    const raw = String(socials.spotify).trim();
    const url = raw.startsWith('http') ? raw : `https://open.spotify.com/artist/${raw}`;
    links.push({
      id: 'spotify',
      label: 'Spotify',
      handleOrUrl: 'Listen to tracks',
      fullUrl: url,
      icon: <Music className="w-4 h-4 text-emerald-500" />,
      category: 'music',
      badge: 'Music',
    });
  }

  if (socials?.soundcloud) {
    const raw = String(socials.soundcloud).trim();
    const url = raw.startsWith('http') ? raw : `https://soundcloud.com/${raw}`;
    links.push({
      id: 'soundcloud',
      label: 'SoundCloud',
      handleOrUrl: 'Stream on SoundCloud',
      fullUrl: url,
      icon: <Music className="w-4 h-4 text-orange-500" />,
      category: 'music',
    });
  }

  // Handle custom links if present in socials (e.g. socials.customLinks)
  if (Array.isArray(socials?.customLinks)) {
    socials.customLinks.forEach((custom: any, idx: number) => {
      if (custom?.url) {
        const url = custom.url.startsWith('http') ? custom.url : `https://${custom.url}`;
        links.push({
          id: `custom-${idx}`,
          label: custom.title || 'Featured Link',
          handleOrUrl: custom.url.replace(/^https?:\/\//, ''),
          fullUrl: url,
          icon: <ArrowUpRight className="w-4 h-4 text-foreground/70" />,
          category: 'web',
        });
      }
    });
  }

  const handleCopy = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopiedProfile(true);
      setTimeout(() => setCopiedProfile(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username} on Supertime`,
          text: bio || `Check out ${username}'s links and live sessions on Supertime.`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyProfile();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Frosted Translucent Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md transition-opacity"
            aria-hidden="true"
          />

          {/* Bottom Sheet Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.95 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className="relative w-full max-w-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-2xl border-t sm:border border-border/80 dark:border-white/10 rounded-t-[28px] sm:rounded-3xl shadow-[0_-12px_48px_rgba(0,0,0,0.12)] overflow-hidden z-10 max-h-[85vh] flex flex-col"
          >
            {/* Material Drag Handle Bar */}
            <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.2 rounded-full bg-foreground/20 hover:bg-foreground/30 transition-colors" />
            </div>

            {/* Header: Clean Flat Header with Artist Info */}
            <div className="px-6 pt-2 pb-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface border border-border/80 shadow-xs shrink-0">
                  {profileImage ? (
                    <img src={profileImage} alt={username} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`}
                      alt={username}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-semibold text-foreground tracking-tight">
                      @{username}
                    </h2>
                    {isVerified && (
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-foreground text-background rounded-full text-[9px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">All Links & Channels</p>
                </div>
              </div>

              {/* Close Button - Apple Style Translucent Circle */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 text-muted hover:text-foreground flex items-center justify-center transition-colors border border-border/40"
                aria-label="Close links drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Links Content */}
            <div className="px-6 py-5 overflow-y-auto space-y-4 no-scrollbar">
              {/* Primary Supertime Profile Link Card (Flat Surface with Subtle Translucency) */}
              <div className="bg-surface border border-border/80 dark:border-white/10 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold tracking-wider uppercase text-muted">
                      Official Supertime Presence
                    </span>
                  </div>
                  <span className="text-[11px] text-muted font-mono truncate max-w-[140px]">
                    /{username}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyProfile}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {copiedProfile ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Link</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Profile Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-xl border border-border/80 hover:bg-foreground/5 text-foreground transition-all flex items-center justify-center active:scale-[0.98]"
                    title="Share Profile"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Artist Channels & Social Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Connected Networks ({links.length})
                  </h3>
                </div>

                {links.length === 0 ? (
                  <div className="bg-surface/50 border border-dashed border-border/80 rounded-2xl p-6 text-center">
                    <Link2 className="w-6 h-6 text-muted/60 mx-auto mb-2" />
                    <p className="text-xs font-medium text-foreground">No extra social links listed yet</p>
                    <p className="text-[11px] text-muted mt-1">
                      You can connect with @{username} directly through Supertime.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {links.map((item) => (
                      <motion.div
                        key={item.id}
                        whileTap={{ scale: 0.99 }}
                        className="bg-surface border border-border/70 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between hover:border-foreground/30 hover:bg-foreground/[0.01] transition-all group"
                      >
                        <a
                          href={item.fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 min-w-0 flex-1 pr-3"
                        >
                          <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] dark:bg-white/[0.06] border border-border/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {item.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted truncate">{item.handleOrUrl}</p>
                          </div>
                        </a>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopy(item.id, item.fullUrl)}
                            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors"
                            title={`Copy ${item.label} link`}
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={item.fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors"
                            title={`Open ${item.label}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Call / Booking Quick Action (Optional action shortcut) */}
              {onStartCall && (
                <div className="pt-2">
                  <div className="bg-gradient-to-r from-foreground/[0.03] to-foreground/[0.01] border border-border/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Want direct 1:1 access?
                      </h4>
                      <p className="text-[11px] text-muted">Connect live with @{username} on Supertime</p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onStartCall('video');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Book Call</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Flat Clean Sheet Footer */}
            <div className="px-6 py-3.5 border-t border-border/50 bg-surface/70 backdrop-blur-md flex items-center justify-between text-[11px] text-muted pb-[max(env(safe-area-inset-bottom,0px),12px)]">
              <span>Verified Supertime Creator</span>
              <button
                onClick={onClose}
                className="font-medium text-foreground hover:underline cursor-pointer px-2 py-0.5"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
