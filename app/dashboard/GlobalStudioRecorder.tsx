'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { Mic, Square, Loader2, Radio, Sparkles, Pause, GripVertical, Play, Activity } from 'lucide-react';
import { useAlertDialog } from '../components/AlertDialog';

export default function GlobalStudioRecorder({ username }: { username: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const { alert: customAlert, AlertDialog } = useAlertDialog();
  
  // Floating & Docking State
  const [isDocked, setIsDocked] = useState(false);
  const [dockPosition, setDockPosition] = useState<'left' | 'right' | 'floating'>('floating');
  const [isPaused, setIsPaused] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef('');
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  // Audio Visualizer Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } 
      });
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
      setIsPaused(false);
      setIsExpanded(true);
      setIsDocked(false);
      setTranscript('');
      transcriptRef.current = '';
      setDuration(0);

      // Setup Audio Visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;
      
      drawVisualizer();

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      startTimer();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      customAlert({
        title: 'Microphone Error',
        message: 'Could not access microphone.',
        variant: 'error',
      });
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
    canvasCtx.clearRect(0, 0, width, height);
    
    const barWidth = (width / dataArrayRef.current.length) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      barHeight = dataArrayRef.current[i] / 2;
      canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
      canvasCtx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth + 1;
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        if (recognitionRef.current) recognitionRef.current.start();
        startTimer();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        if (recognitionRef.current) recognitionRef.current.stop();
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPaused(true);
      }
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setIsPaused(false);
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

      let finalTranscript = transcriptRef.current;
      let postTitle = `Studio Recording ${new Date().toLocaleDateString()}`;
      let postSummary = "No transcription available.";

      try {
        const transcribeFormData = new FormData();
        transcribeFormData.append('file', audioBlob, 'audio.webm');
        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          body: transcribeFormData
        });
        if (transcribeRes.ok) {
          const tData = await transcribeRes.json();
          if (tData.transcript) finalTranscript = tData.transcript;
          if (tData.title) postTitle = tData.title;
          if (tData.summary) postSummary = tData.summary;
          setTranscript(finalTranscript); // update UI just before closing
        }
      } catch (tErr) {
        console.error("Groq transcription failed, falling back to browser transcript", tErr);
        postTitle = finalTranscript ? (finalTranscript.split(' ').slice(0, 5).join(' ') + '...') : postTitle;
        postSummary = finalTranscript || postSummary;
      }

      const postRes = await fetch('/api/user/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          post: {
            id: Date.now().toString(),
            title: postTitle,
            content: `${postSummary}\n\n**Full Transcript:**\n${finalTranscript}`,
            audioUrl: audioUrl,
            isLocked: true,
          }
        })
      });

      if (!postRes.ok) throw new Error("Post creation failed");
      customAlert({
        title: 'Feast Published',
        message: 'Audio Feast Published!',
        variant: 'success',
      });
    } catch (err) {
      console.error("Save error:", err);
      customAlert({
        title: 'Save Failed',
        message: 'Failed to save audio feast.',
        variant: 'error',
      });
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
                  {isPaused ? <Pause className="w-4 h-4 text-amber-500" /> : <Activity className="w-4 h-4 text-rose-500 animate-pulse" />}
                  <span className="text-sm font-semibold text-foreground">{isPaused ? "Paused" : "Studio Active"}</span>
                </div>
                <span className="text-sm font-mono text-muted bg-background/50 px-2 py-0.5 rounded-md border border-border">
                  {formatDuration(duration)}
                </span>
              </div>
              
              <div className="w-full h-10 bg-black/20 rounded-lg overflow-hidden border border-border/50 relative">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={300} height={40} />
              </div>

              <div className="h-16 overflow-y-auto custom-scrollbar">
                <p className="text-xs text-muted italic leading-relaxed">
                  {transcript || (isPaused ? "Recording paused..." : "Listening...")}
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

          {/* Pause/Resume Button */}
          {isRecording && !isDocked && (
            <button
              onClick={togglePause}
              disabled={isSaving}
              className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors shadow-lg active:scale-95 touch-none"
            >
              {isPaused ? <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" /> : <Pause className="w-5 h-5 text-amber-400 fill-amber-400" />}
            </button>
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
      {AlertDialog}
    </>
  );
}
