'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Send, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import Ably from 'ably';
import { UserButton } from "@clerk/nextjs";
import { TEAM_MEMBERS } from '../config';

interface ChatMessage {
  id: string;
  from: string;
  fromEmail?: string;
  text: string;
  timestamp: number;
}

// Web Audio API sound effects — no files needed
function playSound(type: 'receive' | 'send') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'receive') {
      // Rising two-tone pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else {
      // Quick soft whoosh
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch { } // Silently fail if AudioContext unavailable
}

export default function ChatClient({ user, recipient }: { user: { id: string; username: string; email: string }, recipient?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map());
  const [mentions, setMentions] = useState<{ show: boolean, query: string, index: number }>({ show: false, query: '', index: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingPublishRef = useRef<number>(0);
  const historyLoadedRef = useRef(false);

  const isDM = !!recipient;
  const channelName = isDM
    ? `dm:${[user.username.toLowerCase(), recipient.toLowerCase()].sort().join(':')}`
    : 'team:supertime';

  const addMessage = useCallback((msg: ChatMessage) => {
    if (seenIdsRef.current.has(msg.id)) return;
    seenIdsRef.current.add(msg.id);
    setMessages(prev => [...prev, msg].sort((a, b) => a.timestamp - b.timestamp));
  }, []);

  // Load history + connect Ably
  useEffect(() => {
    // 1. Fetch history
    const loadHistory = async () => {
      try {
        const url = isDM
          ? `/api/chat?from=${encodeURIComponent(user.username)}&to=${encodeURIComponent(recipient)}`
          : '/api/chat';
        const res = await fetch(url);
        const data = await res.json();
        if (data.messages) {
          data.messages.forEach((m: ChatMessage) => {
            seenIdsRef.current.add(m.id);
          });
          setMessages(data.messages.sort((a: ChatMessage, b: ChatMessage) => a.timestamp - b.timestamp));
        }
      } catch (e) {
        console.error('[Chat] Failed to load history:', e);
      }
      setLoading(false);
      historyLoadedRef.current = true;
    };
    loadHistory();

    // 2. Connect Ably
    const clientId = user.username || user.id;
    const client = new Ably.Realtime({
      authUrl: `/api/ably/token?clientId=${encodeURIComponent(clientId)}`,
      authMethod: 'GET',
    });

    client.connection.on('connected', () => setConnected(true));
    client.connection.on('disconnected', () => setConnected(false));
    client.connection.on('failed', () => setConnected(false));

    const channel = client.channels.get(channelName);
    channel.subscribe('message', (message) => {
      const msg = message.data as ChatMessage;
      addMessage(msg);
      // Only play sound for messages from others (not own, not history)
      if (historyLoadedRef.current && msg.from !== user.username) {
        playSound('receive');
      }
    });

    // Listen for typing events
    channel.subscribe('typing', (message) => {
      const typer = message.data?.from;
      if (!typer || typer === user.username) return;
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.set(typer, Date.now());
        return next;
      });
    });

    ablyRef.current = client;

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, [user, addMessage, channelName, isDM, recipient]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear stale typing indicators every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now();
        const next = new Map(prev);
        let changed = false;
        for (const [name, ts] of next) {
          if (now - ts > 3000) { next.delete(name); changed = true; }
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Publish typing event (debounced)
  const publishTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingPublishRef.current < 500) return;
    lastTypingPublishRef.current = now;

    const client = ablyRef.current;
    if (!client) return;
    const channel = client.channels.get(channelName);
    channel.publish('typing', { from: user.username }).catch(() => { });
  }, [user.username, channelName]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const messageId = Math.random().toString(36).slice(2);
    const msg: ChatMessage = {
      id: messageId,
      from: user.username,
      fromEmail: user.email,
      text,
      timestamp: Date.now(),
    };

    // Optimistic update
    addMessage(msg);
    setInput('');
    playSound('send');

    // Persist via API (which also publishes to Ably server-side)
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: messageId,
          message: text,
          from: user.username,
          fromEmail: user.email,
          to: recipient // Optional recipient for DMs
        }),
      });
    } catch (e) {
      console.error('[Chat] Failed to send:', e);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const date = formatDate(msg.timestamp);
    if (date !== currentDate) {
      currentDate = date;
      groupedMessages.push({ date, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  return (
    <div className="h-screen h-[100dvh] bg-background text-foreground font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="z-50 bg-surface/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-background transition-colors text-muted hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-neo-pink/10 rounded-full flex items-center justify-center">
            <Zap className="text-neo-pink w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-lg leading-none">
              {recipient ? `@${recipient}` : 'Team Chat'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted">
                {recipient ? 'Direct Message' : 'Supertime HQ'}
              </span>
              <div className="h-1 w-1 rounded-full bg-border" />
              <span className="text-xs text-muted">
                @{user.username}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {connected ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium text-xs text-green-600 dark:text-green-400">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 rounded-full">
                <WifiOff className="w-3 h-3 text-red-500" />
                <span className="font-medium text-xs text-red-600 dark:text-red-400">Offline</span>
              </div>
            )}
          </div>
          <div className="bg-surface rounded-full">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-muted border-t-neo-pink rounded-full animate-spin mx-auto mb-4" />
              <p className="font-medium text-muted text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-neo-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-neo-blue" />
              </div>
              <h2 className="font-semibold text-foreground text-2xl mb-2">Fresh start!</h2>
              <p className="text-muted text-sm">
                {recipient
                  ? `Say hi to @${recipient}! No one else can see this chat.`
                  : "Send the first message to your team. Messages persist for 7 days."}
              </p>
            </div>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-6 mt-4">
                <div className="flex-1 h-px bg-border" />
                <span className="font-medium text-xs text-muted px-2">{group.date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                {group.messages.map((msg) => {
                  const isMe = msg.from === user.username;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] sm:max-w-[60%] ${isMe
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-surface border border-border text-foreground rounded-2xl rounded-tl-sm'
                        } px-4 py-3 shadow-sm`}>
                        {!isMe && (
                          <p className="font-semibold text-xs text-neo-pink mb-1">{msg.from}</p>
                        )}
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {(() => {
                            const mentionNames = TEAM_MEMBERS.map(m => m.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                            const regex = new RegExp(`(@(?:${mentionNames.join('|')}))`, 'g');
                            return msg.text.split(regex).map((part, i) =>
                              part.startsWith('@') ? (
                                <span key={i} className={`${isMe ? 'text-blue-200' : 'text-blue-500'} font-semibold underline decoration-1 underline-offset-2`}>
                                  {part}
                                </span>
                              ) : part
                            );
                          })()}
                        </p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-muted'}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="px-6 py-2 bg-background border-t border-border">
          <p className="font-medium text-xs text-muted animate-pulse">
            {Array.from(typingUsers.keys()).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-background border-t border-border p-4 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-stretch gap-3 relative"
        >
          {mentions.show && (
            <div className="absolute bottom-full left-4 bg-surface border border-border rounded-xl mb-2 w-64 shadow-xl z-[100] max-h-48 overflow-y-auto overflow-hidden">
              <div className="p-2 border-b border-border bg-background">
                <span className="text-xs font-semibold text-muted">Mention Team Member</span>
              </div>
              {TEAM_MEMBERS
                .filter(m => m.username.toLowerCase().includes(mentions.query.toLowerCase()))
                .map((member, i) => (
                  <button
                    key={member.username}
                    type="button"
                    onClick={() => {
                      const before = input.slice(0, input.lastIndexOf('@'));
                      setInput(before + '@' + member.username + ' ');
                      setMentions({ show: false, query: '', index: 0 });
                    }}
                    className={`w-full text-left px-4 py-2.5 font-medium text-sm flex items-center gap-3 hover:bg-background transition-colors ${i === mentions.index ? 'bg-background' : ''}`}
                  >
                    <div className="w-6 h-6 bg-neo-pink/10 rounded-full flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3 text-neo-pink fill-current" />
                    </div>
                    <span className="text-foreground">@{member.username}</span>
                  </button>
                ))
              }
            </div>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => {
              const val = e.target.value;
              setInput(val);
              publishTyping();

              // Mention detection
              const lastAt = val.lastIndexOf('@');
              if (lastAt !== -1) {
                const query = val.slice(lastAt + 1);
                const hasMatch = TEAM_MEMBERS.some(m => 
                  m.username.toLowerCase().startsWith(query.toLowerCase())
                );
                if (hasMatch) {
                  setMentions({ show: true, query, index: 0 });
                } else {
                  setMentions({ show: false, query: '', index: 0 });
                }
              } else {
                setMentions({ show: false, query: '', index: 0 });
              }
            }}
            onKeyDown={(e) => {
              if (mentions.show) {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setMentions(prev => ({ ...prev, index: Math.max(0, prev.index - 1) }));
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setMentions(prev => ({ ...prev, index: prev.index + 1 }));
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  const filtered = TEAM_MEMBERS.filter(m => m.username.toLowerCase().includes(mentions.query.toLowerCase()));
                  const member = filtered[mentions.index % filtered.length];
                  if (member) {
                    const before = input.slice(0, input.lastIndexOf('@'));
                    setInput(before + '@' + member.username + ' ');
                  }
                  setMentions({ show: false, query: '', index: 0 });
                } else if (e.key === 'Escape') {
                  setMentions({ show: false, query: '', index: 0 });
                }
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 font-medium text-foreground placeholder:text-muted outline-none focus:border-foreground transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-foreground text-background rounded-xl px-6 font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
