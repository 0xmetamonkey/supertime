
"use client";

import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState } from "react";

export default function LiveKitCall({
  room,
  username,
  onDisconnect,
}: {
  room: string;
  username: string;
  onDisconnect: () => void;
}) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const url = `/api/livekit/token?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`;
        console.log("Fetching token from:", url);
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        console.log("Token received:", data.token?.slice(0, 10) + "...");
        setToken(data.token);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to fetch token");
      }
    })();
  }, [room, username]);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 bg-zinc-900 p-4 text-center">
        <p className="font-bold mb-2">Connection Error</p>
        <p className="text-xs font-mono">{error}</p>
        <button onClick={onDisconnect} className="mt-4 bg-white text-black px-4 py-2 rounded text-xs font-bold">Close</button>
      </div>
    );
  }

  if (!serverUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-amber-500 bg-zinc-900 p-4 text-center">
        <p className="font-bold mb-2">Configuration Missing</p>
        <p className="text-xs font-mono mb-4">NEXT_PUBLIC_LIVEKIT_URL is not set in .env.local</p>
        <p className="text-[10px] text-zinc-400">Please add your WebSocket URL as NEXT_PUBLIC_LIVEKIT_URL</p>
        <button onClick={onDisconnect} className="mt-4 bg-white text-black px-4 py-2 rounded text-xs font-bold">Close</button>
      </div>
    );
  }

  if (token === "") {
    return <div className="flex items-center justify-center h-full text-white animate-pulse">Initializing Secure Connection...</div>;
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
      onDisconnected={onDisconnect}
      onError={(err) => setError(err.message)}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
