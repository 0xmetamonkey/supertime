'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Image as ImageIcon, Video, StopCircle, Type, X, Play, Sparkles, Radio, Copy, Check, ArrowRight, Loader2 } from 'lucide-react';

interface MediaBlock {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export default function OmniPad({ 
  isRecording, 
  onToggleRecord 
}: { 
  isRecording: boolean; 
  onToggleRecord: () => void;
}) {
  const [text, setText] = useState('');
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // TalkTime state
  const [isTalkTimeCreating, setIsTalkTimeCreating] = useState(false);
  const [talkTimeRoom, setTalkTimeRoom] = useState<{ roomId: string; inviteUrl: string; hostUrl: string } | null>(null);
  const [talkTimeCopied, setTalkTimeCopied] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const openCamera = async (mode: 'photo' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: mode === 'video' });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Failed to access camera", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const closeCamera = () => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMediaBlocks(prev => [...prev, { id: Math.random().toString(36).substring(7), type, url }]);
  };

  const handleCreateTalkTime = async () => {
    if (isTalkTimeCreating) return;
    setIsTalkTimeCreating(true);
    try {
      const res = await fetch('/api/talktime/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: text.trim() || 'TalkTime' }),
      });
      const data = await res.json();
      if (data.success) {
        setTalkTimeRoom({ roomId: data.roomId, inviteUrl: data.inviteUrl, hostUrl: data.hostUrl });
      } else {
        alert('Could not start TalkTime. Try again.');
      }
    } catch {
      alert('Network error. Try again.');
    } finally {
      setIsTalkTimeCreating(false);
    }
  };

  const copyTalkTimeLink = async () => {
    if (!talkTimeRoom) return;
    try {
      await navigator.clipboard.writeText(talkTimeRoom.inviteUrl);
      setTalkTimeCopied(true);
      setTimeout(() => setTalkTimeCopied(false), 2500);
    } catch {
      alert(talkTimeRoom.inviteUrl);
    }
  };

  return (
    <div className={`relative flex flex-col w-full h-full min-h-[500px] bg-surface/40 backdrop-blur-3xl border rounded-3xl overflow-hidden transition-all duration-500 shadow-2xl ${
      isRecording 
        ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]' 
        : 'border-border'
    }`}>
      
      {/* Background glow when recording */}
      {isRecording && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-red-500/20 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-orange-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full transition-colors ${isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-muted'}`} />
          <span className={`text-sm font-semibold tracking-wider uppercase ${isRecording ? 'text-red-500' : 'text-muted'}`}>
            {isRecording ? 'Capturing Flow' : 'Omni Pad'}
          </span>
        </div>
        
        <button 
          onClick={onToggleRecord}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
            isRecording 
              ? 'bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600/20' 
              : 'bg-foreground text-background hover:bg-foreground/90'
          }`}
        >
          {isRecording ? (
            <><StopCircle className="w-4 h-4" /> Stop Capture</>
          ) : (
            <><Mic className="w-4 h-4" /> Record Time</>
          )}
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-6">
        
        {/* Magic Prompt Area */}
        {text.length === 0 && mediaBlocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
            <div className="flex flex-col items-center gap-4 text-muted">
              <Sparkles className="w-8 h-8 opacity-50" />
              <p className="text-xl font-medium tracking-tight">Capture a thought...</p>
            </div>
          </div>
        )}

        {/* The Writing Pad */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder=""
          className="w-full bg-transparent border-none outline-none resize-none text-foreground text-xl md:text-2xl font-medium leading-relaxed placeholder:text-muted/30 focus:ring-0"
          style={{ minHeight: '60px' }}
        />

        {/* Media Blocks Grid */}
        {mediaBlocks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            <AnimatePresence>
              {mediaBlocks.map((block) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={block.id}
                  className="relative aspect-square md:aspect-video rounded-2xl overflow-hidden group bg-background border border-border shadow-sm"
                >
                  {block.type === 'image' ? (
                    <img src={block.url} alt="Captured" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <video src={block.url} className="w-full h-full object-cover" controls />
                  )}
                  <button 
                    onClick={() => setMediaBlocks(prev => prev.filter(b => b.id !== block.id))}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Toolbar */}
      <div className="relative z-10 p-4 border-t border-border/50 bg-background/50 backdrop-blur-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => openCamera('photo')} className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-all group shadow-sm">
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          
          <label className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-all cursor-pointer group shadow-sm">
            <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* / TalkTime button */}
        <button
          onClick={handleCreateTalkTime}
          disabled={isTalkTimeCreating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-rose-500 text-white text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTalkTimeCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Radio className="w-4 h-4" />
          )}
          / TalkTime
        </button>
      </div>

      {/* TalkTime invite modal */}
      <AnimatePresence>
        {talkTimeRoom && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="absolute inset-4 z-50 bg-background/95 backdrop-blur-3xl border border-violet-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-1/3 -right-1/4 w-2/3 h-2/3 bg-violet-500/10 blur-[100px] rounded-full" />
              <div className="absolute -bottom-1/3 -left-1/4 w-2/3 h-2/3 bg-rose-500/8 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center space-y-7">
              {/* Icon */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30 rounded-3xl flex items-center justify-center shadow-xl">
                  <Radio className="w-10 h-10 text-violet-400" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs font-bold uppercase tracking-widest text-violet-400">TalkTime is ready</span>
                <h3 className="text-2xl font-bold tracking-tight">Your room is live.</h3>
                <p className="text-sm text-muted max-w-xs">Share this link with anyone — no account needed. They&apos;ll join instantly.</p>
              </div>

              {/* Invite URL */}
              <div className="w-full max-w-sm bg-surface/60 border border-border rounded-2xl flex items-center gap-3 px-4 py-3 group">
                <span className="flex-1 text-xs text-muted font-mono truncate text-left">{talkTimeRoom.inviteUrl}</span>
                <button
                  onClick={copyTalkTimeLink}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-surface transition-all text-muted hover:text-foreground"
                >
                  {talkTimeCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button
                  onClick={() => window.location.href = talkTimeRoom.hostUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-bold rounded-2xl text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Join as Host <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTalkTimeRoom(null)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border text-muted rounded-2xl text-sm font-medium hover:bg-background hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Modal overlay */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-4 z-50 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
          >
            <div className="flex-1 relative bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={closeCamera}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-center">
              <button 
                onClick={takePhoto}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 bg-white rounded-full" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
