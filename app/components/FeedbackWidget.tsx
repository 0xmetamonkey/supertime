'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setIsSubmitting(true);
    let fileUrl = '';

    try {
      // 1. Upload File if present
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileUrl = uploadData.url;
        } else {
          console.error("File upload failed");
        }
      }

      // 2. Submit Feedback
      const feedbackRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          details,
          fileUrl,
        })
      });

      if (!feedbackRes.ok) throw new Error("Failed to submit feedback");

      // Success
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setDetails('');
        setFile(null);
        setIsSuccess(false);
      }, 2500);

    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hover:text-foreground transition-colors"
      >
        Feedback
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setIsOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="absolute top-5 right-5 text-muted hover:text-foreground transition-colors p-2 bg-background rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Bug className="w-6 h-6 text-neo-pink" /> 
                Report an Issue
              </h2>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                Found a bug? Have an idea? Let us know. Attach a screenshot or video recording if possible—it helps tremendously!
              </p>

              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">Got it. Thank you!</p>
                  <p className="text-sm text-muted">Your feedback has been logged securely.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Details</label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="What happened? What were you trying to do?"
                      className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm text-foreground focus:outline-none focus:border-foreground resize-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Attachment (Optional)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-neo-pink bg-neo-pink/5' : 'border-border hover:border-muted bg-background hover:bg-surface'}`}
                    >
                      {file ? (
                        <>
                          <CheckCircle2 className="w-6 h-6 text-neo-pink mb-2" />
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-muted mb-2" />
                          <p className="text-sm font-medium text-foreground">Click to upload Screenshot/Video</p>
                          <p className="text-xs text-muted mt-1">PNG, JPG, MP4, WebM up to 50MB</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !details.trim()}
                    className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      'Send Feedback'
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
