'use client';

import React from 'react';
import { Paperclip, Send, Zap } from 'lucide-react';
import { TEAM_MEMBERS } from '../../../config';

interface ChatInputProps {
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  mentions: { show: boolean; query: string; index: number };
  setMentions: React.Dispatch<React.SetStateAction<{ show: boolean; query: string; index: number }>>;
  selectMention: (username: string) => void;
}

export default function ChatInput({
  input,
  onInputChange,
  onSend,
  mentions,
  setMentions,
  selectMention,
}: ChatInputProps) {
  const filteredMembers = TEAM_MEMBERS.filter(m =>
    m.username.toLowerCase().includes(mentions.query.toLowerCase())
  );

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

  return (
    <div className="px-4 py-3 shrink-0 relative">
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

      {/* Input Container */}
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); }}
        className="chat-input-capsule flex items-center gap-2 px-4 py-2"
      >
        {/* Attachment button */}
        <button
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-colors shrink-0"
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip className="w-4.5 h-4.5" />
        </button>

        {/* Text input */}
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          className="flex-1 bg-transparent text-foreground placeholder:text-muted text-sm font-medium outline-none py-1.5"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
