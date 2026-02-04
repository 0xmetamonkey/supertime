'use client';

import React, { useEffect, useState } from 'react';

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied';

interface PermissionsGateProps {
  type: 'audio' | 'video';
  children: React.ReactNode;
}

export default function PermissionsGate({ type, children }: PermissionsGateProps) {
  const [status, setStatus] = useState<PermissionState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-request on mount
  useEffect(() => {
    requestAccess();
  }, [type]);

  const requestAccess = async () => {
    setStatus('requesting');
    try {
      if (type === 'video') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // Stop immediately, we just needed permission
        stream.getTracks().forEach(t => t.stop());
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
      setStatus('granted');
    } catch (err: any) {
      console.error("Permission failed:", err);
      setStatus('denied');
      setErrorMsg(err.message || "Access denied");
    }
  };

  if (status === 'requesting') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-black text-white p-8 text-center animate-in fade-in">
        <div className="w-16 h-16 border-4 border-[#CEFF1A] border-t-black rounded-full animate-spin mb-8" />
        <h2 className="text-xl font-black uppercase mb-2">Securing Line...</h2>
        <p className="text-zinc-500 font-mono text-xs">Requesting secure media access</p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-900 text-white p-8 text-center animate-in zoom-in duration-300">
        <div className="text-6xl mb-6">🚫</div>
        <h2 className="text-2xl font-black uppercase mb-4 text-red-500">Access Blocked</h2>
        <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
          We cannot connect the call without {type === 'video' ? 'Camera' : 'Microphone'} access.
        </p>
        <button
          onClick={requestAccess}
          className="bg-white text-black font-bold uppercase px-8 py-4 rounded-full hover:bg-[#CEFF1A] transition-colors"
        >
          Try Again
        </button>
        <p className="mt-8 text-[10px] text-zinc-600 font-mono">
          System: {errorMsg}
        </p>
      </div>
    );
  }

  if (status === 'granted') {
    return <>{children}</>;
  }

  return null;
}
