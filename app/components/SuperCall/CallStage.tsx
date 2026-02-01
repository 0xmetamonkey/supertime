'use client';

import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';

interface CallStageProps {
  channelName: string;
  type: string | null;
  onDisconnect: () => void;
}

export default function CallStage({ channelName, type, onDisconnect }: CallStageProps) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [uid] = useState(Math.floor(Math.random() * 1000000));
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  // Dragging state for PiP
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0 });

  const onDragStart = (e: any) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.lastX = pos.x;
    dragRef.current.lastY = pos.y;
    setDragging(true);
  };

  const onDragMove = (e: any) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    setPos({
      x: dragRef.current.lastX + dx,
      y: dragRef.current.lastY + dy
    });
  };

  const onDragEnd = () => setDragging(false);

  const isVideo = type === 'video';
  const tracksRef = useRef<any[]>([]);

  useEffect(() => {
    const c = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setClient(c);
    c.enableAudioVolumeIndicator();
    return () => { c.leave(); };
  }, []);

  useEffect(() => {
    if (!client) return;
    let active = true;

    const connect = async () => {
      try {
        const res = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`);
        const data = await res.json();
        if (!active) return;

        const audioConfig: any = {
          encoderConfig: "music_standard",
          AEC: true,
          AGC: true,
          ANS: true
        };

        const tracks = isVideo
          ? await AgoraRTC.createMicrophoneAndCameraTracks(audioConfig, undefined)
          : [await AgoraRTC.createMicrophoneAudioTrack(audioConfig)];

        if (!active) {
          tracks.forEach(t => t.close());
          return;
        }

        setLocalTracks(tracks);
        tracksRef.current = tracks;
        await client.publish(tracks);

      } catch (err: any) {
        console.error("Connection error:", err);
        // Throwing error so ErrorBoundary can catch it
        throw err;
      }
    };

    connect();

    client.on('user-published', async (user, mediaType) => {
      if (user.uid === uid) return;
      await client.subscribe(user, mediaType);
      setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
      if (mediaType === 'audio') user.audioTrack?.play();
    });

    client.on('user-unpublished', (user, mediaType) => {
      console.log('[CallStage] User unpublished:', user.uid, mediaType);
      if (mediaType === 'video') {
        // Force state refresh to clear stuck video players
        setRemoteUsers(prev => [...prev]);
      }
    });

    client.on('volume-indicator', (result) => {
      const newVols: Record<string, number> = {};
      result.forEach(v => { newVols[v.uid.toString()] = v.level; });
      setVolumes(newVols);
    });

    client.on('user-left', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      // Billing Safety: If the other user leaves, end the call immediately
      console.log('[CallStage] Remote user left, ending call for safety');
      onDisconnect();
    });

    return () => {
      active = false;
      tracksRef.current.forEach(t => { t.stop(); t.close(); });
      client.leave();
    };
  }, [client, channelName, uid, isVideo, appId]);

  const toggleMic = async () => {
    if (!client || !localTracks?.[0]) return;
    const track = localTracks[0];
    if (track.enabled) {
      await client.unpublish(track);
      await track.setEnabled(false);
    } else {
      await track.setEnabled(true);
      await client.publish(track);
    }
    setLocalTracks([...localTracks]);
  };

  const toggleCam = async () => {
    if (isVideo && client && localTracks?.[1]) {
      const track = localTracks[1];
      if (track.enabled) {
        await client.unpublish(track);
        await track.setEnabled(false);
      } else {
        await track.setEnabled(true);
        await client.publish(track);
      }
      setLocalTracks([...localTracks]);
    }
  };

  const mainRemoteUser = remoteUsers.find(u => u.videoTrack) || remoteUsers[0];

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden select-none">

      {/* REMOTE DISPLAY */}
      <div className="absolute inset-0 z-0 bg-zinc-950 flex flex-col items-center justify-center">
        {!mainRemoteUser ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Connecting...</div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {mainRemoteUser.videoTrack ? (
              <VideoPlayer track={mainRemoteUser.videoTrack} />
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <VoiceAura volume={volumes[mainRemoteUser.uid.toString()] || 0} />
                  <div className="w-32 h-32 rounded-full bg-zinc-900 flex items-center justify-center text-5xl border-2 border-white/5 relative z-10 shadow-2xl overflow-hidden">
                    <span className="opacity-40">👤</span>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 z-10">
                  <span className="text-xs font-bold text-white/50 tracking-widest uppercase">Participant</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LOCAL SELF VIEW */}
      {isVideo && localTracks?.[1] && (
        <div
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
            transition: dragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="absolute bottom-28 right-6 w-32 h-44 bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 cursor-move touch-none overflow-hidden"
        >
          {localTracks[1].enabled ? (
            <VideoPlayer track={localTracks[1]} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
              <div className="relative">
                <VoiceAura volume={volumes[uid.toString()] || 0} />
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-xl relative z-10 border border-white/10">
                  😊
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTROLS */}
      <div className="absolute bottom-10 inset-x-0 flex justify-center gap-6 z-20">
        <div className="flex bg-zinc-900/80 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl gap-3">
          <button onClick={toggleMic} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${localTracks?.[0]?.enabled ? 'bg-white/10 text-white' : 'bg-red-500 text-white'}`}>
            <span className="text-xl">{localTracks?.[0]?.enabled ? '🎙️' : '🔇'}</span>
          </button>
          {isVideo && (
            <button onClick={toggleCam} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${localTracks?.[1]?.enabled ? 'bg-white/10 text-white' : 'bg-red-500 text-white'}`}>
              <span className="text-xl">{localTracks?.[1]?.enabled ? '📹' : '🚫'}</span>
            </button>
          )}
          <button onClick={onDisconnect} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
            <span className="text-xl">📞</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: inherit; }
      `}</style>
    </div>
  );
}

function VoiceAura({ volume = 0 }: { volume?: number }) {
  // Volume usually ranges 0-100 in Agora
  const level = Math.min(volume, 100);
  const scale = 1 + (level / 60);
  const opacity = level > 2 ? Math.min(0.4, (level / 100)) : 0;

  return (
    <>
      <div
        className="absolute inset-0 rounded-full bg-[#CEFF1A] transition-all duration-100 pointer-events-none"
        style={{
          transform: `scale(${scale})`,
          opacity: opacity,
          filter: `blur(${level / 4}px)`,
        }}
      />
      <div
        className="absolute inset-0 rounded-full bg-[#CEFF1A] transition-all duration-150 pointer-events-none delay-75"
        style={{
          transform: `scale(${1 + (level / 100) * 2})`,
          opacity: opacity * 0.5,
          filter: `blur(${level / 2}px)`,
        }}
      />
    </>
  );
}

function VideoPlayer({ track }: { track: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!track || !ref.current) return;
    track.play(ref.current);
    return () => { track.stop(); };
  }, [track]);
  return <div ref={ref} className="w-full h-full" />;
}
