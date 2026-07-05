'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Image as ImageIcon, X, Sparkles, Type, Send, Loader2
} from 'lucide-react';

interface MediaBlock {
  id: string;
  type: 'image' | 'video';
  url: string;
  from?: string;
}

interface SharedOmniPadProps {
  roomId: string;
  participantName: string;
  isHost: boolean;
  // Ably publish/subscribe injected from parent
  publish: (channelName: string, eventName: string, data: any) => Promise<void>;
  subscribe: (channelName: string, callback: (msg: any) => void) => () => void;
}

const PAD_CHANNEL = (roomId: string) => `talktime-pad:${roomId}`;

export default function SharedOmniPad({
  roomId,
  participantName,
  isHost,
  publish,
  subscribe,
}: SharedOmniPadProps) {
  const [text, setText] = useState('');
  const [remoteText, setRemoteText] = useState('');
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channel = PAD_CHANNEL(roomId);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  // Subscribe to pad events from the other participant
  useEffect(() => {
    const unsubscribe = subscribe(channel, (message: any) => {
      const { name, data } = message;

      if (data?.from === participantName) return; // ignore own echoes

      if (name === 'pad:update') {
        setRemoteText(data.text ?? '');
      }

      if (name === 'pad:typing') {
        setPeerTyping(true);
        if (peerTypingTimeoutRef.current) clearTimeout(peerTypingTimeoutRef.current);
        peerTypingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 2000);
      }

      if (name === 'pad:media') {
        const block: MediaBlock = {
          id: data.id,
          type: data.mediaType,
          url: data.url,
          from: data.from,
        };
        setMediaBlocks(prev => {
          if (prev.find(b => b.id === block.id)) return prev;
          return [...prev, block];
        });
      }

      if (name === 'pad:media:remove') {
        setMediaBlocks(prev => prev.filter(b => b.id !== data.id));
      }
    });
    return unsubscribe;
  }, [channel, participantName, subscribe]);

  // Debounced publish on text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Publish typing indicator immediately
    publish(channel, 'pad:typing', { from: participantName }).catch(() => {});

    // Debounce actual content publish by 300ms
    if (publishTimeoutRef.current) clearTimeout(publishTimeoutRef.current);
    publishTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await publish(channel, 'pad:update', { text: val, from: participantName });
      } catch {}
      setIsSyncing(false);
    }, 300);
  };

  // Camera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
    } catch {
      alert('Could not access camera. Please check permissions.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const url = canvas.toDataURL('image/png');
    const block: MediaBlock = { id: crypto.randomUUID(), type: 'image', url, from: participantName };
    setMediaBlocks(prev => [...prev, block]);
    publish(channel, 'pad:media', { ...block, mediaType: 'image' }).catch(() => {});
    closeCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const block: MediaBlock = { id: crypto.randomUUID(), type, url, from: participantName };
      setMediaBlocks(prev => [...prev, block]);
      // Only broadcast images (videos can be large; for now local only)
      if (type === 'image') {
        publish(channel, 'pad:media', { ...block, mediaType: type }).catch(() => {});
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeBlock = (id: string) => {
    setMediaBlocks(prev => prev.filter(b => b.id !== id));
    publish(channel, 'pad:media:remove', { id, from: participantName }).catch(() => {});
  };

  const isEmpty = text.length === 0 && remoteText.length === 0 && mediaBlocks.length === 0;

  return (
    <div className="relative flex flex-col w-full h-full bg-surface/30 backdrop-blur-2xl border border-border/60 rounded-3xl overflow-hidden shadow-xl">

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-2/3 h-2/3 bg-violet-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/4 -left-1/4 w-2/3 h-2/3 bg-rose-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-5 py-3 border-b border-border/50 bg-background/30 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          <span className="text-xs font-semibold tracking-widest uppercase text-violet-400">Shared Pad</span>
        </div>
        <div className="flex items-center gap-2">
          {peerTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full"
            >
              <span className="text-[10px] font-medium text-violet-400">typing...</span>
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          {isSyncing && <Loader2 className="w-3.5 h-3.5 text-muted animate-spin" />}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar space-y-4">

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-muted opacity-40">
              <Sparkles className="w-7 h-7" />
              <p className="text-base font-medium tracking-tight">Write together...</p>
            </div>
          </div>
        )}

        {/* Your text — left aligned */}
        {text.length > 0 && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-muted mb-1 mr-1">{participantName} (you)</span>
            <div className="max-w-[90%] bg-foreground/8 border border-border/60 rounded-2xl rounded-tr-sm px-4 py-3">
              <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap break-words">{text}</p>
            </div>
          </div>
        )}

        {/* Remote text — right aligned style */}
        {remoteText.length > 0 && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-medium text-violet-400 mb-1 ml-1">Guest</span>
            <div className="max-w-[90%] bg-violet-500/10 border border-violet-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap break-words">{remoteText}</p>
            </div>
          </div>
        )}

        {/* Media grid */}
        {mediaBlocks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <AnimatePresence>
              {mediaBlocks.map(block => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-square rounded-xl overflow-hidden group bg-background border border-border shadow-sm"
                >
                  {block.from && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full">
                      <span className="text-[9px] font-medium text-white">{block.from}</span>
                    </div>
                  )}
                  {block.type === 'image' ? (
                    <img src={block.url} alt="Pad media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <video src={block.url} className="w-full h-full object-cover" controls />
                  )}
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Writing input */}
      <div className="relative z-10 px-5 py-3 border-t border-border/30">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="Write a thought, a question, a note..."
          className="w-full bg-transparent border-none outline-none resize-none text-foreground text-base leading-relaxed placeholder:text-muted/40 focus:ring-0"
          style={{ minHeight: '44px', maxHeight: '120px' }}
          rows={1}
        />
      </div>

      {/* Toolbar */}
      <div className="relative z-10 px-4 pb-4 flex items-center gap-2">
        <button
          onClick={openCamera}
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-all group shadow-sm"
          title="Take a photo"
        >
          <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
        <label className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-all cursor-pointer group shadow-sm" title="Upload media">
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Camera modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-3 z-50 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
          >
            <div className="flex-1 relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <button onClick={closeCamera} className="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 bg-black/90 flex justify-center">
              <button onClick={takePhoto} className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-white rounded-full" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
