'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Ably from 'ably';
import { TEAM_MEMBERS } from '../../../config';

export interface ChatMessage {
  id: string;
  from: string;
  fromEmail?: string;
  text: string;
  timestamp: number;
  /** Rich message type — defaults to 'text' */
  type?: 'text' | 'audio' | 'card' | 'gallery' | 'image';
  /** Optional metadata for rich messages */
  meta?: Record<string, any>;
  /** Optional delivery/read status */
  status?: 'sent' | 'delivered' | 'opened';
}

export interface ChatUser {
  id: string;
  username: string;
  email: string;
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

export function useChatConnection(user: ChatUser, recipient?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map());
  const [mentions, setMentions] = useState<{ show: boolean, query: string, index: number }>({ show: false, query: '', index: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
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
    // Reset state for new recipient
    setMessages([]);
    setLoading(true);
    setConnected(false);
    seenIdsRef.current = new Set();
    historyLoadedRef.current = false;

    // 1. Fetch history
    const loadHistory = async () => {
      try {
        const url = isDM
          ? `/api/chat?from=${encodeURIComponent(user.username)}&to=${encodeURIComponent(recipient!)}`
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
      authUrl: `/api/ably/token?clientId=${encodeURIComponent(clientId)}&t=${Date.now()}`,
      authMethod: 'GET',
    });

    const channel = client.channels.get(channelName);

    const updatePresenceStatus = () => {
      if (!recipient) return;
      channel.presence.get()
        .then((members) => {
          const isOnline = members.some(m => m.clientId?.toLowerCase() === recipient.toLowerCase());
          setRecipientOnline(isOnline);
        })
        .catch((err) => console.error('[Chat] Failed to get presence:', err));
    };

    const handleConnected = () => {
      setConnected(true);
      channel.presence.enter({ username: user.username }).then(() => {
        updatePresenceStatus();
        // Send a read receipt to let the sender know we are present
        channel.publish('read', { reader: user.username }).catch(() => {});
      }).catch(() => {});
    };

    if (client.connection.state === 'connected') {
      handleConnected();
    } else {
      client.connection.on('connected', handleConnected);
    }

    client.connection.on('disconnected', () => setConnected(false));
    client.connection.on('failed', () => setConnected(false));

    channel.subscribe('message', (message) => {
      const msg = message.data as ChatMessage;
      addMessage(msg);
      // Only play sound for messages from others (not own, not history)
      if (historyLoadedRef.current && msg.from !== user.username) {
        playSound('receive');
        // Let the sender know we read this message in real-time
        channel.publish('read', { reader: user.username, messageId: msg.id }).catch(() => {});
      }
    });

    // Listen for delivered events
    channel.subscribe('delivered', (message) => {
      const { messageId } = message.data;
      setMessages(prev => prev.map(m => {
        if (m.id === messageId && m.status === 'sent') {
          return { ...m, status: 'delivered' };
        }
        return m;
      }));
    });

    // Listen for read events
    channel.subscribe('read', (message) => {
      if (message.data?.reader?.toLowerCase() === recipient?.toLowerCase()) {
        setMessages(prev => prev.map(m => {
          if (m.from === user.username && m.status !== 'opened') {
            return { ...m, status: 'opened' };
          }
          return m;
        }));
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

    // Subscribe to all presence events (enter, leave, update, present) to keep status in sync
    channel.presence.subscribe(() => {
      updatePresenceStatus();
    });

    ablyRef.current = client;

    return () => {
      channel.presence.leave().catch(() => {});
      channel.unsubscribe();
      client.close();
    };
  }, [user.username, user.id, addMessage, channelName, isDM, recipient]);

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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const messageId = Math.random().toString(36).slice(2);
    const initialStatus = recipientOnline ? 'opened' : 'sent';
    const msg: ChatMessage = {
      id: messageId,
      from: user.username,
      fromEmail: user.email,
      text,
      timestamp: Date.now(),
      status: initialStatus,
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
          to: recipient, // Optional recipient for DMs
          status: initialStatus
        }),
      });
    } catch (e) {
      console.error('[Chat] Failed to send:', e);
    }
  }, [input, user, recipient, recipientOnline, addMessage]);

  const sendMediaMessage = useCallback(async (file: File) => {
    // 1. Upload file to /api/upload
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const fileUrl = data.url;

      const messageId = Math.random().toString(36).slice(2);
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const initialStatus = recipientOnline ? 'opened' : 'sent';

      const msg: ChatMessage = {
        id: messageId,
        from: user.username,
        fromEmail: user.email,
        text: isImage ? '' : file.name,
        timestamp: Date.now(),
        type: 'image',
        status: initialStatus,
        meta: {
          url: fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          isVideo,
        },
      };

      // Optimistic update
      addMessage(msg);
      playSound('send');

      // Persist via API
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: messageId,
          message: msg.text,
          from: user.username,
          fromEmail: user.email,
          to: recipient,
          type: 'image',
          meta: msg.meta,
          status: initialStatus
        }),
      });
    } catch (e) {
      console.error('[Chat] Failed to send media:', e);
    }
  }, [user, recipient, recipientOnline, addMessage]);

  const formatTime = useCallback((ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatDate = useCallback((ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, []);

  // Handle mention detection in input
  const handleInputChange = useCallback((val: string) => {
    setInput(val);
    publishTyping();

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
  }, [publishTyping]);

  const selectMention = useCallback((memberUsername: string) => {
    const before = input.slice(0, input.lastIndexOf('@'));
    setInput(before + '@' + memberUsername + ' ');
    setMentions({ show: false, query: '', index: 0 });
  }, [input]);

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

  return {
    messages,
    groupedMessages,
    input,
    setInput,
    connected,
    recipientOnline,
    loading,
    typingUsers,
    mentions,
    setMentions,
    bottomRef,
    isDM,
    addMessage,
    sendMessage,
    sendMediaMessage,
    publishTyping,
    formatTime,
    formatDate,
    handleInputChange,
    selectMention,
    TEAM_MEMBERS,
  };
}
