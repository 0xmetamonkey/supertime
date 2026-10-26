'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Send, Sparkles, DollarSign, Clock } from 'lucide-react';

interface PingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUsername: string;
  onSuccess?: () => void;
}

export default function PingModal({
  isOpen,
  onClose,
  targetUsername,
  onSuccess,
}: PingModalProps) {
  const [sessionType, setSessionType] = useState<'free' | 'paid'>('free');
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(15);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSendPing = async () => {
    setSending(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetUsername,
          type: sessionType,
          message: message.trim() || undefined,
          duration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send ping');
      }

      setStatus('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setStatus('idle');
        setMessage('');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 border border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Zap className="w-5 h-5 text-black fill-black" />
              </div>
              <div>
                <h3 className="font-black text-base uppercase tracking-tight text-black dark:text-white">
                  Ping @{targetUsername}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Grab attention for a quick session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          {status === 'success' ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="font-black text-lg text-black dark:text-white uppercase">Ping Sent!</h4>
              <p className="text-xs text-zinc-500 mt-1">@{targetUsername} received your request in realtime.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSessionType('free')}
                  className={`py-2 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    sessionType === 'free'
                      ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm border border-black/10'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Free Sesh
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType('paid')}
                  className={`py-2 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    sessionType === 'paid'
                      ? 'bg-amber-400 text-black font-black shadow-sm border border-black'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" /> Paid Sesh
                </button>
              </div>

              {/* Duration Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Desired Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        duration === mins
                          ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Brief Pitch / Topic
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hey, loved your latest art track! Would love to pick your brain..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white placeholder:text-zinc-400 outline-none focus:border-black dark:focus:border-white resize-none font-medium"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSendPing}
                disabled={sending}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-wider text-xs rounded-xl border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending Ping...' : `Send ${sessionType === 'paid' ? 'Paid' : 'Free'} Ping`}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
