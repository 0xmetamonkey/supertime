'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Video,
  Mic,
  Globe,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageSquare,
  GripVertical,
  Save,
  Check,
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface SettingsClientProps {
  username: string;
  initialSettings: {
    videoRate: number;
    audioRate: number;
    socials: { instagram: string; x: string; youtube: string; website: string };
    profileImage: string;
    templates: any[];
    faqs: FAQ[];
    roomType: 'audio' | 'video';
    isRoomFree: boolean;
  };
}

export default function SettingsClient({ username, initialSettings }: SettingsClientProps) {
  const router = useRouter();

  // Existing settings state
  const [pendingVideoRate, setPendingVideoRate] = useState(initialSettings.videoRate);
  const [pendingAudioRate, setPendingAudioRate] = useState(initialSettings.audioRate);
  const [pendingSocials, setPendingSocials] = useState(initialSettings.socials);
  const [pendingProfileImage, setPendingProfileImage] = useState(initialSettings.profileImage || '');
  const [pendingTemplates, setPendingTemplates] = useState<any[]>(initialSettings.templates || []);
  const [roomType, setRoomType] = useState<'audio' | 'video'>(initialSettings.roomType || 'audio');
  const [isRoomFree, setIsRoomFree] = useState<boolean>(initialSettings.isRoomFree ?? true);
  const [isUploading, setIsUploading] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>(initialSettings.faqs || []);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [showAddFaq, setShowAddFaq] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active section for mobile accordion
  const [activeSection, setActiveSection] = useState<string | null>('identity');

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setIsUploading(true);
    const file = event.target.files[0];
    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, { method: 'POST', body: file });
      const newBlob = await response.json();
      setPendingProfileImage(newBlob.url);
    } catch (e) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const newFaq: FAQ = {
      id: Math.random().toString(36).slice(2, 9),
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
    };
    setFaqs([...faqs, newFaq]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setShowAddFaq(false);
  };

  const handleUpdateFaq = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
    if (editingFaqId === id) setEditingFaqId(null);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        body: JSON.stringify({
          socials: pendingSocials,
          videoRate: pendingVideoRate,
          audioRate: pendingAudioRate,
          profileImage: pendingProfileImage,
          templates: pendingTemplates,
          faqs,
          roomType,
          isRoomFree,
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const SectionHeader = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children?: React.ReactNode }) => (
    <div className="border-b-4 border-black pb-2 mb-6">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-black uppercase tracking-tighter">{title}</h3>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-black font-sans selection:bg-neo-pink selection:text-white">
      {/* HEADER */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-black py-4">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/studio')}
              className="w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-pink transition-colors active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Studio Config</h1>
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">@{username}</p>
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-3 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 ${saveSuccess ? 'bg-neo-green text-black' : 'bg-neo-pink text-white hover:bg-neo-pink/90'}`}
          >
            {saveSuccess ? <><Check className="w-4 h-4" /> SAVED</> : isSaving ? 'SAVING...' : <><Save className="w-4 h-4" /> SAVE ALL</>}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ROW 1: Identity + Room Config */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* CORE IDENTITY */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <SectionHeader id="identity" title="Core Identity" icon={<Zap className="w-5 h-5" />} />
            <div className="flex items-center gap-6 p-4 bg-zinc-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-20 h-20 border-2 border-black bg-white overflow-hidden shrink-0">
                {pendingProfileImage ? (
                  <img src={pendingProfileImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black italic text-2xl">?</div>
                )}
              </div>
              <div className="space-y-2">
                {isUploading ? (
                  <span className="text-[10px] font-black uppercase text-neo-pink animate-pulse">Uploading...</span>
                ) : (
                  <label className="neo-btn bg-black text-white text-[10px] px-4 py-2 cursor-pointer inline-block">
                    CHANGE PHOTO
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                )}
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Max 5MB · JPG, PNG, WebP</p>
              </div>
            </div>
          </div>

          {/* ROOM CONFIGURATION */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <SectionHeader id="room" title="Room Config" icon={<Globe className="w-5 h-5" />} />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRoomType('audio')}
                  className={`flex items-center justify-center gap-2 p-4 border-4 border-black font-black uppercase text-xs transition-all ${roomType === 'audio' ? 'bg-neo-blue text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  <Mic className="w-4 h-4" /> Audio Room
                </button>
                <button
                  onClick={() => setRoomType('video')}
                  className={`flex items-center justify-center gap-2 p-4 border-4 border-black font-black uppercase text-xs transition-all ${roomType === 'video' ? 'bg-neo-pink text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  <Video className="w-4 h-4" /> Video Room
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <p className="text-[10px] font-black uppercase">Monetization</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{isRoomFree ? 'Everyone can join for free' : 'Joining requires payment'}</p>
                </div>
                <button
                  onClick={() => setIsRoomFree(!isRoomFree)}
                  className={`px-4 py-2 border-2 border-black font-black uppercase text-[10px] transition-colors ${isRoomFree ? 'bg-neo-green' : 'bg-neo-yellow'}`}
                >
                  {isRoomFree ? 'FREE' : 'PAID'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Rates + Socials */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* ENERGY MATRIX (RATES) */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <SectionHeader id="rates" title="Energy Matrix (Rates)" icon={<Zap className="w-5 h-5 text-neo-yellow fill-neo-yellow" />} />
            <div className="grid gap-4">
              <div className="flex items-center bg-white border-4 border-black focus-within:bg-neo-yellow/10 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-12 h-12 border-r-4 border-black bg-neo-pink flex items-center justify-center text-white shrink-0"><Video className="w-5 h-5" /></div>
                <div className="flex-1 px-4">
                  <label className="text-[8px] font-black uppercase text-zinc-400 block pb-1">Video Call / MIN</label>
                  <input type="number" value={pendingVideoRate} onChange={(e) => setPendingVideoRate(Number(e.target.value))} className="w-full bg-transparent border-none outline-none font-black text-lg" />
                </div>
              </div>
              <div className="flex items-center bg-white border-4 border-black focus-within:bg-neo-yellow/10 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-12 h-12 border-r-4 border-black bg-neo-blue flex items-center justify-center text-white shrink-0"><Mic className="w-5 h-5" /></div>
                <div className="flex-1 px-4">
                  <label className="text-[8px] font-black uppercase text-zinc-400 block pb-1">Audio Only / MIN</label>
                  <input type="number" value={pendingAudioRate} onChange={(e) => setPendingAudioRate(Number(e.target.value))} className="w-full bg-transparent border-none outline-none font-black text-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* SOCIAL MATRIX */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <SectionHeader id="socials" title="Social Matrix" icon={<Globe className="w-5 h-5" />} />
            <div className="grid gap-3">
              {['instagram', 'x', 'youtube', 'website'].map((platform) => (
                <div key={platform} className="bg-zinc-50 border-4 border-black p-3 focus-within:bg-neo-yellow/10 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center">
                  <Globe className="w-4 h-4 mr-3 text-zinc-300" />
                  <input
                    type="text"
                    value={(pendingSocials as any)[platform]}
                    onChange={(e) => setPendingSocials({ ...pendingSocials, [platform]: e.target.value })}
                    className="bg-transparent border-none outline-none font-bold text-xs flex-1 uppercase tracking-tighter"
                    placeholder={`${platform} handle or URL`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: Fixed Offerings (Templates) */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <SectionHeader id="templates" title="Fixed Offerings" icon={<Zap className="w-5 h-5" />}>
            <div className="flex-1" />
            <button
              onClick={() => setPendingTemplates([...pendingTemplates, { id: Math.random().toString(36).slice(2, 7), duration: 20, price: 150, description: 'Strategy Session', type: 'video' }])}
              className="bg-black text-white text-[9px] font-black px-3 py-1.5 hover:bg-neo-pink transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> ADD NEW
            </button>
          </SectionHeader>
          <div className="grid md:grid-cols-2 gap-4">
            {pendingTemplates.map((tpl, idx) => (
              <div key={tpl.id} className="neo-box bg-white p-4 relative group">
                <button onClick={() => setPendingTemplates(pendingTemplates.filter(t => t.id !== tpl.id))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-zinc-50 border-2 border-black p-2">
                    <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Duration (Min)</label>
                    <input type="number" value={tpl.duration} onChange={(e) => { const n = [...pendingTemplates]; n[idx].duration = Number(e.target.value); setPendingTemplates(n); }} className="w-full bg-transparent border-none outline-none font-black text-xs" />
                  </div>
                  <div className="bg-zinc-50 border-2 border-black p-2">
                    <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Price (TKN)</label>
                    <input type="number" value={tpl.price} onChange={(e) => { const n = [...pendingTemplates]; n[idx].price = Number(e.target.value); setPendingTemplates(n); }} className="w-full bg-transparent border-none outline-none font-black text-xs" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select value={tpl.type} onChange={(e) => { const n = [...pendingTemplates]; n[idx].type = e.target.value; setPendingTemplates(n); }} className="bg-black text-white font-black uppercase text-[10px] px-2 py-1 outline-none">
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                  <input type="text" value={tpl.description} onChange={(e) => { const n = [...pendingTemplates]; n[idx].description = e.target.value; setPendingTemplates(n); }} className="flex-1 bg-zinc-50 border-2 border-black p-2 text-[10px] font-bold outline-none uppercase" placeholder="Description" />
                </div>
              </div>
            ))}
            {pendingTemplates.length === 0 && (
              <p className="col-span-full text-center text-[10px] font-black uppercase text-zinc-300 py-10 border-4 border-black border-dashed">No Fixed Offerings Defined</p>
            )}
          </div>
        </div>

        {/* ROW 4: FAQ MANAGEMENT */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <SectionHeader id="faqs" title="Frequently Asked Questions" icon={<HelpCircle className="w-5 h-5" />}>
            <div className="flex-1" />
            <button
              onClick={() => setShowAddFaq(true)}
              className="bg-black text-white text-[9px] font-black px-3 py-1.5 hover:bg-neo-pink transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> ADD FAQ
            </button>
          </SectionHeader>

          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">
            These questions will appear on your public profile, helping visitors understand what you offer.
          </p>

          {/* Add new FAQ form */}
          <AnimatePresence>
            {showAddFaq && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-neo-yellow/10 border-4 border-black p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> New Question
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Question</label>
                      <input
                        type="text"
                        value={newFaqQuestion}
                        onChange={(e) => setNewFaqQuestion(e.target.value)}
                        placeholder="e.g. What kind of sessions do you offer?"
                        className="w-full bg-white border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Answer</label>
                      <textarea
                        value={newFaqAnswer}
                        onChange={(e) => setNewFaqAnswer(e.target.value)}
                        placeholder="Write a helpful answer..."
                        rows={3}
                        className="w-full bg-white border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowAddFaq(false); setNewFaqQuestion(''); setNewFaqAnswer(''); }}
                        className="flex-1 py-3 font-black uppercase text-xs tracking-widest hover:text-red-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddFaq}
                        disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
                        className="flex-1 bg-neo-green text-black py-3 border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30"
                      >
                        Add Question
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={faq.id} className="group bg-zinc-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <div className="w-8 h-8 bg-neo-pink text-white border-2 border-black flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingFaqId === faq.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleUpdateFaq(faq.id, 'question', e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-black text-sm outline-none"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => handleUpdateFaq(faq.id, 'answer', e.target.value)}
                          rows={3}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-sm outline-none resize-none"
                        />
                        <button
                          onClick={() => setEditingFaqId(null)}
                          className="text-[10px] font-black uppercase bg-neo-green px-3 py-1 border-2 border-black"
                        >
                          Done Editing
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-tight">{faq.question}</h4>
                        <p className="text-xs font-bold text-zinc-500 mt-1 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditingFaqId(editingFaqId === faq.id ? null : faq.id)}
                      className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center hover:bg-neo-blue hover:text-white transition-colors text-xs font-black"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {faqs.length === 0 && !showAddFaq && (
              <div className="border-4 border-black border-dashed p-12 text-center">
                <HelpCircle className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.2em]">No FAQs yet</p>
                <p className="text-[9px] font-bold text-zinc-300 uppercase mt-1">Add questions your visitors frequently ask</p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SAVE BAR */}
        <div className="sticky bottom-0 bg-white border-t-4 border-black py-4 px-6 -mx-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => router.push('/studio')}
            className="text-sm font-black uppercase tracking-widest hover:underline underline-offset-8"
          >
            ← Back to Studio
          </button>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-4 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 ${saveSuccess ? 'bg-neo-green text-black' : 'bg-neo-pink text-white'}`}
          >
            {saveSuccess ? <><Check className="w-5 h-5" /> SAVED SUCCESSFULLY</> : isSaving ? 'SAVING...' : <><Save className="w-5 h-5" /> SAVE ALL CHANGES</>}
          </button>
        </div>
      </main>
    </div>
  );
}
