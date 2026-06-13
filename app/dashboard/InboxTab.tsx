import React, { useEffect, useState } from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAlertDialog } from '../components/AlertDialog';

export default function InboxTab({ username }: { username: string }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const router = useRouter();
  const { alert: customAlert, AlertDialog } = useAlertDialog();

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
        customAlert({
          title: 'Notifications Enabled',
          message: 'Push notifications enabled successfully!',
          variant: 'success',
        });
      } else {
        customAlert({
          title: 'Permission Denied',
          message: 'Please allow notification permissions in your browser.',
          variant: 'warning',
        });
      }
    } catch (e) {
      console.error('Push setup failed', e);
      customAlert({
        title: 'Setup Failed',
        message: 'Failed to setup push notifications.',
        variant: 'error',
      });
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neo-pink/10 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-neo-pink" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Inbox</h2>
            <p className="text-sm text-muted">Manage your direct messages with fans</p>
          </div>
        </div>
        
        {!pushEnabled && (
          <button 
            onClick={enablePushNotifications}
            className="text-sm px-4 py-2 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Enable Push Notifications
          </button>
        )}
      </div>

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
              onClick={() => router.push(`/chat?to=${conv.with}`)}
              className="group flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-foreground/20 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface border border-border rounded-full flex items-center justify-center shrink-0">
                  <span className="font-semibold text-foreground uppercase">{conv.with.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">@{conv.with}</h4>
                  <p className="text-sm text-muted line-clamp-1 max-w-md mt-0.5">
                    <span className="font-medium text-foreground/80">{conv.from === conv.with ? '' : 'You: '}</span>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted">
                  {new Date(conv.timestamp).toLocaleDateString()}
                </span>
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors text-muted">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {AlertDialog}
    </div>
  );
}
