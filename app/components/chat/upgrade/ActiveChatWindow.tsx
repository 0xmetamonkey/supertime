'use client';

import React, { useEffect } from 'react';
import { Zap, MessageSquare } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useChatConnection, type ChatUser } from './useChatConnection';

interface ActiveChatWindowProps {
  user: ChatUser;
  recipient: string;
  onBack?: () => void;
}

export default function ActiveChatWindow({ user, recipient, onBack }: ActiveChatWindowProps) {
  const chat = useChatConnection(user, recipient);

  // Auto-scroll on new messages
  useEffect(() => {
    chat.bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="chat-active-panel">
      {/* Header */}
      <ChatHeader
        recipientName={recipient}
        isOnline={chat.connected}
        onBack={onBack}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 chat-scroll">
        {chat.loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto mb-3" />
              <p className="font-medium text-muted text-xs">Loading messages...</p>
            </div>
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-1">Start a conversation</h3>
              <p className="text-muted text-sm">
                Say hi to @{recipient}! Messages are private between you two.
              </p>
            </div>
          </div>
        ) : (
          <>
            {chat.groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-4 mt-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-medium text-[11px] text-muted px-2 uppercase tracking-wider">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-1">
                  {group.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isMe={msg.from === user.username}
                      formatTime={chat.formatTime}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={chat.bottomRef} />
          </>
        )}
      </div>

      {/* Typing Indicator */}
      {chat.typingUsers.size > 0 && (
        <div className="px-5 py-1.5 shrink-0">
          <p className="font-medium text-xs text-muted animate-pulse">
            {Array.from(chat.typingUsers.keys()).join(', ')}{' '}
            {chat.typingUsers.size === 1 ? 'is' : 'are'} typing...
          </p>
        </div>
      )}

      {/* Input */}
      <ChatInput
        input={chat.input}
        onInputChange={chat.handleInputChange}
        onSend={chat.sendMessage}
        mentions={chat.mentions}
        setMentions={chat.setMentions}
        selectMention={chat.selectMention}
      />
    </div>
  );
}
