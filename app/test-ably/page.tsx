'use client';

import { useState, useEffect } from 'react';
import { AblyProvider, useAbly, useCallSignaling } from '@/app/lib/ably';

function TestContent({ clientId }: { clientId: string }) {
  const { isConnected, client } = useAbly();
  const [targetUser, setTargetUser] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const signaling = useCallSignaling(clientId);

  // Log connection status once
  useEffect(() => {
    if (isConnected) {
      addLog('✅ Ably connected successfully!');
    }
  }, [isConnected]);

  // Watch for incoming calls
  useEffect(() => {
    if (signaling.incomingCall) {
      addLog(`📥 Incoming call from: ${signaling.incomingCall.from}`);
    }
  }, [signaling.incomingCall]);

  const handleSendTestSignal = async () => {
    if (!targetUser) {
      addLog('❌ Enter a target user ID');
      return;
    }
    try {
      const channelName = await signaling.initiateCall(targetUser, 'video');
      addLog(`📤 Sent call to ${targetUser}, channel: ${channelName}`);
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Ably Test Page</h1>
          <p className="text-zinc-500">Verify real-time signaling before integration</p>
        </div>

        {/* Connection Status */}
        <div className={`p-4 rounded-xl border-2 ${isConnected ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="font-bold">{isConnected ? 'Connected to Ably' : 'Connecting...'}</span>
          </div>
          <p className="text-lg text-neo-yellow mt-2 font-mono">Your ID: {clientId}</p>
        </div>

        {/* Send Test Signal */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
          <h2 className="font-bold uppercase text-sm tracking-widest text-zinc-400">Send Test Signal</h2>
          <input
            type="text"
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            placeholder="Target user ID (e.g., user-2)"
            className="w-full p-3 bg-black border border-zinc-700 rounded-lg text-white"
          />
          <button
            onClick={handleSendTestSignal}
            disabled={!isConnected}
            className="w-full py-3 bg-neo-yellow text-black font-bold rounded-lg disabled:opacity-50"
          >
            Send Call Signal
          </button>
        </div>

        {/* Incoming Call */}
        {signaling.incomingCall && (
          <div className="p-4 bg-green-500/20 border-2 border-green-500 rounded-xl animate-pulse">
            <h2 className="font-bold text-green-400 mb-2">📞 Incoming Call!</h2>
            <p>From: {signaling.incomingCall.from}</p>
            <p>Type: {signaling.incomingCall.type}</p>
            <p>Channel: {signaling.incomingCall.channelName}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const call = signaling.acceptCall();
                  addLog(`✅ Accepted call from ${call?.from}`);
                }}
                className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  signaling.rejectCall();
                  addLog('❌ Rejected call');
                }}
                className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <h2 className="font-bold uppercase text-sm tracking-widest text-zinc-400 mb-4">Event Log</h2>
          <div className="h-48 overflow-y-auto space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-zinc-600">Waiting for events...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-zinc-300">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-sm text-zinc-400">
          <h3 className="font-bold text-white mb-2">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open <code className="bg-zinc-800 px-1">localhost:3000/test-ably?id=user-1</code> in Tab 1</li>
            <li>Open <code className="bg-zinc-800 px-1">localhost:3000/test-ably?id=user-2</code> in Tab 2</li>
            <li>In Tab 1: Enter "user-2" and click Send</li>
            <li>In Tab 2: You should see the incoming call appear <strong>instantly</strong></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function TestAblyPage() {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    // Get client ID from URL query param
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || `user-${Math.random().toString(36).slice(2, 6)}`;
    setClientId(id);
  }, []);

  if (!clientId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neo-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AblyProvider clientId={clientId}>
      <TestContent clientId={clientId} />
    </AblyProvider>
  );
}
