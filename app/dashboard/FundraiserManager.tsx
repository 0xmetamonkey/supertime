'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Heart,
  Upload,
  FileText,
  Target,
  MessageSquare,
  ExternalLink,
  Power,
  PowerOff,
  Shield,
  Check,
  Save,
  Eye,
  Trash2,
  Image,
  Video,
  Copy,
  CheckCircle,
} from 'lucide-react';

interface FundraiserManagerProps {
  username: string;
}

export default function FundraiserManager({ username }: FundraiserManagerProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [verificationDoc, setVerificationDoc] = useState('');

  // UI state
  const [isActive, setIsActive] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [raisedAmount, setRaisedAmount] = useState(0);
  const [donorCount, setDonorCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing fundraiser
  useEffect(() => {
    fetch(`/api/fundraise?username=${username}`)
      .then(r => r.json())
      .then(data => {
        if (data.found && data.fundraiser) {
          const f = data.fundraiser;
          setTitle(f.title || '');
          setStory(f.story || '');
          setGoalAmount(String(f.goalAmount || ''));
          setImageUrl(f.imageUrl || '');
          setVideoUrl(f.videoUrl || '');
          setVerificationDoc(f.verificationDoc || '');
          setIsActive(f.isActive || false);
          setRaisedAmount(f.raisedAmount || 0);
          setDonorCount(f.donorCount || 0);
          setHasExisting(true);
          setShowForm(true);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [username]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'doc') => {
    if (!event.target.files || event.target.files.length === 0) return;
    setIsUploading(type);
    const file = event.target.files[0];
    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, { method: 'POST', body: file });
      const blob = await response.json();
      if (type === 'image') setImageUrl(blob.url);
      else if (type === 'video') setVideoUrl(blob.url);
      else setVerificationDoc(blob.url);
    } catch (e) {
      alert('Upload failed');
    } finally {
      setIsUploading(null);
    }
  };

  const handleSave = async (activate?: boolean) => {
    if (!title.trim() || !story.trim() || !goalAmount) {
      alert('Please fill in title, story, and goal amount.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/fundraise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          title: title.trim(),
          story: story.trim(),
          goalAmount: Number(goalAmount),
          imageUrl,
          videoUrl,
          verificationDoc,
          isActive: activate !== undefined ? activate : isActive,
        }),
      });

      if (activate !== undefined) setIsActive(activate);
      setHasExisting(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Failed to save fundraiser');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('This will deactivate your fundraiser and restore your regular profile. Continue?')) return;
    await handleSave(false);
  };

  const fundraiseUrl = `supertime.wtf/fundraise/${username}`;

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_black] text-center">
        <div className="w-10 h-10 border-4 border-black border-t-neo-pink rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading fundraiser status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* WARNING BANNER */}
      <div className="bg-neo-yellow/20 border-4 border-neo-yellow p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-neo-yellow border-4 border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_black]">
            <AlertTriangle className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="font-black uppercase text-sm tracking-tight mb-2">Emergency Fundraiser Only</h3>
            <p className="text-[10px] font-bold text-zinc-600 leading-relaxed">
              This feature is strictly for <strong>genuine emergencies</strong> — medical bills, disaster relief, urgent personal crises.
              When activated, your regular profile (products, calls, store) will be replaced with the fundraiser page.
              You must upload verification documents (medical bills, hospital letters, etc.) which our team will review.
              <strong> Misuse of this feature will result in account suspension.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVE STATUS */}
      {hasExisting && isActive && (
        <div className="bg-neo-green/10 border-4 border-neo-green p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-neo-green animate-pulse" />
              <div>
                <h3 className="font-black uppercase text-sm tracking-tight">Fundraiser is LIVE</h3>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                  Your profile now shows the fundraiser page · ₹{raisedAmount.toLocaleString()} raised from {donorCount} supporters
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://${fundraiseUrl}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="px-3 py-2 border-2 border-black font-black uppercase text-[9px] bg-white shadow-[2px_2px_0px_0px_black] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1"
              >
                {copiedLink ? <><CheckCircle className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Share</>}
              </button>
              <a
                href={`/fundraise/${username}`}
                target="_blank"
                className="px-3 py-2 border-2 border-black font-black uppercase text-[9px] bg-black text-white shadow-[2px_2px_0px_0px_black] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> View
              </a>
            </div>
          </div>
        </div>
      )}

      {/* START BUTTON or FORM */}
      {!showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_black] text-center"
        >
          <Heart className="w-16 h-16 text-neo-pink mx-auto mb-6" />
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-3 italic">Need Urgent Help?</h3>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8 max-w-md mx-auto">
            Start a fundraiser to receive financial support directly from your community.
            Your profile will show the fundraiser page until you deactivate it.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-10 py-4 bg-neo-pink text-white border-4 border-black font-black uppercase text-sm shadow-[6px_6px_0px_0px_black] hover:shadow-[3px_3px_0px_0px_black] hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
          >
            Start a Fundraiser
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* TITLE */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-4 border-black pb-2 mb-6">
              <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                <Target className="w-5 h-5" /> Fundraiser Details
              </h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Help My Mother Fight Her Battle"
                  className="w-full border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_black] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Goal Amount (₹)</label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={e => setGoalAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  min="1000"
                  className="w-full border-4 border-black p-3 font-black text-xl outline-none shadow-[4px_4px_0px_0px_black] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                />
              </div>
            </div>
          </div>

          {/* STORY */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-4 border-black pb-2 mb-6">
              <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                <MessageSquare className="w-5 h-5" /> Your Story
              </h3>
            </div>
            <textarea
              value={story}
              onChange={e => setStory(e.target.value)}
              placeholder="Tell your story here. Be genuine — share what happened, why you need help, and how the funds will be used. People connect with real, honest stories."
              rows={8}
              className="w-full border-4 border-black p-4 font-medium text-sm outline-none shadow-[4px_4px_0px_0px_black] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all resize-none leading-relaxed"
            />
            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Use separate lines for paragraphs. Be honest and specific.</p>
          </div>

          {/* MEDIA */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-4 border-black pb-2 mb-6">
              <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                <Image className="w-5 h-5" /> Photos & Video
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Image */}
              <div className="border-4 border-black border-dashed p-6 text-center bg-zinc-50">
                {imageUrl ? (
                  <div className="space-y-3">
                    <img src={imageUrl} className="w-full h-32 object-cover border-2 border-black" alt="" />
                    <div className="flex gap-2">
                      <label className="flex-1 py-2 bg-zinc-200 border-2 border-black font-black uppercase text-[9px] cursor-pointer text-center">
                        Replace
                        <input type="file" accept="image/*" onChange={e => handleUpload(e, 'image')} className="hidden" />
                      </label>
                      <button onClick={() => setImageUrl('')} className="px-3 py-2 bg-red-500 text-white border-2 border-black font-black uppercase text-[9px]">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Image className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      {isUploading === 'image' ? 'Uploading...' : 'Upload Cover Photo'}
                    </p>
                    <p className="text-[8px] font-bold text-zinc-300 uppercase">JPG, PNG, WebP</p>
                    <input type="file" accept="image/*" onChange={e => handleUpload(e, 'image')} className="hidden" />
                  </label>
                )}
              </div>

              {/* Video */}
              <div className="border-4 border-black border-dashed p-6 text-center bg-zinc-50">
                {videoUrl ? (
                  <div className="space-y-3">
                    <video src={videoUrl} className="w-full h-32 object-cover border-2 border-black" />
                    <div className="flex gap-2">
                      <label className="flex-1 py-2 bg-zinc-200 border-2 border-black font-black uppercase text-[9px] cursor-pointer text-center">
                        Replace
                        <input type="file" accept="video/*" onChange={e => handleUpload(e, 'video')} className="hidden" />
                      </label>
                      <button onClick={() => setVideoUrl('')} className="px-3 py-2 bg-red-500 text-white border-2 border-black font-black uppercase text-[9px]">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Video className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      {isUploading === 'video' ? 'Uploading...' : 'Upload Video'}
                    </p>
                    <p className="text-[8px] font-bold text-zinc-300 uppercase">MP4, WebM</p>
                    <input type="file" accept="video/*" onChange={e => handleUpload(e, 'video')} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* VERIFICATION */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-4 border-black pb-2 mb-6">
              <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                <Shield className="w-5 h-5" /> Verification Documents
              </h3>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
              Upload medical bills, hospital letters, or any proof of emergency. Our team will review within 24 hours.
            </p>

            <div className="border-4 border-black border-dashed p-6 bg-zinc-50 text-center">
              {verificationDoc ? (
                <div className="flex items-center gap-4 justify-center">
                  <FileText className="w-8 h-8 text-neo-green" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase text-neo-green">Document uploaded ✓</p>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase">Pending review</p>
                  </div>
                  <label className="px-3 py-2 bg-zinc-200 border-2 border-black font-black uppercase text-[9px] cursor-pointer">
                    Replace
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e, 'doc')} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    {isUploading === 'doc' ? 'Uploading...' : 'Upload Verification Document'}
                  </p>
                  <p className="text-[8px] font-bold text-zinc-300 uppercase">PDF, JPG, PNG</p>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e, 'doc')} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-4">
            {/* Save */}
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 ${saveSuccess ? 'bg-neo-green text-black' : 'bg-black text-white'}`}
            >
              {saveSuccess ? <><Check className="w-5 h-5" /> Saved</> : isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Draft</>}
            </button>

            {/* Activate / Deactivate */}
            {!isActive ? (
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving || !title.trim() || !story.trim() || !goalAmount}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 border-4 border-black font-black uppercase text-sm bg-neo-pink text-white shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50"
              >
                <Power className="w-5 h-5" /> Activate Fundraiser
              </button>
            ) : (
              <button
                onClick={handleDeactivate}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-4 border-4 border-black font-black uppercase text-xs bg-zinc-100 text-zinc-600 shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 hover:bg-red-50 hover:text-red-500 hover:border-red-500"
              >
                <PowerOff className="w-4 h-4" /> Deactivate
              </button>
            )}
          </div>

          {isActive && (
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">
              ⚠️ While active, your regular profile is replaced with the fundraiser page.
              Deactivate to restore your normal profile with products, calls, and store.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
