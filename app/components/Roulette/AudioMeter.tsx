'use client';

import React, { useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface AudioMeterProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  className?: string;
}

export default function AudioMeter({
  stream,
  isMuted = false,
  className = '',
}: AudioMeterProps) {
  const bar1Ref = useRef<HTMLDivElement | null>(null);
  const bar2Ref = useRef<HTMLDivElement | null>(null);
  const bar3Ref = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // If explicitly muted or no stream, reset bars to idle
    const resetBars = () => {
      const minH = '3px';
      if (bar1Ref.current) bar1Ref.current.style.height = minH;
      if (bar2Ref.current) bar2Ref.current.style.height = minH;
      if (bar3Ref.current) bar3Ref.current.style.height = minH;
      if (bar1Ref.current) bar1Ref.current.style.backgroundColor = isMuted ? 'rgba(244, 63, 94, 0.5)' : 'rgba(115, 115, 115, 0.6)';
      if (bar2Ref.current) bar2Ref.current.style.backgroundColor = isMuted ? 'rgba(244, 63, 94, 0.5)' : 'rgba(115, 115, 115, 0.6)';
      if (bar3Ref.current) bar3Ref.current.style.backgroundColor = isMuted ? 'rgba(244, 63, 94, 0.5)' : 'rgba(115, 115, 115, 0.6)';
      if (iconRef.current) {
        iconRef.current.style.color = isMuted ? 'rgb(251, 113, 133)' : 'rgb(163, 163, 163)';
      }
    };

    if (!stream || isMuted) {
      resetBars();
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      resetBars();
      return;
    }

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number;
    let isCancelled = false;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        resetBars();
        return;
      }

      audioCtx = new AudioContextClass();

      // Resume on mobile/browser autoplay policy if suspended
      if (audioCtx.state === 'suspended') {
        const resumeAudio = () => {
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
        };
        window.addEventListener('click', resumeAudio, { once: true, passive: true });
        window.addEventListener('touchstart', resumeAudio, { once: true, passive: true });
      }

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.4;

      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      // NOTE: Do NOT connect analyser to audioCtx.destination to prevent feedback / echo

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderMeter = () => {
        if (isCancelled || !analyser) return;

        analyser.getByteFrequencyData(dataArray);

        // Sample 3 frequency bands (low, mid, high)
        // Bins roughly: 1-3 (lows), 4-7 (mids), 8-12 (highs)
        const low = (dataArray[1] + dataArray[2] + dataArray[3]) / (3 * 255);
        const mid = (dataArray[4] + dataArray[5] + dataArray[6] + dataArray[7]) / (4 * 255);
        const high = (dataArray[8] + dataArray[9] + dataArray[10] + dataArray[11]) / (4 * 255);

        // Non-linear boost for speech clarity (voice speech usually registers around 0.1-0.5)
        const h1 = Math.max(3, Math.min(14, 3 + low * 18));
        const h2 = Math.max(3, Math.min(14, 3 + mid * 20));
        const h3 = Math.max(3, Math.min(14, 3 + high * 16));

        const isSpeaking = low > 0.08 || mid > 0.08 || high > 0.08;

        if (bar1Ref.current) {
          bar1Ref.current.style.height = `${h1}px`;
          bar1Ref.current.style.backgroundColor = isSpeaking ? '#34d399' : 'rgba(115, 115, 115, 0.6)';
        }
        if (bar2Ref.current) {
          bar2Ref.current.style.height = `${h2}px`;
          bar2Ref.current.style.backgroundColor = isSpeaking ? '#34d399' : 'rgba(115, 115, 115, 0.6)';
        }
        if (bar3Ref.current) {
          bar3Ref.current.style.height = `${h3}px`;
          bar3Ref.current.style.backgroundColor = isSpeaking ? '#34d399' : 'rgba(115, 115, 115, 0.6)';
        }
        if (iconRef.current) {
          iconRef.current.style.color = isSpeaking ? '#34d399' : 'rgb(163, 163, 163)';
        }

        animationFrameId = requestAnimationFrame(renderMeter);
      };

      renderMeter();
    } catch (err) {
      console.warn('[AudioMeter] Error initializing Web Audio meter:', err);
      resetBars();
    }

    return () => {
      isCancelled = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source) {
        try { source.disconnect(); } catch (_) {}
      }
      if (analyser) {
        try { analyser.disconnect(); } catch (_) {}
      }
      if (audioCtx) {
        try { audioCtx.close(); } catch (_) {}
      }
    };
  }, [stream, isMuted]);

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 select-none pointer-events-none transition-all shadow-md ${className}`}
      aria-hidden="true"
    >
      <div ref={iconRef} className="transition-colors">
        {isMuted ? (
          <MicOff className="w-3 h-3 text-rose-400" />
        ) : (
          <Mic className="w-3 h-3 text-neutral-400" />
        )}
      </div>

      <div className="flex items-end gap-[2px] h-3.5">
        <div
          ref={bar1Ref}
          style={{ height: '3px' }}
          className="w-[2.5px] rounded-full transition-[height] duration-75"
        />
        <div
          ref={bar2Ref}
          style={{ height: '3px' }}
          className="w-[2.5px] rounded-full transition-[height] duration-75"
        />
        <div
          ref={bar3Ref}
          style={{ height: '3px' }}
          className="w-[2.5px] rounded-full transition-[height] duration-75"
        />
      </div>
    </div>
  );
}
