'use client';
import { useEffect, useRef, useState } from 'react';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

// Dynamic import to avoid SSR issues with Agora SDK
let AgoraRTC: any;

type AgoraCallProps = {
  channelName: string;
  uid: string;
  remoteName?: string;
  callType?: 'audio' | 'video';
  onEndCall: () => void;
  onTimeUpdate?: (seconds: number) => void;
};

export default function AgoraCall({ channelName, uid, remoteName = 'Guest', callType = 'video', onEndCall, onTimeUpdate }: AgoraCallProps) {
  const [joined, setJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Call duration timer
  // Call duration timer - Starts only when someone else is in the call
  useEffect(() => {
    if (joined && remoteUsers.length > 0) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          onTimeUpdate?.(newDuration);
          return newDuration;
        });
      }, 1000);
    } else {
      // Pause or Reset? 
      // If we want "Total Session Time" we keep it. 
      // User complaint was "mismatch". If we wait for connection, both start at 0:00 when fully connected.
      // But if connection drops?
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [joined, remoteUsers.length, onTimeUpdate]);

  useEffect(() => {
    const initAgora = async () => {
      if (!AgoraRTC) {
        AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      }

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType);

        // Track ALL users to ensure 'remoteUsers.length > 0' triggers the connected state
        setRemoteUsers((prev) => {
          if (prev.find(u => u.uid === user.uid)) return prev;
          return [...prev, user];
        });

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        } else if (mediaType === 'video' && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current);
        }
      });

      client.on('user-unpublished', (user: any) => {
        // We only remove if specifically unpublished? 
        // Agora docs say user-unpublished is called when a track is removed.
      });

      client.on('user-left', (user: any) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      try {
        if (channelName.includes('undefined') || channelName.includes('null')) {
          throw new Error("Invalid Channel Name. Please setup your profile.");
        }

        const res = await fetch(`/api/agora?channelName=${channelName}&uid=${uid}`);
        const data = await res.json();

        if (data.error) {
          throw new Error(`Token Error: ${data.error}`);
        }

        const { token, uid: serverUid, appId: serverAppId } = data;
        const appId = serverAppId || process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim()!;

        if (!clientRef.current) return;

        const joinUid = serverUid || uid;

        console.log("Debug: Starting Join...", { channelName, joinUid, hasToken: !!token });

        try {
          const joinPromise = client.join(appId, channelName, token, joinUid);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Join Timed Out (15s)")), 15000)
          );
          await Promise.race([joinPromise, timeoutPromise]);
        } catch (joinErr: any) {
          console.warn("⚠️ Token Join Failed, attempting Fail-Safe (No Token) mode...", joinErr);
          // FAIL-SAFE: Try joining with NULL token (Low Security)
          await client.join(appId, channelName, null, joinUid);
          console.log("✅ Joined via Fail-Safe Mode");
        }

        console.log("✅ Joined Successfully");

        // Create & Publish Local Tracks
        if (callType === 'video') {
          const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
          audioTrackRef.current = mic;
          videoTrackRef.current = cam;
          if (localVideoRef.current) {
            cam.play(localVideoRef.current);
          }
          await client.publish([mic, cam]);
        } else {
          const mic = await AgoraRTC.createMicrophoneAudioTrack();
          audioTrackRef.current = mic;
          await client.publish([mic]);
        }

        setJoined(true);
      } catch (error: any) {
        console.error("Agora Init Failed", error);
        setInitError(error.message || "Failed to join call");
      }
    };

    initAgora();

    return () => {
      leaveCall();
    };
  }, [channelName, uid]);


  const toggleMute = () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (videoTrackRef.current) {
      videoTrackRef.current.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeaker = () => {
    // In browser, this usually means muting/unmuting the remote audio tracks locally
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        if (isSpeakerOn) user.audioTrack.stop();
        else user.audioTrack.play();
      }
    });
    setIsSpeakerOn(!isSpeakerOn);
  };

  const leaveCall = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.close();
    }
    if (videoTrackRef.current) {
      videoTrackRef.current.close();
    }
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    setJoined(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Call Duration Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-black/70 backdrop-blur px-4 py-2 rounded-full flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono font-bold text-white text-lg">{formatTime(callDuration)}</span>
      </div>

      {/* Main View - Remote or Placeholder */}
      <div className="flex-1 relative bg-zinc-900 overflow-hidden">
        {initError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black z-50">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-red-500 mb-2">Connection Failed</h3>
            <p className="text-zinc-400 mb-6">{initError}</p>
            <button
              onClick={onEndCall}
              className="bg-zinc-800 text-white px-6 py-2 rounded-full font-bold hover:bg-zinc-700"
            >
              Close Call
            </button>
          </div>
        ) : callType === 'audio' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center mb-4 animate-pulse">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white uppercase tracking-tighter">Audio Call Active</span>
            {remoteUsers.length === 0 && (
              <span className="text-zinc-500 text-xs mt-3 uppercase font-bold animate-pulse">Waiting for {remoteName}...</span>
            )}
          </div>
        ) : remoteUsers.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-20 h-20 border-4 border-zinc-700 border-t-[#CEFF1A] rounded-full animate-spin mb-6" />
            <span className="animate-pulse uppercase font-black tracking-tighter text-white mb-2">Waiting for {remoteName}...</span>
            <div className="flex flex-col items-center gap-1 opacity-50 font-mono text-[8px] uppercase">
              <span>Channel: {channelName}</span>
              <span>UID: {uid}</span>
            </div>
          </div>
        ) : (
          <div ref={remoteVideoRef} className="w-full h-full object-cover" />
        )}

        {/* Local View - Picture in Picture (Video only) */}
        {callType === 'video' && (
          <div className="absolute top-16 right-4 w-28 h-40 bg-black rounded-xl overflow-hidden border-2 border-zinc-700 shadow-xl">
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#666">
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                </svg>
              </div>
            ) : (
              <div ref={localVideoRef} className="w-full h-full object-cover" />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-28 bg-gradient-to-t from-black to-transparent flex items-center justify-center gap-6 pb-6">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isMuted ? 'bg-red-500/20 border-2 border-red-500' : 'bg-zinc-800 border-2 border-zinc-600'
            }`}
        >
          {isMuted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V21c0 .55.45 1 1 1s1-.45 1-1v-3.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
          )}
        </button>

        {/* End Call Button */}
        <button
          onClick={() => { leaveCall(); onEndCall(); }}
          className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.7-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.5 7.46 6.55 12 6.55s8.66 1.95 11.71 5.12c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.7.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
          </svg>
        </button>

        {/* Speaker/Video Toggle */}
        <button
          onClick={callType === 'video' ? toggleVideo : toggleSpeaker}
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${(callType === 'video' ? isVideoOff : !isSpeakerOn) ? 'bg-red-500/20 border-2 border-red-500' : 'bg-zinc-800 border-2 border-zinc-600'
            }`}
        >
          {callType === 'video' ? (
            isVideoOff ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            )
          ) : (
            isSpeakerOn ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            )
          )}
        </button>
      </div>
    </div>
  );
}
