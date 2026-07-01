'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, Search } from 'lucide-react';

interface Conversation {
  with: string;
  from: string;
  lastMessage: string;
  timestamp: number | string | Date;
  profileImage?: string;
}

interface MessagesPanelProps {
  username: string;
  activeChatUser: string | null;
  onSelectChat: (username: string) => void;
  unreadFrom?: Set<string>;
}

function formatMessageDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (compareDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export default function MessagesPanel({ username, activeChatUser, onSelectChat, unreadFrom }: MessagesPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/chat/inbox?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => {
        if (data.conversations) {
          setConversations(data.conversations);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  const filtered = search
    ? conversations.filter(c => c.with.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div className="chat-messages-panel bg-surface">
      {/* Panel Header */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h2 className="text-lg font-semibold text-foreground mb-3">Messages</h2>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-6">
            <MessageSquare className="w-8 h-8 text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted">
              {search ? 'No matching conversations' : 'No messages yet'}
            </p>
          </div>
        ) : (
          <div className="px-2 pb-2">
            {filtered.map((conv, i) => {
              const isActive = activeChatUser === conv.with;
              const isUnread = unreadFrom?.has(conv.with.toLowerCase());
              return (
                <button
                  key={i}
                  onClick={() => onSelectChat(conv.with)}
                  className={`conversation-item w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-background shadow-sm'
                      : 'hover:bg-background/60'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-background border border-border flex items-center justify-center">
                      {conv.profileImage ? (
                        <img src={conv.profileImage} alt={conv.with} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-semibold text-foreground text-sm uppercase">
                          {conv.with.charAt(0)}
                        </span>
                      )}
                    </div>
                    {isUnread && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neo-pink opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-neo-pink border-2 border-background" />
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium text-sm truncate ${isActive ? 'text-foreground' : 'text-foreground'}`}>
                        @{conv.with}
                      </h4>
                      <span className="text-[11px] text-muted shrink-0 ml-2 tabular-nums">
                        {formatMessageDate(conv.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {conv.from === conv.with ? '' : 'You: '}
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
