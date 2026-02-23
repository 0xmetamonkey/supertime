'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Video,
  Mic,
  Globe,
  Check,
  ArrowRight,
  Camera,
  Bell,
  Heart,
  Instagram,
  Youtube,
  CloudLightning,
  User,
  ShieldCheck
} from 'lucide-react';
import { claimUsername } from '../actions';
import { requestForToken } from '../lib/firebase';

interface OnboardingFlowProps {
  initialEmail: string;
}

export function OnboardingFlow({ initialEmail }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Handle
  const [username, setUsername] = useState('');

  // Step 2: Profile
  const [profileImage, setProfileImage] = useState('');
  const [videoRate, setVideoRate] = useState(100);
  const [audioRate, setAudioRate] = useState(50);
  const [isUploading, setIsUploading] = useState(false);

  // Step 3: Room & Notifications
  const [roomType, setRoomType] = useState<'video' | 'audio'>('video');
  const [pushStatus, setPushStatus] = useState<NotificationPermission | 'not-supported'>('default');

  // Step 4: Socials
  const [socials, setSocials] = useState({
    instagram: '',
    x: '',
    youtube: '',
    website: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    } else {
      setPushStatus('not-supported');
    }
  }, []);

  const handleClaim = async () => {
    if (!username) return;
    setLoading(true);
    setError('');
    try {
      await claimUsername(username);
      setStep(2);
    } catch (e: any) {
      setError(e.message || 'Failed to claim username');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    setIsUploading(true);
    const file = event.target.files[0];
    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, { method: 'POST', body: file });
      const newBlob = await response.json();
      setProfileImage(newBlob.url);
    } catch (e) {
      setError("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPushStatus(result);
    if (result === 'granted') {
      const token = await requestForToken();
      if (token) {
        await fetch('/api/user/push-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileImage,
          videoRate,
          audioRate,
          roomType,
          socials,
          isAcceptingCalls: true
        }),
      });
      router.push('/studio');
    } catch (e) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neo-pink selection:text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* PROGRESS BAR */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-neo-pink' : 'bg-white/10'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1: CLAIM HANDLE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">First, your handle.</h1>
                <p className="text-zinc-500 font-medium">This is how people will find your shop.</p>
              </div>

              <div className="space-y-4">
                <div className="group flex items-center bg-zinc-900 border-4 border-white/5 focus-within:border-neo-pink transition-all p-2 pl-6 rounded-2xl">
                  <span className="text-zinc-500 font-mono text-lg select-none">supertime.wtf/</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="flex-1 bg-transparent border-none outline-none text-white font-black text-xl h-14 ml-1"
                    autoFocus
                  />
                </div>
                {error && <p className="text-neo-pink font-bold text-sm px-2 animate-bounce">{error}</p>}
              </div>

              <button
                disabled={!username || loading}
                onClick={handleClaim}
                className="w-full py-6 bg-white text-black font-black uppercase text-xl rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                {loading ? 'Claiming...' : 'Claim Handle'}
                <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: PROFILE & RATES */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">Style & Value.</h1>
                <p className="text-zinc-500 font-medium">Set your vibe and your rates.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
                <div className="relative group mx-auto md:mx-0">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border-4 border-white/10 overflow-hidden flex items-center justify-center relative">
                    {profileImage ? (
                      <img src={profileImage} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-zinc-700" />
                    )}
                    {isUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-pulse"><Zap className="w-6 h-6 text-neo-pink" /></div>}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-all shadow-xl">
                    <Camera className="w-5 h-5" />
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="bg-zinc-900/50 border-4 border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neo-pink flex items-center justify-center shrink-0"><Video className="w-6 h-6 text-white" /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-zinc-500">Video Rate / MIN</p>
                      <input
                        type="number"
                        value={videoRate}
                        onChange={e => setVideoRate(Number(e.target.value))}
                        className="w-full bg-transparent border-none outline-none text-2xl font-black"
                      />
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 border-4 border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neo-blue flex items-center justify-center shrink-0"><Mic className="w-6 h-6 text-white" /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-zinc-500">Audio Rate / MIN</p>
                      <input
                        type="number"
                        value={audioRate}
                        onChange={e => setAudioRate(Number(e.target.value))}
                        className="w-full bg-transparent border-none outline-none text-2xl font-black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                className="w-full py-6 bg-white text-black font-black uppercase text-xl rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Continue
                <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* STEP 3: ROOM & NOTIFICATIONS (FORCE RING) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">Call Setup.</h1>
                <p className="text-zinc-500 font-medium">Enable "Force Ring" to never miss a call.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-zinc-900/50 border-4 border-white/5 rounded-3xl p-6">
                  <h3 className="text-xs font-black uppercase text-zinc-500 mb-4 tracking-widest">Default Room Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setRoomType('video')}
                      className={`py-8 rounded-2xl border-4 transition-all flex flex-col items-center gap-3 ${roomType === 'video' ? 'bg-neo-pink border-white shadow-[0_0_40px_rgba(236,72,153,0.3)]' : 'bg-zinc-800/50 border-transparent hover:bg-zinc-800'}`}
                    >
                      <Video className="w-8 h-8" />
                      <span className="text-sm font-black uppercase tracking-tighter">Video</span>
                    </button>
                    <button
                      onClick={() => setRoomType('audio')}
                      className={`py-8 rounded-2xl border-4 transition-all flex flex-col items-center gap-3 ${roomType === 'audio' ? 'bg-neo-blue border-white shadow-[0_0_40px_rgba(59,130,246,0.3)]' : 'bg-zinc-800/50 border-transparent hover:bg-zinc-800'}`}
                    >
                      <Mic className="w-8 h-8" />
                      <span className="text-sm font-black uppercase tracking-tighter">Audio</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`border-4 rounded-3xl p-8 flex flex-col items-center text-center gap-4 transition-all duration-700 ${pushStatus === 'granted' ? 'bg-neo-green/10 border-neo-green' : 'bg-blue-500/5 border-blue-500/20'}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${pushStatus === 'granted' ? 'bg-neo-green text-black' : 'bg-blue-500 text-white animate-pulse'}`}>
                    {pushStatus === 'granted' ? <ShieldCheck className="w-10 h-10" /> : <Bell className="w-10 h-10" />}
                  </div>
                  {pushStatus === 'granted' ? (
                    <>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Force Ring Active!</h3>
                      <p className="text-zinc-500 text-xs font-bold leading-relaxed">Your phone will now "ring" even if the browser is closed. You're ready to take elite calls.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Enable Force Ring</h3>
                      <p className="text-zinc-500 text-xs font-bold leading-relaxed">Standard browsers block background alerts. Enable Force Ring to stay online 24/7.</p>
                      <button
                        onClick={handleEnableNotifications}
                        className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs px-8 py-4 rounded-xl transition-all shadow-lg"
                      >
                        Activate Now
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="w-20 py-6 bg-zinc-900 text-white border-2 border-white/10 rounded-2xl hover:bg-zinc-800">Back</button>
                <button
                  onClick={nextStep}
                  className="flex-1 py-6 bg-white text-black font-black uppercase text-xl rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Continue
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SOCIALS */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">Connect.</h1>
                <p className="text-zinc-500 font-medium">Link your empire to your profile.</p>
              </div>

              <div className="grid gap-4">
                <div className="bg-zinc-900 border-4 border-white/5 rounded-2xl p-4 flex items-center focus-within:border-neo-pink transition-all">
                  <Instagram className="w-6 h-6 text-neo-pink mr-4" />
                  <input
                    type="text"
                    value={socials.instagram}
                    onChange={e => setSocials({ ...socials, instagram: e.target.value })}
                    placeholder="Instagram Handle"
                    className="flex-1 bg-transparent border-none outline-none font-bold text-lg uppercase"
                  />
                </div>
                <div className="bg-zinc-900 border-4 border-white/5 rounded-2xl p-4 flex items-center focus-within:border-neo-blue transition-all">
                  <CloudLightning className="w-6 h-6 text-white mr-4" />
                  <input
                    type="text"
                    value={socials.x}
                    onChange={e => setSocials({ ...socials, x: e.target.value })}
                    placeholder="X / Twitter Handle"
                    className="flex-1 bg-transparent border-none outline-none font-bold text-lg uppercase"
                  />
                </div>
                <div className="bg-zinc-900 border-4 border-white/5 rounded-2xl p-4 flex items-center focus-within:border-red-500 transition-all">
                  <Youtube className="w-6 h-6 text-red-500 mr-4" />
                  <input
                    type="text"
                    value={socials.youtube}
                    onChange={e => setSocials({ ...socials, youtube: e.target.value })}
                    placeholder="YouTube Channel"
                    className="flex-1 bg-transparent border-none outline-none font-bold text-lg uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="w-20 py-6 bg-zinc-900 text-white border-2 border-white/10 rounded-2xl hover:bg-zinc-800">Back</button>
                <button
                  disabled={loading}
                  onClick={handleComplete}
                  className="flex-1 py-6 bg-neo-green text-black font-black uppercase text-xl rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(34,197,94,0.2)]"
                >
                  {loading ? 'Finalizing...' : 'Enter Studio'}
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* LOGOUT / RESTART */}
        <div className="mt-20 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-neo-green animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{initialEmail}</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-[10px] font-black uppercase text-zinc-700 hover:text-neo-pink transition-colors tracking-widest"
          >
            ← Cancel & Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
