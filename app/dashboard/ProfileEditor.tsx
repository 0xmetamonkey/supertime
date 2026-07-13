/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
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
  User,
} from 'lucide-react';
import ProfileView from '../components/ProfileView';
import { useRouter } from 'next/navigation';

interface ProfileEditorProps {
  username: string;
  initialSettings: {
    profileImage?: string;
    coverImage?: string;
    socials?: { instagram?: string; x?: string; youtube?: string; website?: string };
    faqs?: { id: string; question: string; answer: string }[];
    templates?: any[];
    products?: any[];
    displayName?: string;
    bio?: string;
  };
}

export default function ProfileEditor({ username, initialSettings }: ProfileEditorProps) {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(initialSettings.profileImage || '');
  const [coverImage, setCoverImage] = useState(initialSettings.coverImage || '');
  const [displayName, setDisplayName] = useState(initialSettings.displayName || '');
  const [bio, setBio] = useState(initialSettings.bio || '');
  const [socials, setSocials] = useState(initialSettings.socials || { instagram: '', x: '', youtube: '', website: '' });
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>(initialSettings.faqs || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

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
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
      if (!response.ok) throw new Error("Upload failed");
      const newBlob = await response.json();
      if (!newBlob.url) throw new Error("Upload response is missing url");
      setProfileImage(newBlob.url);
    } catch (e) {
      console.error("Profile photo upload failed:", e);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setIsUploadingCover(true);
    const file = event.target.files[0];
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
      if (!response.ok) throw new Error("Upload failed");
      const newBlob = await response.json();
      if (!newBlob.url) throw new Error("Upload response is missing url");
      setCoverImage(newBlob.url);
    } catch (e) {
      console.error("Cover photo upload failed:", e);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploadingCover(false);
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
        body: JSON.stringify({ socials, profileImage, coverImage, faqs, displayName, bio })
      });
      setSaveSuccess(true);
      router.refresh(); // Tells Next.js to re-fetch the server component state
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
      <div className="lg:col-span-3 space-y-6">
        {/* PROFILE & COVER IMAGES */}
        <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
          
          {/* Cover Photo */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-gray-400" /> Cover Photo
            </h3>
            <div className="relative w-full h-32 bg-gray-100 dark:bg-background border border-gray-200 dark:border-border rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
              {coverImage ? (
                <img src={coverImage} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                <span className="text-sm text-gray-400 font-medium">No cover photo</span>
              )}
              <div className="absolute bottom-3 right-3">
                {isUploadingCover ? (
                  <span className="bg-white/80 dark:bg-black/80 backdrop-blur-sm text-xs font-medium text-blue-500 px-3 py-1.5 rounded-lg animate-pulse">Uploading...</span>
                ) : (
                  <label className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-gray-900 dark:text-white text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer shadow-sm hover:opacity-90 transition-opacity">
                    Change Cover
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Recommended: 1200x400. Max 5MB.</p>
          </div>

          <hr className="border-border my-6" />

          {/* Profile Photo */}
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-gray-400" /> Profile Photo
            </h3>
          </div>
          <div className="flex items-center gap-6 p-5 bg-gray-50 dark:bg-background border border-gray-100 dark:border-border rounded-xl transition-colors">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-surface border border-gray-200 dark:border-border overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
              {profileImage ? (
                <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="space-y-2">
              {isUploading ? (
                <span className="text-xs font-medium text-blue-500 animate-pulse">Uploading...</span>
              ) : (
                <label className="bg-gray-900 dark:bg-foreground text-white dark:text-background text-xs font-medium px-4 py-2 rounded-lg cursor-pointer inline-block hover:opacity-90 transition-opacity">
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              )}
              <p className="text-xs text-gray-500">Max 5MB · JPG, PNG, WebP</p>
            </div>
          </div>
        </div>

        {/* DISPLAY NAME */}
        <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Display Name
            </h3>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border text-gray-900 dark:text-foreground px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <p className="text-xs text-gray-500">Your full name displayed on explore cards and profile headers.</p>
          </div>

          <div className="mt-6 mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" /> Bio / Description
            </h3>
          </div>
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I love creating content about..."
              rows={3}
              className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border text-gray-900 dark:text-foreground px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            />
            <p className="text-xs text-gray-500">A short introduction about who you are and what you offer.</p>
          </div>
        </div>

        {/* SOCIALS */}
        <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" /> Social Links
            </h3>
          </div>
          <div className="grid gap-3">
            {(['instagram', 'x', 'youtube', 'website'] as const).map((platform) => {
              let Icon = Globe;
              if (platform === 'instagram') Icon = Instagram;
              if (platform === 'youtube') Icon = Youtube;
              if (platform === 'x') Icon = Twitter;

              return (
                <div key={platform} className="bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-lg p-3 focus-within:ring-1 focus-within:ring-blue-500 transition-all flex items-center">
                  <Icon className={`w-4 h-4 mr-3 text-gray-400`} />
                  <input
                    type="text"
                    value={(socials as any)[platform] || ''}
                    onChange={(e) => setSocials({ ...socials, [platform]: e.target.value })}
                    className="bg-transparent border-none outline-none font-medium text-sm flex-1 text-gray-900 dark:text-foreground placeholder-gray-400"
                    placeholder={`${platform} handle or URL`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-400" /> FAQs
            </h3>
            <button onClick={() => setShowAddFaq(true)} className="bg-gray-900 dark:bg-foreground text-white dark:text-background text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add FAQ
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">These appear on your public profile to help visitors understand what you offer.</p>

          <AnimatePresence>
            {showAddFaq && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-gray-50 dark:bg-background border border-gray-100 dark:border-border p-5 rounded-xl mb-6 transition-colors">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-foreground mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gray-400" /> New Question</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Question</label>
                      <input type="text" value={newFaqQuestion} onChange={(e) => setNewFaqQuestion(e.target.value)} placeholder="e.g. What kind of sessions do you offer?" className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Answer</label>
                      <textarea value={newFaqAnswer} onChange={(e) => setNewFaqAnswer(e.target.value)} placeholder="Write a helpful answer..." rows={3} className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setShowAddFaq(false); setNewFaqQuestion(''); setNewFaqAnswer(''); }} className="flex-1 py-2 font-medium text-gray-500 hover:text-gray-900 dark:hover:text-foreground text-sm transition-colors">Cancel</button>
                      <button onClick={handleAddFaq} disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()} className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-50">Add Question</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={faq.id} className="group bg-gray-50 dark:bg-background border border-gray-100 dark:border-border rounded-xl overflow-hidden transition-colors">
                <div className="flex items-start gap-4 p-5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center font-medium text-xs shrink-0 mt-0.5">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    {editingFaqId === faq.id ? (
                      <div className="space-y-3">
                        <input type="text" value={faq.question} onChange={(e) => handleUpdateFaq(faq.id, 'question', e.target.value)} className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500" />
                        <textarea value={faq.answer} onChange={(e) => handleUpdateFaq(faq.id, 'answer', e.target.value)} rows={3} className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                        <button onClick={() => setEditingFaqId(null)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Done Editing</button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-foreground text-sm">{faq.question}</h4>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setEditingFaqId(editingFaqId === faq.id ? null : faq.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-foreground transition-colors text-xs font-medium">✎</button>
                    <button onClick={() => handleDeleteFaq(faq.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
            {faqs.length === 0 && !showAddFaq && (
              <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                <HelpCircle className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-900 dark:text-foreground">No FAQs yet</p>
                <p className="text-sm text-gray-500 mt-1">Add questions your visitors frequently ask</p>
              </div>
            )}
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-2">
          <button onClick={saveProfile} disabled={isSaving} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${saveSuccess ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-foreground text-white dark:text-background hover:opacity-90'}`}>
            {saveSuccess ? <><Check className="w-4 h-4" /> Saved</> : isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Profile</>}
          </button>
        </div>
      </div>

      {/* RIGHT: LIVE PREVIEW with Desktop/Mobile toggle */}
      <div className="lg:col-span-2">
        <div className="sticky top-28">
          {/* Toggle Bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-500">Live Preview</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${previewMode === 'desktop' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${previewMode === 'mobile' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div className={`mx-auto transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[320px]' : 'w-full'}`}>
            <div className={`border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface shadow-xl overflow-hidden overflow-y-auto custom-scrollbar ${previewMode === 'mobile' ? 'rounded-[2rem] max-h-[600px] border-4' : 'rounded-xl max-h-[700px]'}`}>
              {/* Browser / Phone chrome bar */}
              <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
                {previewMode === 'mobile' ? (
                  <div className="flex items-center justify-center w-full">
                    <span className="text-xs font-medium text-gray-400">supertime.wtf/{username}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                      <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex-1 bg-white dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-md px-3 py-1 mx-4 text-center">
                      <span className="text-xs font-medium text-gray-500">supertime.wtf/{username}</span>
                    </div>
                  </>
                )}
              </div>

                <ProfileView
                  username={username}
                  profileImage={profileImage}
                  coverImage={coverImage}
                  socials={socials}
                  faqs={faqs}
                  templates={initialSettings.templates || []}
                  products={initialSettings.products || []}
                  bio={bio}
                  isPreview={true}
                  isLive={true}
                />
            </div>
          </div>

          {/* Helper text */}
          <p className="text-xs font-medium text-gray-400 text-center mt-4">
            Changes update in real time as you edit
          </p>
        </div>
      </div>
    </div>
  );
}
