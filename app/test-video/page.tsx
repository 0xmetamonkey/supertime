
"use client";

import LiveKitCall from '../components/LiveKitCall';
import { useState } from 'react';

export default function TestVideoPage() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState(`test-user-${Math.floor(Math.random() * 1000)}`);
  const roomName = "test-livekit-debug";

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4">
        <h1 className="text-2xl font-bold">🛠️ LiveKit Debugger</h1>
        <p className="text-zinc-400">Test video without logging in.</p>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <p className="text-sm font-mono mb-2">Room: <span className="text-green-400">{roomName}</span></p>
          <p className="text-sm font-mono mb-4 text-zinc-500">User: {username}</p>
          <button
            onClick={() => setJoined(true)}
            className="bg-white text-black font-bold px-6 py-2 rounded-full hover:bg-zinc-200"
          >
            Join Test Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitCall
      room={roomName}
      username={username}
      onDisconnect={() => setJoined(false)}
    />
  );
}
