'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ChatHeaderProps {
  recipientName: string;
  recipientImage?: string;
  isOnline?: boolean;
  onBack?: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  onDeleteChat?: () => void;
  isCallActive?: boolean;
}

export default function ChatHeader({ recipientName, recipientImage, isOnline, onBack, onAudioCall, onVideoCall, onDeleteChat, isCallActive }: ChatHeaderProps) {
  const initial = recipientName.charAt(0).toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface/80 backdrop-blur-xl shrink-0">
      {/* Left: Back + Avatar + Info */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-background transition-colors text-muted hover:text-foreground lg:hidden"
            aria-label="Back to messages"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface border border-border flex items-center justify-center shrink-0">
            {recipientImage ? (
              <img src={recipientImage} alt={recipientName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-semibold text-foreground text-sm">{initial}</span>
            )}
          </div>
          {/* Online indicator */}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-surface" />
          )}
        </div>

        {/* Name + status */}
        <div>
          <Link
            href={`/${recipientName}`}
            className="font-semibold text-foreground text-sm hover:underline transition-colors leading-tight block"
          >
            @{recipientName}
          </Link>
          <span className="text-xs text-muted leading-tight">
            {isCallActive ? 'In call...' : isOnline ? 'Online' : 'Direct Message'}
          </span>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAudioCall}
          disabled={isCallActive}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isCallActive
              ? 'text-muted/40 cursor-not-allowed'
              : 'text-muted hover:text-foreground hover:bg-background'
          }`}
          title="Audio Call"
          aria-label="Audio Call"
        >
          <Phone className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={onVideoCall}
          disabled={isCallActive}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isCallActive
              ? 'text-muted/40 cursor-not-allowed'
              : 'text-muted hover:text-foreground hover:bg-background'
          }`}
          title="Video Call"
          aria-label="Video Call"
        >
          <Video className="w-4.5 h-4.5" />
        </button>

        {/* More Options Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-colors"
            title="More Options"
            aria-label="More Options"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteChat?.();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4" />
                Delete Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
