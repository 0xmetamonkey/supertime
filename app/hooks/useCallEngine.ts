'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

export type CallStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'ended';

interface UseCallEngineProps {
  uid: string;
  onCallEnded?: () => void;
}

interface CallEngineState {
  status: CallStatus;
  error: string | null;
  localTracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[] | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export function useCallEngine({ uid, onCallEnded }: UseCallEngineProps) {
  const [state, setState] = useState<CallEngineState>({
    status: 'idle',
    error: null,
    localTracks: null,
    remoteUsers: [],
    isAudioEnabled: true,
    isVideoEnabled: true,
  });

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<(IMicrophoneAudioTrack | ICameraVideoTrack)[]>([]);
  const channelRef = useRef<string | null>(null);

  // Hash UID to number for Agora
  const hashUID = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const numericUid = hashUID(uid);

  // Initialize Agora client
  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on('user-published', async (user, mediaType) => {
      if (user.uid === numericUid) return;

      try {
        await client.subscribe(user, mediaType);
        console.log('[CallEngine] Subscribed to', user.uid, mediaType);

        setState(prev => ({
          ...prev,
          remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user],
        }));

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      } catch (err) {
        console.error('[CallEngine] Subscribe error:', err);
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      console.log('[CallEngine] User unpublished:', user.uid, mediaType);
      setState(prev => ({
        ...prev,
        remoteUsers: prev.remoteUsers.map(u => u.uid === user.uid ? user : u),
      }));
    });

    client.on('user-left', (user) => {
      console.log('[CallEngine] User left:', user.uid);
      setState(prev => ({
        ...prev,
        remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid),
      }));
    });

    client.on('connection-state-change', (curState, prevState) => {
      console.log('[CallEngine] Connection state:', prevState, '->', curState);

      if (curState === 'DISCONNECTED' && prevState === 'CONNECTED') {
        setState(prev => ({ ...prev, status: 'reconnecting' }));
      }

      if (curState === 'CONNECTED') {
        setState(prev => ({ ...prev, status: 'connected' }));
      }
    });

    return () => {
      client.removeAllListeners();
      client.leave();
    };
  }, [numericUid]);

  // Start a call
  const startCall = useCallback(async (channelName: string, type: 'audio' | 'video') => {
    const client = clientRef.current;
    if (!client) return;

    setState(prev => ({ ...prev, status: 'connecting', error: null }));
    channelRef.current = channelName;

    try {
      // 1. Get token
      console.log('[CallEngine] Fetching token for', channelName);
      const tokenRes = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${numericUid}`);
      const tokenData = await tokenRes.json();

      if (!tokenData.token) {
        throw new Error('Failed to get Agora token');
      }

      // 2. Create tracks
      console.log('[CallEngine] Creating tracks...');
      const tracks = type === 'video'
        ? await AgoraRTC.createMicrophoneAndCameraTracks({ AEC: true, AGC: true, ANS: true }, {})
        : [await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, AGC: true, ANS: true })];

      tracksRef.current = tracks;
      setState(prev => ({ ...prev, localTracks: tracks }));

      // 3. Join channel
      console.log('[CallEngine] Joining channel...');
      await client.join(tokenData.appId, channelName, tokenData.token, numericUid);

      // 4. Publish tracks
      console.log('[CallEngine] Publishing tracks...');
      await client.publish(tracks);

      console.log('[CallEngine] ✅ Call started successfully');
      setState(prev => ({ ...prev, status: 'connected' }));

    } catch (err: any) {
      console.error('[CallEngine] Start call failed:', err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err.message || 'Failed to start call',
      }));

      // Cleanup on failure
      tracksRef.current.forEach(t => t.close());
      tracksRef.current = [];
    }
  }, [numericUid]);

  // End the call
  const endCall = useCallback(async () => {
    const client = clientRef.current;

    try {
      // Stop and close tracks
      tracksRef.current.forEach(track => {
        track.stop();
        track.close();
      });
      tracksRef.current = [];

      // Leave channel
      if (client) {
        await client.leave();
      }

      setState({
        status: 'ended',
        error: null,
        localTracks: null,
        remoteUsers: [],
        isAudioEnabled: true,
        isVideoEnabled: true,
      });

      channelRef.current = null;
      onCallEnded?.();

    } catch (err) {
      console.error('[CallEngine] End call error:', err);
    }
  }, [onCallEnded]);

  // Toggle microphone
  const toggleAudio = useCallback(async () => {
    const audioTrack = tracksRef.current[0] as IMicrophoneAudioTrack | undefined;
    if (!audioTrack) return;

    const newState = !audioTrack.enabled;
    await audioTrack.setEnabled(newState);
    setState(prev => ({ ...prev, isAudioEnabled: newState }));
  }, []);

  // Toggle camera
  const toggleVideo = useCallback(async () => {
    const videoTrack = tracksRef.current[1] as ICameraVideoTrack | undefined;
    if (!videoTrack) return;

    const newState = !videoTrack.enabled;
    await videoTrack.setEnabled(newState);
    setState(prev => ({ ...prev, isVideoEnabled: newState }));
  }, []);

  // Retry connection
  const retry = useCallback(() => {
    if (channelRef.current && state.status === 'error') {
      const channel = channelRef.current;
      const type = tracksRef.current.length > 1 ? 'video' : 'audio';
      startCall(channel, type);
    }
  }, [state.status, startCall]);

  return {
    ...state,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    retry,
  };
}
