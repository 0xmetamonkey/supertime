'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Instagram,
  Plus,
  Trash2,
  HelpCircle,
  MessageSquare,
  Save,
  Check,
  Upload,
  Monitor,
  Smartphone,
  Youtube,
  Twitter,
} from 'lucide-react';
import ProfileView from '../components/ProfileView';

interface ProfileEditorProps {
  username: string;
  initialSettings: {
    profileImage?: string;
    socials?: { instagram?: string; x?: string; youtube?: string; website?: string };
    faqs?: { id: string; question: string; answer: string }[];
    templates?: any[];
    products?: any[];
  };
}

export default function ProfileEditor({ username, initialSettings }: ProfileEditorProps) {
  const [profileImage, setProfileImage] = useState(initialSettings.profileImage || '');
  const [socials, setSocials] = useState(initialSettings.socials || { instagram: '', x: '', youtube: '', website: '' });
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>(initialSettings.faqs || []);
  const [isUploading, setIsUploading] = useState(false);

  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [showAddFaq, setShowAddFaq] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preview mode: desktop or mobile
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setIsUploading(true);
    const file = event.target.files[0];
    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, { method: 'POST', body: file });
      const newBlob = await response.json();
      setProfileImage(newBlob.url);
    } catch (e) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    setFaqs([...faqs, { id: Math.random().toString(36).slice(2, 9), question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }]);
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

  const saveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        body: JSON.stringify({ socials, profileImage, faqs })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* LEFT: EDIT FORM */}
      <div className="lg:col-span-3 space-y-8">
        {/* PROFILE IMAGE */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-4 border-black pb-2 mb-6">
            <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
              <Upload className="w-5 h-5" /> Profile Photo
            </h3>
          </div>
          <div className="flex items-center gap-6 p-4 bg-zinc-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-20 h-20 border-2 border-black bg-white overflow-hidden shrink-0">
              {profileImage ? (
                <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black italic text-2xl">?</div>
              )}
            </div>
            <div className="space-y-2">
              {isUploading ? (
                <span className="text-[10px] font-black uppercase text-neo-pink animate-pulse">Uploading...</span>
              ) : (
                <label className="neo-btn bg-black text-white text-[10px] px-4 py-2 cursor-pointer inline-block border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                  CHANGE PHOTO
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              )}
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Max 5MB · JPG, PNG, WebP</p>
            </div>
          </div>
        </div>

        {/* SOCIALS */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-4 border-black pb-2 mb-6">
            <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
              <Globe className="w-5 h-5" /> Social Links
            </h3>
          </div>
          <div className="grid gap-3">
            {(['instagram', 'x', 'youtube', 'website'] as const).map((platform) => {
              let Icon = Globe;
              if (platform === 'instagram') Icon = Instagram;
              if (platform === 'youtube') Icon = Youtube;
              if (platform === 'x') Icon = Twitter;

              return (
                <div key={platform} className="bg-zinc-50 border-4 border-black p-3 focus-within:bg-neo-yellow/10 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center">
                  <Icon className={`w-4 h-4 mr-3 ${platform === 'youtube' ? 'text-red-500' : platform === 'instagram' ? 'text-pink-500' : 'text-zinc-600'}`} />
                  <input
                    type="text"
                    value={(socials as any)[platform] || ''}
                    onChange={(e) => setSocials({ ...socials, [platform]: e.target.value })}
                    className="bg-transparent border-none outline-none font-bold text-xs flex-1 uppercase tracking-tighter"
                    placeholder={`${platform} handle or URL`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-4 border-black pb-2 mb-6 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
              <HelpCircle className="w-5 h-5" /> FAQs
            </h3>
            <button onClick={() => setShowAddFaq(true)} className="bg-black text-white text-[9px] font-black px-3 py-1.5 hover:bg-neo-pink transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> ADD FAQ
            </button>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">These appear on your public profile to help visitors understand what you offer.</p>

          <AnimatePresence>
            {showAddFaq && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-neo-yellow/10 border-4 border-black p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> New Question</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Question</label>
                      <input type="text" value={newFaqQuestion} onChange={(e) => setNewFaqQuestion(e.target.value)} placeholder="e.g. What kind of sessions do you offer?" className="w-full bg-white border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Answer</label>
                      <textarea value={newFaqAnswer} onChange={(e) => setNewFaqAnswer(e.target.value)} placeholder="Write a helpful answer..." rows={3} className="w-full bg-white border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all resize-none" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowAddFaq(false); setNewFaqQuestion(''); setNewFaqAnswer(''); }} className="flex-1 py-3 font-black uppercase text-xs tracking-widest hover:text-red-500 transition-colors">Cancel</button>
                      <button onClick={handleAddFaq} disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()} className="flex-1 bg-neo-green text-black py-3 border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30">Add Question</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={faq.id} className="group bg-zinc-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <div className="w-8 h-8 bg-neo-pink text-white border-2 border-black flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    {editingFaqId === faq.id ? (
                      <div className="space-y-3">
                        <input type="text" value={faq.question} onChange={(e) => handleUpdateFaq(faq.id, 'question', e.target.value)} className="w-full bg-white border-2 border-black p-2 font-black text-sm outline-none" />
                        <textarea value={faq.answer} onChange={(e) => handleUpdateFaq(faq.id, 'answer', e.target.value)} rows={3} className="w-full bg-white border-2 border-black p-2 font-bold text-sm outline-none resize-none" />
                        <button onClick={() => setEditingFaqId(null)} className="text-[10px] font-black uppercase bg-neo-green px-3 py-1 border-2 border-black">Done Editing</button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-tight">{faq.question}</h4>
                        <p className="text-xs font-bold text-zinc-500 mt-1 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setEditingFaqId(editingFaqId === faq.id ? null : faq.id)} className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center hover:bg-neo-blue hover:text-white transition-colors text-xs font-black">✎</button>
                    <button onClick={() => handleDeleteFaq(faq.id)} className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <button onClick={saveProfile} disabled={isSaving} className={`flex items-center gap-2 px-8 py-4 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 ${saveSuccess ? 'bg-neo-green text-black' : 'bg-neo-pink text-white'}`}>
            {saveSuccess ? <><Check className="w-5 h-5" /> SAVED</> : isSaving ? 'SAVING...' : <><Save className="w-5 h-5" /> SAVE PROFILE</>}
          </button>
        </div>
      </div>

      {/* RIGHT: LIVE PREVIEW with Desktop/Mobile toggle */}
      <div className="lg:col-span-2">
        <div className="sticky top-28">
          {/* Toggle Bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Preview</span>
            <div className="flex border-2 border-black">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase flex items-center gap-1.5 transition-colors ${previewMode === 'desktop' ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'}`}
              >
                <Monitor className="w-3 h-3" /> Desktop
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase flex items-center gap-1.5 border-l-2 border-black transition-colors ${previewMode === 'mobile' ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'}`}
              >
                <Smartphone className="w-3 h-3" /> Mobile
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div className={`mx-auto transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[320px]' : 'w-full'}`}>
            <div className={`border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden overflow-y-auto custom-scrollbar ${previewMode === 'mobile' ? 'rounded-2xl max-h-[600px]' : 'max-h-[700px]'}`}>
              {/* Browser / Phone chrome bar */}
              <div className="bg-zinc-100 border-b-2 border-black px-3 py-2 flex items-center gap-2">
                {previewMode === 'mobile' ? (
                  <div className="flex items-center justify-center w-full">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">supertime.wtf/{username}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500" />
                    </div>
                    <div className="flex-1 bg-white border border-zinc-200 rounded px-3 py-0.5 mx-4">
                      <span className="text-[8px] font-bold text-zinc-400">supertime.wtf/{username}</span>
                    </div>
                  </>
                )}
              </div>

              {/* ProfileView — the actual live preview */}
              <ProfileView
                username={username}
                profileImage={profileImage}
                socials={socials}
                faqs={faqs}
                templates={initialSettings.templates || []}
                products={initialSettings.products || []}
                isPreview={true}
                isLive={true}
              />
            </div>
          </div>

          {/* Helper text */}
          <p className="text-[7px] font-black uppercase tracking-widest text-zinc-300 text-center mt-3">
            Changes update in real time as you edit
          </p>
        </div>
      </div>
    </div>
  );
}
