'use client';

import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import { Sparkles } from 'lucide-react';

interface CallStageProps {
  channelName: string;
  uid: string | number;
  type: string | null;
  onDisconnect: () => void;
  onSaveArtifact?: (url: string) => void;
}

export default function CallStage({ channelName, uid: passedUid, type, onDisconnect, onSaveArtifact }: CallStageProps) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Agora UID must be a number for some older SDK versions or if we want better compatibility,
  // but string is supported in v4+. We'llHash it if it's a string just in case, or use as is.
  const uid = typeof passedUid === 'number' ? passedUid : (passedUid ? Number(passedUid.replace(/[^0-9]/g, '').slice(0, 8)) : Math.floor(Math.random() * 1000000));
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  // Recording & Consent State
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [consentState, setConsentState] = useState<'idle' | 'requesting' | 'pending_approval' | 'granted' | 'denied'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const dataStreamIdRef = useRef<number | null>(null);

  // Dragging state for PiP
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0 });

  // Guard against concurrent connection attempts
  const isConnectingRef = useRef(false);

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

    // Listeners for remote user events
    // We attach these BEFORE calling connect() so we don't miss any events during join
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (user.uid === uid) return;
      console.log(`[CALL] 📥 Remote user published: ${user.uid} (${mediaType})`);
      try {
        await client.subscribe(user, mediaType);
        console.log(`[CALL] ✨ Subscribed to ${user.uid} (${mediaType})`);

        // Update state to trigger re-render
        // We use a functional update to ensure we always have the freshest list
        setRemoteUsers(prev => {
          const exists = prev.find(u => u.uid === user.uid);
          if (exists) {
            // Already in list, just force refresh to pick up new track
            return [...prev.filter(u => u.uid !== user.uid), user];
          }
          return [...prev, user];
        });

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      } catch (err) {
        console.error(`[CALL] ❌ Subscription failed for ${user.uid}`, err);
      }
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      console.log(`[CALL] 📤 Remote user unpublished: ${user.uid} (${mediaType})`);
      if (mediaType === 'video') {
        setRemoteUsers(prev => [...prev]); // Force refresh to clear video player
      }
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      console.log(`[CALL] 👋 Remote user left: ${user.uid}`);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));

      if (!channelName.startsWith('room-')) {
        console.log('[CALL] 🛡️ Ending private session as peer has left');
        onDisconnect();
      }
    };

    const handleVolumeIndicator = (result: { uid: string | number; level: number }[]) => {
      const newVols: Record<string, number> = {};
      result.forEach(v => { newVols[v.uid.toString()] = v.level; });
      setVolumes(newVols);
    };

    const handleStreamMessage = (uid: string | number, data: Uint8Array) => {
      try {
        const decoded = new TextDecoder().decode(data);
        const json = JSON.parse(decoded);
        console.log('[CALL] 📨 Received metadata signal:', json);
        if (json.type === 'REQ_REC') setConsentState('pending_approval');
        else if (json.type === 'RES_REC_OK') setConsentState('granted');
        else if (json.type === 'RES_REC_NO') {
          setConsentState('denied');
          setIsRecording(false);
          alert("Recording consent was denied.");
        }
      } catch (e) {
        console.error("[CALL] ❌ Metadata parse error", e);
      }
    };

    // Attach listeners
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-left', handleUserLeft);
    client.on('volume-indicator', handleVolumeIndicator);
    client.on('stream-message', handleStreamMessage);

    const hashUID = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };

    const uid = typeof passedUid === 'number' ? passedUid : hashUID(passedUid || 'anonymous');

    const connect = async () => {
      if (isConnectingRef.current) {
        console.log("[CALL] 🛑 Connection already in progress, skipping start");
        return;
      }
      isConnectingRef.current = true;

      console.log(`[CALL] ✨ Initiating Flow | Channel: ${channelName} | UID: ${uid}`);
      try {
        const res = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`);
        const data = await res.json();

        if (!data.token || !data.appId) {
          throw new Error("Missing Token/AppID from Bridge");
        }

        console.log(`[CALL] ✅ Config Locked. AppID: ${data.appId.slice(0, 5)}...`);
        if (!active) return;

        const audioConfig: any = { encoderConfig: "music_standard", AEC: true, AGC: true, ANS: true };
        const tracks = isVideo
          ? await AgoraRTC.createMicrophoneAndCameraTracks(audioConfig, undefined)
          : [await AgoraRTC.createMicrophoneAudioTrack(audioConfig)];

        if (!active) {
          tracks.forEach(t => t.close());
          return;
        }

        setLocalTracks(tracks);
        tracksRef.current = tracks;

        if (client.connectionState === 'DISCONNECTED' || client.connectionState === 'DISCONNECTING') {
          console.log(`[CALL] 🔗 client.join(${channelName}) starting...`);
          try {
            await client.join(data.appId, channelName, data.token, uid);
            setIsConnected(true);
            console.log(`[CALL] 🎉 JOINED | State: ${client.connectionState}`);

            if (tracks.length > 0) {
              console.log(`[CALL] 📡 client.publish starting...`);
              await client.publish(tracks);
              console.log(`[CALL] 🌍 BROADCASTING ACTIVE`);
            }
          } catch (joinErr: any) {
            console.error("[CALL] ❌ Join/Publish Error:", joinErr);
            if (joinErr.code !== 'JOIN_ALREADY_IN_PROGRESS') throw joinErr;
          }

          if (client.remoteUsers.length > 0) {
            console.log(`[CALL] 👥 Syncing ${client.remoteUsers.length} existing peers`);
            client.remoteUsers.forEach(async (user) => {
              if (user.hasAudio || user.hasVideo) await handleUserPublished(user, user.hasVideo ? 'video' : 'audio');
            });
          }
        }

        const dsId = (client as any).createDataStream({ reliable: true, ordered: true });
        dataStreamIdRef.current = dsId;

      } catch (err: any) {
        console.error("[CALL] 💥 BOOM | Critical Failure:", err);
        if (tracksRef.current) tracksRef.current.forEach(t => t.close());
      } finally {
        isConnectingRef.current = false;
      }
    };

    connect();

    return () => {
      active = false;
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-left', handleUserLeft);
      client.off('volume-indicator', handleVolumeIndicator);
      client.off('stream-message', handleStreamMessage);

      tracksRef.current.forEach(t => { t.stop(); t.close(); });
      client.leave();
    };
  }, [client, channelName, passedUid, isVideo]);

  const toggleMic = async () => {
    if (!client || !localTracks?.[0]) return;
    const track = localTracks[0];
    if (track.enabled) {
      if (client.connectionState === 'CONNECTED') {
        await client.unpublish(track);
      }
      await track.setEnabled(false);
    } else {
      await track.setEnabled(true);
      if (client.connectionState === 'CONNECTED') {
        await client.publish(track);
      }
    }
    setLocalTracks([...localTracks]);
  };

  const toggleCam = async () => {
    if (isVideo && client && localTracks?.[1]) {
      const track = localTracks[1];
      if (track.enabled) {
        if (client.connectionState === 'CONNECTED') {
          await client.unpublish(track);
        }
        await track.setEnabled(false);
      } else {
        await track.setEnabled(true);
        if (client.connectionState === 'CONNECTED') {
          await client.publish(track);
        }
      }
      setLocalTracks([...localTracks]);
    }
  };

  const sendSignal = (msg: any) => {
    if (client && dataStreamIdRef.current !== null) {
      const encoded = new TextEncoder().encode(JSON.stringify(msg));
      (client as any).sendStreamMessage(dataStreamIdRef.current, encoded);
    }
  };

  const requestRecording = () => {
    setConsentState('requesting');
    sendSignal({ type: 'REQ_REC' });
  };

  const respondToConsent = (granted: boolean) => {
    setConsentState(granted ? 'granted' : 'denied');
    sendSignal({ type: granted ? 'RES_REC_OK' : 'RES_REC_NO' });
  };

  useEffect(() => {
    if (consentState === 'granted' && !isRecording && !isUploading && onSaveArtifact) {
      // Only the party with a save destination actually triggers the recording
      startRecording();
    }
  }, [consentState, onSaveArtifact]);

  const startRecording = async () => {
    try {
      const stream = new MediaStream();

      // Add local tracks
      if (localTracks) {
        localTracks.forEach((track: any) => {
          const mediaTrack = track.getMediaStreamTrack();
          if (mediaTrack) stream.addTrack(mediaTrack);
        });
      }

      // Add remote tracks (mixing would be better but this is MVP)
      remoteUsers.forEach(user => {
        if (user.audioTrack) stream.addTrack(user.audioTrack.getMediaStreamTrack());
        if (user.videoTrack) stream.addTrack(user.videoTrack.getMediaStreamTrack());
      });

      if (stream.getTracks().length === 0) {
        alert("No active tracks to record");
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        await uploadRecording(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Recording start failed", e);
      setConsentState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setConsentState('idle');
    }
  };

  const uploadRecording = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const filename = `recording-${Date.now()}.webm`;
      const res = await fetch(`/api/upload?filename=${filename}`, {
        method: 'POST',
        body: blob
      });
      const data = await res.json();
      if (data.url && onSaveArtifact) {
        onSaveArtifact(data.url);
      }
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setIsUploading(false);
    }
  };

  const mainRemoteUser = remoteUsers.find(u => u.videoTrack) || remoteUsers[0];

  console.log(`[CALL] Render: isVideo=${isVideo}, isConnected=${isConnected}, localTracks=${!!localTracks}, remoteUsers=${remoteUsers.length}`);

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden select-none">
      {/* DEBUG OVERLAY (Only on localhost) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 left-2 z-[999] bg-black/80 p-2 text-[8px] font-mono pointer-events-none border border-white/20">
          <div>STAT: {isConnected ? 'CONNECTED' : 'CONNECTING...'}</div>
          <div>CHAN: {channelName}</div>
          <div>TYPE: {type}</div>
          <div>LOC_T: {localTracks ? 'OK' : 'NULL'}</div>
          <div>REM_U: {remoteUsers.length}</div>
        </div>
      )}
      {/* ROOM HEADER */}
      <div className="absolute top-0 inset-x-0 z-30 p-8 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className={`px-4 py-1.5 border-4 border-black font-black uppercase text-xs shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${type === 'video' ? 'bg-neo-pink text-white' : 'bg-neo-blue text-white'}`}>
            {channelName.startsWith('room-') ? 'Studio Space' : 'Private Session'}
          </div>
          <div className="flex items-center gap-2 bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{type} active</span>
          </div>
        </div>
        <div className="bg-neo-yellow border-4 border-black px-6 py-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black flex items-center gap-4 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest leading-none opacity-40">Live Audience</span>
            <span className="text-xl font-black tabular-nums leading-none tracking-tighter">{(remoteUsers.length + 1).toString().padStart(2, '0')}</span>
          </div>
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* REMOTE / PRIMARY DISPLAY */}
      <div className="absolute inset-0 z-0 bg-zinc-950 flex flex-col items-center justify-center p-6 pb-40">
        {!remoteUsers.length ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* If we have local video but no remote, show local video in center (bigger) for Studio check */}
            {isVideo && localTracks?.[1] ? (
              <div className="w-full h-full max-w-4xl aspect-video bg-zinc-900 border-4 border-white/10 shadow-2xl overflow-hidden relative group">
                <VideoPlayer track={localTracks[1]} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-8 left-8">
                  <span className="bg-neo-yellow text-black px-4 py-1 font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    Local Preview: Studio Ready
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-zinc-500 font-black uppercase tracking-[0.3em] animate-pulse italic">Waiting for connection...</div>
                <div className="mt-4 text-[10px] text-zinc-700 font-mono tracking-widest">{channelName}</div>
              </div>
            )}
          </div>
        ) : (
          <div className={`w-full h-full grid gap-6 ${remoteUsers.length === 1 ? 'grid-cols-1' : (remoteUsers.length <= 4 ? 'grid-cols-2' : 'grid-cols-3')} overflow-y-auto custom-scrollbar pt-20`}>
            {remoteUsers.map((user) => (
              <div key={user.uid} className="relative flex flex-col items-center justify-center bg-black/40 border-4 border-white/5 shadow-2xl overflow-hidden group">
                {user.videoTrack ? (
                  <VideoPlayer track={user.videoTrack} />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <VoiceAura volume={volumes[user.uid.toString()] || 0} />
                      <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center text-4xl border-2 border-white/5 relative z-10">
                        <span className="opacity-40">👤</span>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10">
                      <span className="text-[10px] font-black text-white/50 tracking-widest uppercase italic">Participant</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-[8px] font-black uppercase tracking-widest text-white/40">
                  UID: {user.uid}
                </div>
              </div>
            ))}
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

          <div className="w-[1px] h-8 bg-white/10 my-auto" />

          <button
            onClick={isRecording ? stopRecording : requestRecording}
            disabled={isUploading || consentState === 'requesting'}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : (consentState === 'requesting' ? 'bg-zinc-700' : 'bg-white/10 text-white hover:bg-white/20')}`}
          >
            <span className="text-xl">{isUploading || consentState === 'requesting' ? '⌛' : (isRecording ? '⏹️' : '⏺️')}</span>
            <span className="text-[8px] font-bold mt-[-4px]">{isUploading ? 'SAVING' : (consentState === 'requesting' ? 'WAIT' : (isRecording ? 'STOP' : 'REC'))}</span>
          </button>
        </div>
      </div>

      {/* CONSENT MODAL */}
      {consentState === 'pending_approval' && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⏺️</div>
            <h2 className="text-xl font-bold mb-2">Recording Consent</h2>
            <p className="text-zinc-400 text-sm mb-6">The creator would like to record this session for the Artifact Library. Do you consent to being recorded?</p>
            <div className="flex gap-4">
              <button
                onClick={() => respondToConsent(false)}
                className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => respondToConsent(true)}
                className="flex-1 py-3 bg-[#CEFF1A] text-black font-black rounded-2xl hover:bg-[#dfff5e] transition-colors"
              >
                I Consent
              </button>
            </div>
          </div>
        </div>
      )}

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
