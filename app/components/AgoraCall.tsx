'use client';

import {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRTCClient,
  useRemoteUsers,
  useRemoteUserTrack,
  RemoteUser,
  LocalVideoTrack,
} from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useEffect, useState } from 'react';

function CallInterface({
  channelName,
  onDisconnect,
}: {
  channelName: string;
  onDisconnect: () => void;
}) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const [token, setToken] = useState('');
  const [uid] = useState(Math.floor(Math.random() * 10000)); // Random local UID

  // 1. Fetch Token
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [channelName, uid]);

  if (!appId || !token) {
    return (
      <div className="flex items-center justify-center h-full text-white font-mono text-xs animate-pulse">
        Initializing Secure Channel...
      </div>
    );
  }

  return (
    <AgoraStage
      appId={appId}
      token={token}
      channel={channelName}
      uid={uid}
      onDisconnect={onDisconnect}
    />
  );
}

function AgoraStage({
  appId,
  token,
  channel,
  uid,
  onDisconnect,
}: {
  appId: string;
  token: string;
  channel: string;
  uid: number;
  onDisconnect: () => void;
}) {
  const client = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }) as any);

  return (
    <AgoraRTCProvider client={client}>
      <CallLogic
        appId={appId}
        token={token}
        channel={channel}
        uid={uid}
        onDisconnect={onDisconnect}
      />
    </AgoraRTCProvider>
  );
}

function CallLogic({
  appId,
  token,
  channel,
  uid,
  onDisconnect,
}: {
  appId: string;
  token: string;
  channel: string;
  uid: number;
  onDisconnect: () => void;
}) {
  const { isLoading: isJoining, isConnected } = useJoin(
    { appid: appId, channel: channel, token: token, uid: uid },
    true
  );

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  // Local Tracks - only create after connected
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn && isConnected);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn && isConnected);

  // Publish - only after connected and tracks exist
  usePublish(isConnected ? [localMicrophoneTrack, localCameraTrack] : []);

  // Remote Users
  const remoteUsers = useRemoteUsers();

  return (
    <div className="relative w-full h-full bg-black text-white overflow-hidden">
      {/* REMOTE USERS GRID */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        {remoteUsers.length === 0 ? (
          <div className="text-center">
            <div className="text-zinc-500 font-mono text-xs mb-2">WAITING FOR OTHERS...</div>
            <div className="loader w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className={`grid w-full h-full ${remoteUsers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {remoteUsers.map((user) => (
              <div key={user.uid} className="relative w-full h-full bg-zinc-900 border border-zinc-800">
                <RemoteUser user={user} style={{ width: '100%', height: '100%' }} />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-[10px] font-mono rounded">
                  User: {user.uid}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOCAL USER (PIP) */}
      <div className="absolute top-4 right-4 w-32 h-44 bg-zinc-900 border-2 border-zinc-700 shadow-xl z-10 rounded overflow-hidden">
        <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" />
        <div className="absolute bottom-1 right-1 text-[8px] bg-black/50 px-1 text-white">YOU</div>
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-4 bg-zinc-900/80 p-3 rounded-full border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setMicOn((a) => !a)}
          className={`p-3 rounded-full transition-all ${micOn ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-red-500 text-white'}`}
        >
          {micOn ? 'Mic On' : 'Mic Off'}
        </button>
        <button
          onClick={() => setCameraOn((a) => !a)}
          className={`p-3 rounded-full transition-all ${cameraOn ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-red-500 text-white'}`}
        >
          {cameraOn ? 'Cam On' : 'Cam Off'}
        </button>
        <button
          onClick={onDisconnect}
          className="bg-red-600 text-white font-bold px-6 py-3 rounded-full hover:bg-red-500 shadow-[0px_0px_20px_rgba(255,0,0,0.5)]"
        >
          END CALL
        </button>
      </div>
    </div>
  );
}

export default CallInterface;
