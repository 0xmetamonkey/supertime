'use client';

import { useEffect, useRef, useState } from 'react';
import Ably from 'ably';
import { useRouter, usePathname } from 'next/navigation';
import { MessageSquare, X, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function GlobalChatListener({ username }: { username: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const [popups, setPopups] = useState<any[]>([]);

  // 1. Explicit Service Worker Registration for Phone/Background Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((reg) => {
          console.log('[Service Worker] Scope:', reg.scope);
        })
        .catch((err) => {
          console.error('[Service Worker] Registration failed:', err);
        });
    }
  }, []);

  // 2. Ably Real-time Message Listener & Native Notifications
  useEffect(() => {
    if (!username) return;

    const client = new Ably.Realtime({
      authUrl: `/api/ably/token?clientId=${encodeURIComponent(username)}&t=${Date.now()}`,
      authMethod: 'GET',
    });

    const channel = client.channels.get(`user:${username.toLowerCase()}`);
    
    channel.subscribe('notification', (message) => {
      const data = message.data;
      
      // If we are already on the chat page with this person, don't show toast
      const searchParams = new URLSearchParams(window.location.search);
      const to = searchParams.get('to');
      const tab = searchParams.get('tab');
      const isViewingChat = (pathname === '/chat') || (pathname === '/dashboard' && tab === 'inbox');
      if (isViewingChat && to?.toLowerCase() === data.from.toLowerCase()) {
        return;
      }
      
      if (data.type === 'ping' && data.from !== username) {
        const popupId = data.id || Math.random().toString(36);
        setPopups(prev => [...prev, { ...data, id: popupId, isPing: true }]);

        // Native notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            const systemNotif = new Notification(`⚡ Ping from @${data.from}!`, {
              body: `${data.from} requested a ${data.pingType?.toUpperCase() || ''} session (${data.duration || 15}m): "${data.message || ''}"`,
              icon: '/icon.png',
              tag: `ping:${data.from}`,
            });
            systemNotif.onclick = () => {
              window.focus();
              router.push(`/dashboard?tab=inbox&to=${data.from}`);
              systemNotif.close();
            };
          }
        }

        setTimeout(() => {
          setPopups(prev => prev.filter(p => p.id !== popupId));
        }, 6000);

        // Ping sound (higher pitch double-ping)
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.35);
        } catch {}
      }

      if (data.type === 'dm' && data.from !== username) {
        // Send delivered receipt back to sender
        try {
          const dmParticipants = [username.toLowerCase(), data.from.toLowerCase()].sort();
          const dmChannel = client.channels.get(`dm:${dmParticipants.join(':')}`);
          dmChannel.publish('delivered', { messageId: data.id }).catch(() => {});
        } catch (err) {
          console.error('[GlobalChatListener] Delivered receipt publish failed:', err);
        }

        // Show custom popup
        const popupId = data.id || Math.random().toString(36);
        setPopups(prev => [...prev, { ...data, id: popupId }]);

        // Signal unread chat to sidebar
        window.dispatchEvent(new CustomEvent('supertime:unread-chat', { detail: { from: data.from } }));

        // Trigger native desktop system notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            const systemNotif = new Notification(`New message from @${data.from}`, {
              body: data.text,
              icon: '/icon.png',
              tag: `chat-dm:${data.from}`,
            });
            systemNotif.onclick = () => {
              window.focus();
              router.push(`/dashboard?tab=inbox&to=${data.from}`);
              systemNotif.close();
            };
          }
        }
        
        setTimeout(() => {
          setPopups(prev => prev.filter(p => p.id !== popupId));
        }, 3000);
        
        // Play sound
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const fontGain = ctx.createGain();
          osc.connect(fontGain);
          fontGain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
          fontGain.gain.setValueAtTime(0.15, ctx.currentTime);
          fontGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
        } catch {}
      }
    });

    ablyRef.current = client;

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, [username, pathname, router]);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {popups.map(popup => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            onClick={() => {
              setPopups(prev => prev.filter(p => p.id !== popup.id));
              router.push(`/dashboard?tab=inbox&to=${popup.from}`);
            }}
            className={`border shadow-2xl rounded-2xl p-4 flex items-start gap-3 w-84 cursor-pointer hover:opacity-95 transition-all ring-1 pointer-events-auto ${
              popup.isPing
                ? 'bg-amber-50 dark:bg-zinc-900 border-amber-400 ring-amber-400/20'
                : 'bg-surface border-border ring-black/5 hover:bg-background'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              popup.isPing ? 'bg-amber-400 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-blue-500/10 text-blue-500'
            }`}>
              {popup.isPing ? <Zap className="w-5 h-5 fill-black" /> : <MessageSquare className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0 mt-0.5">
              <div className="flex items-center justify-between gap-1">
                <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  @{popup.from}
                  {popup.isPing && (
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black text-amber-300">
                      {popup.pingType} sesh
                    </span>
                  )}
                </p>
              </div>
              <p className="text-xs text-muted mt-1 leading-snug line-clamp-2">
                {popup.isPing ? (popup.message || `Pinged for a ${popup.duration || 15}m session`) : popup.text}
              </p>
              {popup.isPing && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2.5 py-1 rounded-md">
                    Open Chat & Respond
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
