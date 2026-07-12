import React, { useEffect, useState } from 'react';
import { MessageSquare, ArrowRight, CheckCircle, AlertCircle, Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function formatMessageDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (compareDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

export default function InboxTab({
  username,
  onSelectChat,
  unreadFrom,
  setUnreadFrom,
}: {
  username: string;
  onSelectChat?: (chatUser: string) => void;
  unreadFrom: Set<string>;
  setUnreadFrom: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  });
  const router = useRouter();

  useEffect(() => {
    // Check if push is already permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
      }
    }

    fetch(`/api/chat/inbox?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => {
        if (data.conversations) {
          setConversations(data.conversations);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  const showModal = (title: string, description: string, type: 'success' | 'error' | 'info') => {
    setModal({ isOpen: true, title, description, type });
  };

  const enablePushNotifications = async () => {
    try {
      const { requestForToken } = await import('../lib/firebase');
      const token = await requestForToken();
      if (token) {
        await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, username })
        });
        setPushEnabled(true);
        showModal(
          'Notifications Enabled',
          'You will now receive instant push notifications when fans message you.',
          'success'
        );
      } else {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            setPushEnabled(true);
            showModal(
              'Notifications Enabled',
              'Notifications have been allowed in your browser successfully.',
              'success'
            );
          } else {
            showModal(
              'Permission Required',
              'Please allow notification permissions in your browser settings to receive messages.',
              'info'
            );
          }
        } else {
          showModal(
            'Not Supported',
            'Push notifications are not supported on this browser/device.',
            'info'
          );
        }
      }
    } catch (e) {
      console.error('Push setup failed', e);
      showModal(
        'Setup Failed',
        'We encountered an error setting up push notifications. Please try again.',
        'error'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
      {!pushEnabled && (
        <div className="mb-6 flex justify-end">
          <button 
            onClick={enablePushNotifications}
            className="text-sm px-4 py-2 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Enable Push Notifications
          </button>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <MessageSquare className="w-8 h-8 text-muted mx-auto mb-3" />
          <h3 className="font-medium text-foreground">No messages yet</h3>
          <p className="text-sm text-muted">When fans message you, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv, i) => (
            <div 
              key={i} 
              onClick={() => {
                // Clear unread state for this conversation
                setUnreadFrom(prev => {
                  const next = new Set(prev);
                  next.delete(conv.with.toLowerCase());
                  return next;
                });
                onSelectChat ? onSelectChat(conv.with) : router.push(`/dashboard?tab=inbox&to=${conv.with}`);
              }}
              className={`group flex items-center justify-between p-4 bg-background border rounded-xl hover:border-foreground/20 cursor-pointer transition-all ${
                unreadFrom.has(conv.with.toLowerCase())
                  ? 'border-neo-pink/30 bg-neo-pink/[0.03]'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-surface border border-border rounded-full overflow-hidden flex items-center justify-center shrink-0">
                    {conv.profileImage ? (
                      <img src={conv.profileImage} alt={conv.with} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold text-foreground uppercase">{conv.with.charAt(0)}</span>
                    )}
                  </div>
                  {unreadFrom.has(conv.with.toLowerCase()) && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neo-pink opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-neo-pink border-2 border-background" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className={`text-foreground ${unreadFrom.has(conv.with.toLowerCase()) ? 'font-semibold' : 'font-medium'}`}>@{conv.with}</h4>
                  <p className={`text-sm line-clamp-1 max-w-md mt-0.5 ${unreadFrom.has(conv.with.toLowerCase()) ? 'text-foreground/70 font-medium' : 'text-muted'}`}>
                    <span className="font-medium text-foreground/80">{conv.from === conv.with ? '' : 'You: '}</span>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs ${unreadFrom.has(conv.with.toLowerCase()) ? 'text-neo-pink font-semibold' : 'text-muted'}`}>
                  {formatMessageDate(conv.timestamp)}
                </span>
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors text-muted">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Modal */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            {/* Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative max-w-sm w-full bg-surface border border-border rounded-2xl p-6 shadow-xl z-10 flex flex-col items-center text-center"
            >
              {/* Close Button */}
              <button 
                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-background transition-colors text-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                modal.type === 'success' ? 'bg-green-500/10 text-green-500' :
                modal.type === 'error' ? 'bg-red-500/10 text-red-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                {modal.type === 'success' && <CheckCircle className="w-6 h-6" />}
                {modal.type === 'error' && <AlertCircle className="w-6 h-6" />}
                {modal.type === 'info' && <Bell className="w-6 h-6" />}
              </div>

              {/* Text */}
              <h3 className="text-lg font-semibold text-foreground mb-1">{modal.title}</h3>
              <p className="text-sm text-muted mb-6 leading-relaxed">{modal.description}</p>

              {/* Action Button */}
              <button 
                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 bg-foreground text-background font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
