'use client';

import React, { useState } from 'react';
import { Play, Pause, Check, CheckCheck, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { TEAM_MEMBERS } from '../../../config';
import type { ChatMessage } from './useChatConnection';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  formatTime: (ts: number) => string;
}

/** Simulated SVG waveform for audio messages */
function AudioWaveform({ duration }: { duration?: number }) {
  const [playing, setPlaying] = useState(false);
  // Generate deterministic bar heights
  const bars = Array.from({ length: 32 }, (_, i) => {
    const h = 8 + Math.abs(Math.sin(i * 0.8) * 20) + Math.abs(Math.cos(i * 1.3) * 10);
    return Math.round(h);
  });

  return (
    <div className="flex items-center gap-3 py-2">
      <button
        onClick={() => setPlaying(!playing)}
        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex items-end gap-[2px] h-8 flex-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`waveform-bar ${playing ? 'playing' : ''}`}
            style={{
              height: `${h}px`,
              animationDelay: `${i * 0.04}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs opacity-60 shrink-0 tabular-nums">
        {duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : '0:42'}
      </span>
    </div>
  );
}

/** Structured data card grid */
function DataCardGrid({ cards }: { cards?: Array<{ label: string; value: string; icon?: string }> }) {
  const defaultCards = [
    { label: 'Daily Visitors', value: '2,429', icon: '👥' },
    { label: 'Building Age', value: '3Y', icon: '🏢' },
    { label: 'Temperature', value: '28°F', icon: '🌡' },
  ];
  const items = cards || defaultCards;

  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {items.map((card, i) => (
        <div
          key={i}
          className="bg-white/10 rounded-xl p-3 text-center"
        >
          <span className="text-lg block mb-1">{card.icon || '📊'}</span>
          <p className="text-lg font-bold leading-tight">{card.value}</p>
          <p className="text-[10px] opacity-60 mt-0.5 leading-tight">{card.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Photo gallery grid */
function PhotoGallery({ images }: { images?: string[] }) {
  const placeholders = images || [
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%234A5568" width="200" height="200"/><text x="100" y="108" text-anchor="middle" fill="%23A0AEC0" font-size="40">📷</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%232D3748" width="200" height="200"/><text x="100" y="108" text-anchor="middle" fill="%23A0AEC0" font-size="40">🌄</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%231A202C" width="200" height="200"/><text x="100" y="108" text-anchor="middle" fill="%23A0AEC0" font-size="40">🏠</text></svg>',
  ];
  const totalExtra = Math.max(0, placeholders.length - 3);
  const visible = placeholders.slice(0, 3);

  return (
    <div className="grid grid-cols-3 gap-1.5 mt-2 rounded-xl overflow-hidden">
      {visible.map((src, i) => (
        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
          <img src={src} alt="" className="w-full h-full object-cover" />
          {i === 2 && totalExtra > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{totalExtra}+</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Delivery status ticks */
function DeliveryTicks() {
  return (
    <span className="delivery-tick ml-1.5 inline-flex">
      <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
    </span>
  );
}

export default function MessageBubble({ message, isMe, formatTime }: MessageBubbleProps) {
  const msgType = message.type || 'text';

  // Parse mentions in text
  const renderText = (text: string) => {
    const mentionNames = TEAM_MEMBERS.map(m => m.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(@(?:${mentionNames.join('|')}))`, 'g');
    return text.split(regex).map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="font-semibold underline decoration-1 underline-offset-2 opacity-80">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 animate-fade-in`}>
      <div
        className={`max-w-[80%] sm:max-w-[65%] px-4 py-3 shadow-sm ${
          isMe ? 'bubble-outgoing' : 'bubble-incoming'
        }`}
      >
        {/* Sender name for incoming */}
        {!isMe && (
          <Link
            href={`/${message.from}`}
            className="font-semibold text-xs mb-1.5 block opacity-70 hover:opacity-100 hover:underline transition-opacity"
          >
            {message.from}
          </Link>
        )}

        {/* Text content */}
        {(msgType === 'text' || !msgType) && (
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {renderText(message.text)}
          </p>
        )}

        {/* Audio waveform */}
        {msgType === 'audio' && (
          <>
            <AudioWaveform duration={message.meta?.duration} />
            {message.text && (
              <p className="text-xs opacity-60 mt-1">{message.text}</p>
            )}
          </>
        )}

        {/* Structured data cards */}
        {msgType === 'card' && (
          <>
            {message.text && (
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap mb-2">
                {renderText(message.text)}
              </p>
            )}
            <DataCardGrid cards={message.meta?.cards} />
          </>
        )}

        {/* Photo gallery */}
        {msgType === 'gallery' && (
          <>
            {message.text && (
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap mb-2">
                {renderText(message.text)}
              </p>
            )}
            <PhotoGallery images={message.meta?.images} />
          </>
        )}

        {/* Timestamp + delivery ticks */}
        <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'justify-end' : ''}`}>
          <span className={`text-[10px] ${isMe ? 'opacity-50' : 'opacity-40'}`}>
            {formatTime(message.timestamp)}
          </span>
          {isMe && <DeliveryTicks />}
        </div>
      </div>
    </div>
  );
}
