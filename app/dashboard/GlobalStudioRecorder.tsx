'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, Radio, Sparkles, Pause } from 'lucide-react';

export default function GlobalStudioRecorder({ username }: { username: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef('');

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
    // Stop all tracks to release the mic
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
      // 1. Upload Audio Blob
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

      // 2. Create Feast Post
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
            isLocked: true, // Default to locked for extended minutes logic
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

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-surface border border-border shadow-2xl rounded-2xl p-4 w-72 lg:w-80 flex flex-col gap-3 backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-foreground">Studio Active</span>
              </div>
              <span className="text-sm font-mono text-muted bg-background px-2 py-0.5 rounded-md border border-border">
                {formatDuration(duration)}
              </span>
            </div>
            <div className="h-24 overflow-y-auto custom-scrollbar">
              <p className="text-xs text-muted italic leading-relaxed">
                {transcript || "Listening..."}
              </p>
            </div>
            {isSaving && (
              <div className="text-xs font-medium text-foreground flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving & Processing...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isSaving}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center bg-black border border-zinc-800 transition-all duration-500 hover:scale-105 active:scale-95 disabled:opacity-50 group ${
          isRecording ? 'shadow-[0_0_40px_rgba(225,29,72,0.6)] border-rose-900/50' : 'shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
        }`}
      >
        {/* Subtle Inner Details */}
        <div className="absolute inset-1 rounded-full border border-white/5" />
        <div className="absolute inset-2 rounded-full border border-white/5" />

        {/* Center Core */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {isSaving ? (
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm border border-zinc-800">
              <Loader2 className="w-4 h-4 animate-spin text-muted" />
            </div>
          ) : (
            <div 
              className={`transition-all duration-500 ease-in-out flex items-center justify-center ${
                isRecording 
                  ? 'w-8 h-8 rounded-xl bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.8)] scale-90' 
                  : 'w-10 h-10 rounded-full bg-rose-500 group-hover:scale-95 group-hover:bg-rose-600'
              }`}
            >
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
