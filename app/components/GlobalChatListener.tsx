'use client';

import { useEffect, useRef, useState } from 'react';
import Ably from 'ably';
import { useRouter, usePathname } from 'next/navigation';
import { MessageSquare, X } from 'lucide-react';
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
            className="bg-surface border border-border shadow-2xl rounded-2xl p-4 flex items-start gap-3 w-80 cursor-pointer hover:bg-background transition-colors ring-1 ring-black/5 pointer-events-auto"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0 mt-0.5">
              <p className="font-semibold text-sm text-foreground">
                @{popup.from}
              </p>
              <p className="text-sm text-muted mt-0.5 truncate">
                {popup.text}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
