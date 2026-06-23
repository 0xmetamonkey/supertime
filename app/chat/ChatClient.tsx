'use client';

import React, { useEffect } from 'react';
import { Zap, Send, ArrowLeft, WifiOff } from 'lucide-react';
import { UserButton } from "@clerk/nextjs";
import { TEAM_MEMBERS } from '../config';
import Link from 'next/link';
import { useChatConnection, type ChatUser } from '../components/chat/upgrade/useChatConnection';

export default function ChatClient({ user, recipient }: { user: ChatUser, recipient?: string }) {
  const chat = useChatConnection(user, recipient);

  // Auto-scroll on new messages
  useEffect(() => {
    chat.bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen h-[100dvh] bg-background text-foreground font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="z-50 bg-surface/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-background transition-colors text-muted hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-neo-pink/10 rounded-full flex items-center justify-center">
            <Zap className="text-neo-pink w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-lg leading-none">
              {recipient ? (
                <Link href={`/${recipient}`} className="hover:text-neo-pink transition-colors">
                  @{recipient}
                </Link>
              ) : (
                'Team Chat'
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted">
                {recipient ? 'Direct Message' : 'Supertime HQ'}
              </span>
              <div className="h-1 w-1 rounded-full bg-border" />
              <span className="text-xs text-muted">
                @{user.username}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {chat.connected ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium text-xs text-green-600 dark:text-green-400">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 rounded-full">
                <WifiOff className="w-3 h-3 text-red-500" />
                <span className="font-medium text-xs text-red-600 dark:text-red-400">Offline</span>
              </div>
            )}
          </div>
          <div className="bg-surface rounded-full">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {chat.loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-muted border-t-neo-pink rounded-full animate-spin mx-auto mb-4" />
              <p className="font-medium text-muted text-sm">Loading messages...</p>
            </div>
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-neo-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-neo-blue" />
              </div>
              <h2 className="font-semibold text-foreground text-2xl mb-2">Fresh start!</h2>
              <p className="text-muted text-sm">
                {recipient
                  ? `Say hi to @${recipient}! No one else can see this chat.`
                  : "Send the first message to your team. Messages persist for 7 days."}
              </p>
            </div>
          </div>
        ) : (
          chat.groupedMessages.map((group, gi) => (
            <div key={gi}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-6 mt-4">
                <div className="flex-1 h-px bg-border" />
                <span className="font-medium text-xs text-muted px-2">{group.date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                {group.messages.map((msg) => {
                  const isMe = msg.from === user.username;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] sm:max-w-[60%] ${isMe
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-surface border border-border text-foreground rounded-2xl rounded-tl-sm'
                        } px-4 py-3 shadow-sm`}>
                        {!isMe && (
                          <Link href={`/${msg.from}`} className="font-semibold text-xs text-neo-pink mb-1 hover:underline block">
                            {msg.from}
                          </Link>
                        )}
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {(() => {
                            const mentionNames = TEAM_MEMBERS.map(m => m.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                            const regex = new RegExp(`(@(?:${mentionNames.join('|')}))`, 'g');
                            return msg.text.split(regex).map((part, i) =>
                              part.startsWith('@') ? (
                                <span key={i} className={`${isMe ? 'text-blue-200' : 'text-blue-500'} font-semibold underline decoration-1 underline-offset-2`}>
                                  {part}
                                </span>
                              ) : part
                            );
                          })()}
                        </p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-muted'}`}>
                          {chat.formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={chat.bottomRef} />
      </div>

      {/* Typing Indicator */}
      {chat.typingUsers.size > 0 && (
        <div className="px-6 py-2 bg-background border-t border-border">
          <p className="font-medium text-xs text-muted animate-pulse">
            {Array.from(chat.typingUsers.keys()).join(', ')} {chat.typingUsers.size === 1 ? 'is' : 'are'} typing...
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-background border-t border-border p-4 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); chat.sendMessage(); }}
          className="flex items-stretch gap-3 relative"
        >
          {chat.mentions.show && (
            <div className="absolute bottom-full left-4 bg-surface border border-border rounded-xl mb-2 w-64 shadow-xl z-[100] max-h-48 overflow-y-auto overflow-hidden">
              <div className="p-2 border-b border-border bg-background">
                <span className="text-xs font-semibold text-muted">Mention Team Member</span>
              </div>
              {TEAM_MEMBERS
                .filter(m => m.username.toLowerCase().includes(chat.mentions.query.toLowerCase()))
                .map((member, i) => (
                  <button
                    key={member.username}
                    type="button"
                    onClick={() => chat.selectMention(member.username)}
                    className={`w-full text-left px-4 py-2.5 font-medium text-sm flex items-center gap-3 hover:bg-background transition-colors ${i === chat.mentions.index ? 'bg-background' : ''}`}
                  >
                    <div className="w-6 h-6 bg-neo-pink/10 rounded-full flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3 text-neo-pink fill-current" />
                    </div>
                    <span className="text-foreground">@{member.username}</span>
                  </button>
                ))
              }
            </div>
          )}

          <input
            type="text"
            value={chat.input}
            onChange={(e) => chat.handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (chat.mentions.show) {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  chat.setMentions(prev => ({ ...prev, index: Math.max(0, prev.index - 1) }));
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  chat.setMentions(prev => ({ ...prev, index: prev.index + 1 }));
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  const filtered = TEAM_MEMBERS.filter(m => m.username.toLowerCase().includes(chat.mentions.query.toLowerCase()));
                  const member = filtered[chat.mentions.index % filtered.length];
                  if (member) {
                    chat.selectMention(member.username);
                  }
                  chat.setMentions({ show: false, query: '', index: 0 });
                } else if (e.key === 'Escape') {
                  chat.setMentions({ show: false, query: '', index: 0 });
                }
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 font-medium text-foreground placeholder:text-muted outline-none focus:border-foreground transition-all"
          />
          <button
            type="submit"
            disabled={!chat.input.trim()}
            className="bg-foreground text-background rounded-xl px-6 font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
