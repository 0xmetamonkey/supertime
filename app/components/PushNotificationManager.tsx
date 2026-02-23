'use client';

import { useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '@/app/lib/firebase';

interface PushNotificationManagerProps {
  userId?: string | null;
}

export function PushNotificationManager({ userId }: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<string>('default');
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const saveTokenToServer = async (token: string) => {
    console.log('[Push] 📡 Saving token to backend...');
    try {
      const response = await fetch('/api/user/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        console.log('[Push] ✨ Token saved successfully');
      } else {
        console.error('[Push] ❌ Backend failed to save token:', response.status);
      }
    } catch (err) {
      console.error('[Push] ❌ Error saving token:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPerm = Notification.permission;
      console.log('[Push] Initial permission check:', currentPerm);
      setPermission(currentPerm);

      // Proactive refresh: if already granted, ensure token is saved in latest KV format
      if (currentPerm === 'granted') {
        console.log('[Push] 🔄 Permission already granted, refreshing token...');
        requestForToken().then(token => {
          if (token) saveTokenToServer(token);
        });
      }
    } else {
      console.log('[Push] Notifications not supported in this browser');
    }
  }, []);

  const requestPermission = async () => {
    console.log('[Push] 🔔 requestPermission triggered');

    if (!('Notification' in window)) {
      console.error('[Push] ❌ Notification API not found in window');
      return;
    }

    console.log('[Push] 🔍 Browser permission state BEFORE prompt:', Notification.permission);

    if (Notification.permission === 'denied') {
      console.warn('[Push] ⚠️ Permission already DENIED. The browser will NOT show a prompt. User must reset site permissions manually.');
    }

    try {
      const result = await Notification.requestPermission();
      console.log('[Push] ✅ Browser prompt result:', result);
      setPermission(result);

      if (result === 'granted') {
        if (!userId) {
          console.error('[Push] ❌ Token skip: userId is missing!', { userId });
          return;
        }

        console.log('[Push] 🚀 Requesting FCM token for user:', userId);
        const token = await requestForToken();

        if (token) {
          console.log('[Push] 📥 Token successfully retrieved:', token);
          await saveTokenToServer(token);
        } else {
          console.warn('[Push] ⚠️ No token returned from requestForToken (check VAPID key/Firebase config)');
        }
      }
    } catch (err) {
      console.error('[Push] ❌ Exception in requestPermission flow:', err);
    }
  };

  useEffect(() => {
    if (permission === 'granted') {
      onMessageListener().then((payload: any) => {
        console.log('Foreground message received:', payload);
        // We handle foreground ringing via a separate component or global state
        // For now, let's just toast it
        if (payload.notification) {
          // toast(payload.notification.title || 'Incoming Call');
        }
      }).catch(err => console.log('failed: ', err));
    }
  }, [permission]);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const sendTestPush = async () => {
    if (!userId) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/debug/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        setTestResult('✅ Push sent! Check your phone.');
      } else {
        setTestResult(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Request failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const isDebugMode = typeof window !== 'undefined' && window.location.search.includes('debug_push=true');

  if (mounted) {
    console.log('[Push] Render visibility check:', { permission, isDismissed, isDebugMode, userId });
  }

  if (!mounted) return null;
  if (permission === 'granted' && !isDebugMode) return null;
  if (isDismissed && !isDebugMode) return null;

  return (
    <>
      {/* Diagnostic Overlay */}
      {isDebugMode && (
        <div className="fixed bottom-20 left-4 z-[99999] bg-black text-white p-4 border-2 border-neo-yellow text-[10px] font-mono shadow-[4px_4px_0_0_#DFFF1B]">
          <p className="font-bold border-b border-white/20 mb-2 pb-1">PUSH DIAGNOSTICS</p>
          <p>User: <span className="text-neo-yellow">{userId || 'Not Logged In'}</span></p>
          <p>Perm: <span className={permission === 'denied' ? 'text-red-500 font-black' : 'text-green-400'}>{permission.toUpperCase()}</span></p>
          <p>Mounted: {mounted ? 'YES' : 'NO'}</p>
          <div className="mt-2 pt-2 border-t border-white/20">
            <button
              onClick={sendTestPush}
              disabled={isTesting || !userId}
              className="bg-neo-yellow text-black px-2 py-1 font-black active:scale-95 disabled:opacity-50"
            >
              {isTesting ? 'SENDING...' : 'FORCE TEST PUSH'}
            </button>
            {testResult && <p className="mt-1 leading-tight">{testResult}</p>}
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top duration-500 pointer-events-auto">
        <div className="bg-neo-yellow border-b-4 border-black px-4 py-3 md:py-4 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
          <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="min-w-0 pr-2">
                <h3 className="text-[10px] md:text-sm font-black uppercase italic tracking-tighter leading-none mb-1">
                  {permission === 'denied' ? 'Notifications Blocked' : 'Missed Calls = Missed TKN'}
                </h3>
                <p className="text-[8px] md:text-[10px] font-bold text-black/60 uppercase tracking-wide leading-tight">
                  {permission === 'denied'
                    ? 'Reset site permissions in browser settings to enable ring.'
                    : 'Enable push notifications to ring even when your phone is locked.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {permission !== 'denied' && (
                <button
                  onClick={requestPermission}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-black text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95 cursor-pointer"
                >
                  Enable
                </button>
              )}
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 md:p-2 text-black hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
