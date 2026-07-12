'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Zap, Image, FileText, Video, X, Loader2 } from 'lucide-react';
import { TEAM_MEMBERS } from '../../../config';

interface ChatInputProps {
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onAttachFile?: (file: File) => Promise<void>;
  mentions: { show: boolean; query: string; index: number };
  setMentions: React.Dispatch<React.SetStateAction<{ show: boolean; query: string; index: number }>>;
  selectMention: (username: string) => void;
}

export default function ChatInput({
  input,
  onInputChange,
  onSend,
  onAttachFile,
  mentions,
  setMentions,
  selectMention,
}: ChatInputProps) {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileAccept, setFileAccept] = useState('');

  const filteredMembers = TEAM_MEMBERS.filter(m =>
    m.username.toLowerCase().includes(mentions.query.toLowerCase())
  );

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  const handleAttachClick = (accept: string) => {
    setFileAccept(accept);
    setShowAttachMenu(false);
    // Need a small timeout so the accept attribute updates before the dialog opens
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAttachFile) return;

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File size must be under 25MB');
      return;
    }

    setUploading(true);
    try {
      await onAttachFile(file);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentions.show) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentions(prev => ({ ...prev, index: Math.max(0, prev.index - 1) }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentions(prev => ({ ...prev, index: prev.index + 1 }));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const member = filteredMembers[mentions.index % filteredMembers.length];
        if (member) {
          selectMention(member.username);
        }
        setMentions({ show: false, query: '', index: 0 });
      } else if (e.key === 'Escape') {
        setMentions({ show: false, query: '', index: 0 });
      }
    }
  };

  const attachOptions = [
    {
      label: 'Photo',
      icon: Image,
      accept: 'image/*',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Video',
      icon: Video,
      accept: 'video/*',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Document',
      icon: FileText,
      accept: '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="px-4 py-3 shrink-0 relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={fileAccept}
        onChange={handleFileSelected}
        className="hidden"
        aria-hidden="true"
      />

      {/* Mention Dropdown */}
      {mentions.show && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 bg-surface border border-border rounded-xl mb-2 shadow-xl z-[100] max-h-48 overflow-y-auto overflow-hidden">
          <div className="p-2 border-b border-border bg-background">
            <span className="text-xs font-semibold text-muted">Mention Team Member</span>
          </div>
          {filteredMembers.map((member, i) => (
            <button
              key={member.username}
              type="button"
              onClick={() => selectMention(member.username)}
              className={`w-full text-left px-4 py-2.5 font-medium text-sm flex items-center gap-3 hover:bg-background transition-colors ${i === mentions.index ? 'bg-background' : ''}`}
            >
              <div className="w-6 h-6 bg-foreground/5 rounded-full flex items-center justify-center shrink-0">
                <Zap className="w-3 h-3 text-foreground fill-current" />
              </div>
              <span className="text-foreground">@{member.username}</span>
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="absolute bottom-full left-4 mb-2 bg-surface border border-border rounded-xl shadow-xl z-[100] overflow-hidden animate-fade-in"
          style={{ minWidth: '180px' }}
        >
          <div className="p-2 border-b border-border bg-background flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Send attachment</span>
            <button
              type="button"
              onClick={() => setShowAttachMenu(false)}
              className="p-0.5 rounded hover:bg-surface transition-colors text-muted hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-1.5">
            {attachOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleAttachClick(opt.accept)}
                className="w-full text-left px-3 py-2.5 font-medium text-sm flex items-center gap-3 hover:bg-background rounded-lg transition-colors"
              >
                <div className={`w-8 h-8 ${opt.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <opt.icon className={`w-4 h-4 ${opt.color}`} />
                </div>
                <span className="text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Container */}
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); }}
        className="chat-input-capsule flex items-center gap-2 px-4 py-2"
      >
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          disabled={uploading}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            showAttachMenu
              ? 'text-foreground bg-background'
              : 'text-muted hover:text-foreground hover:bg-background'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Attach file"
          aria-label="Attach file"
        >
          {uploading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Paperclip className="w-4.5 h-4.5" />
          )}
        </button>

        {/* Text input */}
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? 'Uploading...' : 'Write a message...'}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted text-sm font-medium outline-none py-1.5"
          disabled={uploading}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim() || uploading}
          className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
