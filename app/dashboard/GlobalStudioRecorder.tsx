'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { Mic, Square, Loader2, Radio, Sparkles, Pause, GripVertical } from 'lucide-react';

export default function GlobalStudioRecorder({ username }: { username: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Floating & Docking State
  const [isDocked, setIsDocked] = useState(false);
  const [dockPosition, setDockPosition] = useState<'left' | 'right' | 'floating'>('floating');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef('');
  const constraintsRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }
        setTranscript(finalTranscript);
        transcriptRef.current = finalTranscript;
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    }

    return () => stopRecording();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleStopRecording;

      mediaRecorder.start(1000); // chunk every second
      setIsRecording(true);
      setIsExpanded(true);
      setIsDocked(false); // Auto undock when recording starts
      setTranscript('');
      transcriptRef.current = '';
      setDuration(0);

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (audioChunksRef.current.length === 0) {
      setIsExpanded(false);
      return;
    }

    setIsSaving(true);
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mp3') ? 'mp3' : 'webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    
    try {
      const formData = new FormData();
      const filename = `feast_audio_${Date.now()}.${extension}`;
      formData.append('file', audioBlob, filename);
      
      const uploadRes = await fetch(`/api/upload?filename=${filename}`, {
        method: 'POST',
        body: audioBlob 
      });
      
      if (!uploadRes.ok) throw new Error("Audio upload failed");
      const uploadData = await uploadRes.json();
      const audioUrl = uploadData.url;

      const finalTranscript = transcriptRef.current;
      const postTitle = finalTranscript 
        ? (finalTranscript.split(' ').slice(0, 5).join(' ') + '...') 
        : `Studio Recording ${new Date().toLocaleDateString()}`;

      const postRes = await fetch('/api/user/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          post: {
            id: Date.now().toString(),
            title: postTitle,
            content: finalTranscript || "No transcription available.",
            audioUrl: audioUrl,
            isLocked: true,
          }
        })
      });

      if (!postRes.ok) throw new Error("Post creation failed");

      alert("Audio Feast Published!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save audio feast.");
    } finally {
      setIsSaving(false);
      setIsExpanded(false);
      setTranscript('');
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const screenWidth = window.innerWidth;
    const dropX = info.point.x;
    
    // Snapping thresholds (e.g., within 100px of the edges)
    if (dropX > screenWidth - 100) {
      setIsDocked(true);
      setDockPosition('right');
    } else if (dropX < 100) {
      setIsDocked(true);
      setDockPosition('left');
    } else {
      setIsDocked(false);
      setDockPosition('floating');
    }
  };

  return (
    <>
      {/* Constraints area for drag limits */}
      <div ref={constraintsRef} className="fixed inset-4 pointer-events-none z-[90]" />
      
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        dragMomentum={true}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
        onPointerDown={() => isDocked && setIsDocked(false)}
        onHoverStart={() => isDocked && setIsDocked(false)}
        onHoverEnd={() => {
          if (!isRecording && !isExpanded && dockPosition !== 'floating') {
            setIsDocked(true);
          }
        }}
        className={`fixed z-[100] flex flex-col gap-4 touch-none cursor-grab ${
          dockPosition === 'left' ? 'items-start' : 'items-end'
        }`}
        style={{ bottom: '2rem', right: '2rem' }}
      >
        <AnimatePresence>
          {isExpanded && !isDocked && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-surface/95 border border-border shadow-2xl rounded-2xl p-4 w-72 lg:w-80 flex flex-col gap-3 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-sm font-semibold text-foreground">Studio Active</span>
                </div>
                <span className="text-sm font-mono text-muted bg-background/50 px-2 py-0.5 rounded-md border border-border">
                  {formatDuration(duration)}
                </span>
              </div>
              <div className="h-24 overflow-y-auto custom-scrollbar">
                <p className="text-xs text-muted italic leading-relaxed">
                  {transcript || "Listening..."}
                </p>
              </div>
              {isSaving && (
                <div className="text-xs font-medium text-foreground flex items-center gap-2 bg-background/50 p-2 rounded-lg border border-border">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving & Processing...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className={`flex items-center gap-2 ${dockPosition === 'left' ? 'flex-row-reverse' : 'flex-row'}`}
          animate={{
            x: isDocked && dockPosition === 'right' ? 16 : isDocked && dockPosition === 'left' ? -16 : 0,
            opacity: isDocked ? 0.5 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Drag Handle Indicator */}
          {!isDocked && !isRecording && (
            <div className="p-2 text-muted hover:text-foreground transition-colors opacity-50 hover:opacity-100">
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSaving}
            className={`relative rounded-full flex items-center justify-center bg-black border transition-all duration-500 group touch-none ${
              isDocked 
                ? 'w-3 h-16 rounded-xl border-zinc-800' // Minimal pill shape when docked
                : 'w-16 h-16 border-zinc-800 hover:scale-105 active:scale-95 shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
            } ${
              isRecording ? 'shadow-[0_0_40px_rgba(225,29,72,0.6)] border-rose-900/50' : ''
            } disabled:opacity-50`}
          >
            {/* Inner Details - Hidden when docked */}
            {!isDocked && (
              <>
                <div className="absolute inset-1 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none" />
              </>
            )}

            {/* Core Recording Indicator */}
            <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
              {isSaving ? (
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm border border-zinc-800">
                  <Loader2 className="w-4 h-4 animate-spin text-muted" />
                </div>
              ) : isDocked ? (
                // Minimal indicator when docked
                <div className="w-1 h-8 rounded-full bg-rose-500/30 group-hover:bg-rose-500/80 transition-colors" />
              ) : (
                <div 
                  className={`transition-all duration-500 ease-in-out flex items-center justify-center ${
                    isRecording 
                      ? 'w-8 h-8 rounded-xl bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.8)] scale-90' 
                      : 'w-10 h-10 rounded-full bg-rose-500 group-hover:scale-95 group-hover:bg-rose-600'
                  }`}
                />
              )}
            </div>
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}
