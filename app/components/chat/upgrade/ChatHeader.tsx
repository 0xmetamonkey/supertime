'use client';

import React from 'react';
import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ChatHeaderProps {
  recipientName: string;
  recipientImage?: string;
  isOnline?: boolean;
  onBack?: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  isCallActive?: boolean;
}

export default function ChatHeader({ recipientName, recipientImage, isOnline, onBack, onAudioCall, onVideoCall, isCallActive }: ChatHeaderProps) {
  const initial = recipientName.charAt(0).toUpperCase();

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
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-colors"
          title="More Options"
          aria-label="More Options"
        >
          <MoreVertical className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}

