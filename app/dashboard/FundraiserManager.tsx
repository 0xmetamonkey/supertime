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
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
      if (!response.ok) throw new Error('Upload failed');
      const blob = await response.json();
      if (!blob.url) throw new Error('Upload response is missing url');
      if (type === 'image') setImageUrl(blob.url);
      else if (type === 'video') setVideoUrl(blob.url);
      else setVerificationDoc(blob.url);
    } catch (e) {
      console.error('Fundraiser upload failed:', e);
      alert('Upload failed. Please try again.');
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

  const handleReset = async () => {
    if (!confirm('Are you sure you want to completely delete this fundraiser and start fresh? All data will be lost. This cannot be undone.')) return;
    setIsSaving(true);
    try {
      await fetch('/api/fundraise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      setTitle('');
      setStory('');
      setGoalAmount('');
      setImageUrl('');
      setVideoUrl('');
      setVerificationDoc('');
      setIsActive(false);
      setRaisedAmount(0);
      setDonorCount(0);
      setHasExisting(false);
      setShowForm(false);
    } catch (e) {
      alert('Failed to reset fundraiser');
    } finally {
      setIsSaving(false);
    }
  };

  const fundraiseUrl = `supertime.wtf/fundraise/${username}`;

  if (isLoading) {
    return (
      <div className="bg-surface border border-border p-12 rounded-2xl shadow-sm text-center">
        <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-muted">Loading fundraiser status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* WARNING BANNER */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-neo-pink/10 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-neo-pink" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-foreground mb-1">Fundraiser / Goal Setup</h3>
            <p className="text-xs text-muted leading-relaxed">
              Use this feature to raise funds for a project, goal, or emergency.
              When activated, a prominent Fundraiser Card will be displayed right on your main profile.
              Fans can track your progress and support you directly.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVE STATUS */}
      {hasExisting && isActive && (
        <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <div>
                <h3 className="font-medium text-sm text-green-500">Fundraiser is LIVE</h3>
                <p className="text-xs text-green-500/80 mt-1">
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
                className="px-3.5 py-2 border border-border rounded-lg font-medium text-xs bg-surface hover:bg-background flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedLink ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Share</>}
              </button>
              <a
                href={`/fundraise/${username}`}
                target="_blank"
                className="px-3.5 py-2 rounded-lg font-medium text-xs bg-foreground text-background hover:opacity-90 flex items-center gap-1.5 transition-opacity shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" /> View
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
          className="bg-surface border border-border p-12 rounded-2xl shadow-sm text-center"
        >
          <Heart className="w-12 h-12 text-neo-pink mx-auto mb-6" />
          <h3 className="text-xl font-medium text-foreground mb-2">Need Urgent Help?</h3>
          <p className="text-xs text-muted mb-8 max-w-md mx-auto leading-relaxed">
            Start a fundraiser to receive financial support directly from your community.
            Your profile will show the fundraiser page until you deactivate it.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-neo-pink text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            Start a Fundraiser
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* TITLE */}
          <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm">
            <div className="border-b border-border pb-4 mb-6">
              <h3 className="text-base font-medium text-foreground flex items-center gap-2.5">
                <Target className="w-5 h-5 text-muted" /> Fundraiser Details
              </h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-muted block mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Help My Mother Fight Her Battle"
                  className="w-full bg-background border border-border rounded-xl p-3 font-medium text-sm focus:outline-none focus:border-neo-pink transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted block mb-1.5">Goal Amount (₹)</label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={e => setGoalAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  min="1000"
                  className="w-full bg-background border border-border rounded-xl p-3 font-medium text-base focus:outline-none focus:border-neo-pink transition-colors"
                />
              </div>
            </div>
          </div>

          {/* STORY */}
          <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm">
            <div className="border-b border-border pb-4 mb-6">
              <h3 className="text-base font-medium text-foreground flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-muted" /> Your Story
              </h3>
            </div>
            <textarea
              value={story}
              onChange={e => setStory(e.target.value)}
              placeholder="Tell your story here. Be genuine — share what happened, why you need help, and how the funds will be used. People connect with real, honest stories."
              rows={8}
              className="w-full bg-background border border-border rounded-xl p-4 font-medium text-sm focus:outline-none focus:border-neo-pink transition-colors resize-none leading-relaxed"
            />
            <p className="text-xs text-muted mt-2">Use separate lines for paragraphs. Be honest and specific.</p>
          </div>

          {/* MEDIA */}
          <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm">
            <div className="border-b border-border pb-4 mb-6">
              <h3 className="text-base font-medium text-foreground flex items-center gap-2.5">
                <Image className="w-5 h-5 text-muted" /> Photos & Video
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="border border-dashed border-border rounded-2xl p-6 text-center bg-background">
                {imageUrl ? (
                  <div className="space-y-3">
                    <img src={imageUrl} className="w-full h-32 object-cover border border-border rounded-xl" alt="" />
                    <div className="flex gap-2">
                      <label className="flex-1 py-2 bg-surface hover:bg-background border border-border rounded-lg font-medium text-xs cursor-pointer text-center transition-colors">
                        Replace
                        <input type="file" accept="image/*" onChange={e => handleUpload(e, 'image')} className="hidden" />
                      </label>
                      <button onClick={() => setImageUrl('')} className="px-3.5 py-2 bg-red-500 text-white rounded-lg font-medium text-xs hover:bg-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Image className="w-8 h-8 text-muted mx-auto mb-3" />
                    <p className="text-xs font-medium text-muted mb-1">
                      {isUploading === 'image' ? 'Uploading...' : 'Upload Cover Photo'}
                    </p>
                    <p className="text-[10px] text-muted">JPG, PNG, WebP</p>
                    <input type="file" accept="image/*" onChange={e => handleUpload(e, 'image')} className="hidden" />
                  </label>
                )}
              </div>

              {/* Video */}
              <div className="border border-dashed border-border rounded-2xl p-6 text-center bg-background">
                {videoUrl ? (
                  <div className="space-y-3">
                    <video src={videoUrl} className="w-full h-32 object-cover border border-border rounded-xl" />
                    <div className="flex gap-2">
                      <label className="flex-1 py-2 bg-surface hover:bg-background border border-border rounded-lg font-medium text-xs cursor-pointer text-center transition-colors">
                        Replace
                        <input type="file" accept="video/*" onChange={e => handleUpload(e, 'video')} className="hidden" />
                      </label>
                      <button onClick={() => setVideoUrl('')} className="px-3.5 py-2 bg-red-500 text-white rounded-lg font-medium text-xs hover:bg-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Video className="w-8 h-8 text-muted mx-auto mb-3" />
                    <p className="text-xs font-medium text-muted mb-1">
                      {isUploading === 'video' ? 'Uploading...' : 'Upload Video'}
                    </p>
                    <p className="text-[10px] text-muted">MP4, WebM</p>
                    <input type="file" accept="video/*" onChange={e => handleUpload(e, 'video')} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* VERIFICATION */}
          <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm">
            <div className="border-b border-border pb-4 mb-6">
              <h3 className="text-base font-medium text-foreground flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-muted" /> Verification Documents
              </h3>
            </div>
            <p className="text-xs text-muted mb-4">
              Upload medical bills, hospital letters, or any proof of emergency. Our team will review within 24 hours.
            </p>

            <div className="border border-dashed border-border rounded-2xl p-6 bg-background text-center">
              {verificationDoc ? (
                <div className="flex items-center gap-4 justify-center">
                  <FileText className="w-8 h-8 text-neo-green" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-neo-green">Document uploaded ✓</p>
                    <p className="text-[10px] text-muted">Pending review</p>
                  </div>
                  <label className="px-3.5 py-2 bg-surface hover:bg-background border border-border rounded-lg font-medium text-xs cursor-pointer transition-colors">
                    Replace
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e, 'doc')} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-muted mx-auto mb-3" />
                  <p className="text-xs font-medium text-muted mb-1">
                    {isUploading === 'doc' ? 'Uploading...' : 'Upload Verification Document'}
                  </p>
                  <p className="text-[10px] text-muted">PDF, JPG, PNG</p>
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
              className={`flex-1 flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm transition-all disabled:opacity-55 shadow-sm ${saveSuccess ? 'bg-neo-green text-background hover:bg-neo-green/90' : 'bg-foreground text-background hover:opacity-90'}`}
            >
              {saveSuccess ? <><Check className="w-5 h-5" /> Saved</> : isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Draft</>}
            </button>

            {/* Activate / Deactivate */}
            {!isActive ? (
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving || !title.trim() || !story.trim() || !goalAmount}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm bg-neo-pink text-white hover:opacity-90 transition-colors shadow-sm disabled:opacity-50"
              >
                <Power className="w-5 h-5" /> Activate Fundraiser
              </button>
            ) : (
              <button
                onClick={handleDeactivate}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm bg-surface hover:bg-background text-red-500 hover:text-red-600 border border-transparent hover:border-red-500/50 transition-all shadow-sm"
              >
                <PowerOff className="w-4 h-4" /> Deactivate
              </button>
            )}

            {/* Reset / Delete */}
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm bg-surface border border-border text-muted hover:text-red-500 hover:border-red-500/50 transition-all shadow-sm"
              title="Delete this fundraiser completely to start a new one"
            >
              <Trash2 className="w-4 h-4" /> Reset
            </button>
          </div>

          {isActive && (
            <p className="text-[10px] text-gray-400 text-center">
              Your fundraiser is currently active and visible on your profile.
              Deactivate it to hide it from your public page.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
