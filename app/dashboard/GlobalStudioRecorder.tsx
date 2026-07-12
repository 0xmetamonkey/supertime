'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, Camera, Image as ImageIcon, X, Send, ChevronDown, Sparkles, Pause, Play } from 'lucide-react';

interface MediaBlock {
  id: string;
  type: 'image' | 'video';
  url: string;
}
import { useAlertDialog } from '../components/AlertDialog';

export default function GlobalStudioRecorder({ username }: { username: string }) {
  // Pad States
  const [isExpanded, setIsExpanded] = useState(false);
  const { alert: customAlert, AlertDialog } = useAlertDialog();
  const [draftText, setDraftText] = useState('');
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for stale closures in event listeners
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
  }, [isRecording, isPaused]);

  // Speech Recognition
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const textBeforeRecordingRef = useRef('');

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraChunksRef = useRef<BlobPart[]>([]);

  // Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draftText, isExpanded, interimTranscript]);

  // Init Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            setDraftText(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + final.trim() + ' ');
          }
          setInterimTranscript(interim);
        };

        recognition.onerror = (e: any) => {
          console.error("Speech recognition error:", e.error);
        };

        recognition.onend = () => {
          if (isRecordingRef.current && !isPausedRef.current) {
            try { recognition.start(); } catch (e) { }
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Esc Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      closeCamera();
    };
  }, []);

  // Fix: Attach stream to video element when it becomes available
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  // -- Camera Functions --
  const openCamera = async () => {
    try {
      // Request both video and audio so we can record video clips with sound
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      alert("Could not access camera.");
    }
  };

  const closeCamera = () => {
    if (isVideoRecording) {
      stopVideoRecording();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/png');
      setMediaBlocks(prev => [...prev, { id: Math.random().toString(36).substring(7), type: 'image', url }]);
      closeCamera();
    }
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;
    cameraChunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    cameraRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) cameraChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'video/webm';
      const blob = new Blob(cameraChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setMediaBlocks(prev => [...prev, { id: Math.random().toString(36).substring(7), type: 'video', url }]);
      closeCamera();
    };

    recorder.start(1000);
    setIsVideoRecording(true);
  };

  const stopVideoRecording = () => {
    if (cameraRecorderRef.current && cameraRecorderRef.current.state !== 'inactive') {
      cameraRecorderRef.current.stop();
    }
    setIsVideoRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMediaBlocks(prev => [...prev, { id: Math.random().toString(36).substring(7), type, url }]);
  };

  // -- Background Audio Recording Functions --
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true }
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      textBeforeRecordingRef.current = draftText;

      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {
          console.error("Failed to start speech recognition", e);
        }
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
      customAlert({
        title: 'Microphone Error',
        message: 'Could not access microphone.',
        variant: 'error',
      });
    }
  };

  // const drawVisualizer = () => {
  //   if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
  //   animationFrameRef.current = requestAnimationFrame(drawVisualizer);

  //   const canvas = canvasRef.current;
  //   const canvasCtx = canvas.getContext('2d');
  //   if (!canvasCtx) return;

  //   const width = canvas.width;
  //   const height = canvas.height;

  //   analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
  //   canvasCtx.clearRect(0, 0, width, height);

  //   const barWidth = (width / dataArrayRef.current.length) * 2.5;
  //   let barHeight;
  //   let x = 0;

  //   for (let i = 0; i < dataArrayRef.current.length; i++) {
  //     barHeight = dataArrayRef.current[i] / 2;
  //     canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
  //     canvasCtx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);
  //     x += barWidth + 1;
  //   }
  // };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // setDuration(prev => prev + 1);
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
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsRecording(false);
    setIsPaused(false);
    setInterimTranscript('');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(true);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    setIsPaused(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) { }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // -- Publish --
  const handlePublish = async () => {
    if (!draftText && mediaBlocks.length === 0 && (!isRecording && audioChunksRef.current.length === 0)) {
      setIsExpanded(false);
      return;
    }

    setIsSaving(true);
    let finalAudioUrl = "";
    let finalDraftText = draftText;

    try {
      if (isRecording || audioChunksRef.current.length > 0) {
        stopRecording();
        await new Promise(r => setTimeout(r, 200));

        if (audioChunksRef.current.length > 0) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mp3') ? 'mp3' : 'webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          const filename = `flow_audio_${Date.now()}.${extension}`;
          const uploadRes = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: audioBlob });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalAudioUrl = uploadData.url;
          }

          // Groq Finalization (Hybrid Method)
          try {
            const groqFormData = new FormData();
            groqFormData.append('file', audioBlob, 'audio.' + extension);
            const groqRes = await fetch('/api/transcribe', {
              method: 'POST',
              body: groqFormData
            });
            if (groqRes.ok) {
              const groqData = await groqRes.json();
              if (groqData.transcript) {
                // Completely replace the spoken part with the perfectly punctuated Groq transcript
                finalDraftText = textBeforeRecordingRef.current + (textBeforeRecordingRef.current ? '\n\n' : '') + groqData.transcript;
              }
            }
          } catch (e) {
            console.error("Groq Transcribe failed", e);
          }
        }
      }

      // Process and upload Media Blocks
      let mediaMarkdown = "";
      if (mediaBlocks.length > 0) {
        for (const block of mediaBlocks) {
          try {
            const res = await fetch(block.url);
            const blob = await res.blob();
            const extension = block.type === 'video' ? 'webm' : 'png';
            const filename = `flow_media_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

            const uploadRes = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: blob });
            if (uploadRes.ok) {
              const data = await uploadRes.json();
              if (block.type === 'image') {
                mediaMarkdown += `\n\n![Image](${data.url})`;
              } else {
                mediaMarkdown += `\n\n<video src="${data.url}" controls controlsList="nodownload" playsinline style="max-width:100%; border-radius:12px;"></video>`;
              }
            }
          } catch (e) {
            console.error("Failed to upload media block", e);
          }
        }
      }

      const postTitle = finalDraftText ? finalDraftText.split(' ').slice(0, 5).join(' ') + '...' : `Flow ${new Date().toLocaleDateString()}`;
      const finalContent = finalDraftText + mediaMarkdown;

      const postRes = await fetch('/api/user/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          post: {
            id: Date.now().toString(),
            title: postTitle,
            content: finalContent,
            audioUrl: finalAudioUrl,
            isLocked: false,
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
    }
  };

  return (
    <>
      {/* Immersive Frictionless Canvas */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col justify-between overflow-hidden"
            onTouchStart={(e) => {
              (window as any).touchStartY = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const touchEndY = e.changedTouches[0].clientY;
              const startY = (window as any).touchStartY || 0;
              if (touchEndY - startY > 150) setIsExpanded(false);
            }}
          >
            {/* Edge Glow for Background Audio Recording Time */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 120px rgba(225,29,72,0.15)' }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,1)] animate-pulse" />
              </motion.div>
            )}

            {/* Main Typographic Area */}
            <div className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-12 pt-32 pb-40 overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
              <div className="relative w-full">
                <textarea
                  ref={textareaRef}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Flow..."
                  autoFocus
                  className="w-full bg-transparent border-none outline-none resize-none text-white/90 placeholder:text-white/20 text-3xl md:text-5xl lg:text-6xl font-medium leading-tight tracking-tight focus:ring-0"
                  style={{ minHeight: '60px' }}
                />
                {interimTranscript && (
                  <div className="mt-2 text-white/40 text-3xl md:text-5xl lg:text-6xl font-medium leading-tight tracking-tight">
                    {interimTranscript}
                  </div>
                )}
              </div>

              {/* Inline Media Gallery */}
              {mediaBlocks.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-12">
                  <AnimatePresence>
                    {mediaBlocks.map((block) => (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-3xl overflow-hidden shadow-2xl max-w-sm border border-white/10"
                      >
                        {block.type === 'image' ? (
                          <img src={block.url} className="w-full h-auto object-cover" />
                        ) : (
                          <video src={block.url} controls controlsList="nodownload" className="w-full h-auto object-cover" />
                        )}
                        <button
                          onClick={() => setMediaBlocks(prev => prev.filter(b => b.id !== block.id))}
                          className="absolute top-4 right-4 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Sleek Minimalistic Dock */}
            <motion.div
              initial={{ y: 50, opacity: 0, x: '-50%' }}
              animate={{ y: 0, opacity: 1, x: '-50%' }}
              exit={{ y: 50, opacity: 0, x: '-50%' }}
              transition={{ delay: 0.1, type: "spring", damping: 25 }}
              className="absolute bottom-8 left-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl"
            >
              {/* Media Tools */}
              <button onClick={openCamera} className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
              <label className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
              </label>

              {/* Background Audio Flow (Mic) */}
              {isRecording && (
                <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-white font-medium text-sm tabular-nums mr-1">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
                  {formatTime(recordingTime)}
                </div>
              )}

              {isRecording && (
                <button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                </button>
              )}

              <button
                onClick={toggleRecording}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording
                  ? 'bg-rose-500/20 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
              >
                {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
              </button>

              <div className="w-px h-6 bg-white/10 mx-2" />

              {/* Actions */}
              <button onClick={() => setIsExpanded(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onClick={handlePublish}
                disabled={isSaving || (!draftText && mediaBlocks.length === 0 && !isRecording && audioChunksRef.current.length === 0)}
                className="px-5 h-10 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-30 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </motion.div>

            {/* Immersive Camera Overlay (Photo + Video) */}
            <AnimatePresence>
              {isCameraOpen && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[300] bg-black flex flex-col"
                >
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                  {/* Camera Header Actions */}
                  <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                    {isVideoRecording && (
                      <div className="flex items-center gap-2 bg-red-500/20 text-red-500 px-3 py-1.5 rounded-full backdrop-blur-md border border-red-500/50">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-semibold tracking-wide">REC</span>
                      </div>
                    )}
                    <button onClick={closeCamera} className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all ml-auto">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Shutter Buttons */}
                  <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12">
                    {/* Photo Shutter */}
                    {!isVideoRecording && (
                      <div className="flex flex-col items-center gap-3">
                        <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group">
                          <div className="w-16 h-16 bg-white rounded-full group-hover:bg-white/90 transition-colors" />
                        </button>
                        <span className="text-white/60 text-xs font-medium tracking-widest uppercase">Photo</span>
                      </div>
                    )}

                    {/* Video Shutter */}
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={isVideoRecording ? stopVideoRecording : startVideoRecording}
                        className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-95 group ${isVideoRecording ? 'border-red-500' : 'border-rose-500/80 hover:scale-105'}`}
                      >
                        <div className={`transition-all rounded-full ${isVideoRecording ? 'w-8 h-8 bg-red-500 rounded-lg' : 'w-16 h-16 bg-rose-500 group-hover:bg-rose-500/90'}`} />
                      </button>
                      <span className={`${isVideoRecording ? 'text-red-500' : 'text-rose-500/80'} text-xs font-medium tracking-widest uppercase`}>
                        {isVideoRecording ? 'Stop' : 'Video'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Floating Red Button (Trigger) */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-rose-500 flex items-center justify-center shadow-[0_8px_30px_rgba(225,29,72,0.4)] transition-shadow group"
          >
            {/* Inner Ring */}
            <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none group-hover:border-white/40 transition-colors" />

            {/* Indicator */}
            {(draftText || mediaBlocks.length > 0 || isRecording) ? (
              <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 text-white/90" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
      {AlertDialog}
    </>
  );
}
