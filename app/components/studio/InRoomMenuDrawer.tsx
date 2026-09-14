'use client';

import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Users, 
  UserPlus, 
  Share2, 
  Disc, 
  Captions, 
  Repeat, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ArrowLeft, 
  Copy, 
  Check, 
  Send, 
  Mic, 
  MicOff, 
  MoreVertical 
} from 'lucide-react';

interface InRoomMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEndRoom: () => void;
  roomType: string;
}

type MenuTab = 'menu' | 'chat' | 'participants' | 'invite' | 'settings';

export default function InRoomMenuDrawer({
  isOpen,
  onClose,
  onEndRoom,
  roomType,
}: InRoomMenuDrawerProps) {
  const [activeTab, setActiveTab] = useState<MenuTab>('menu');
  const [isRecording, setIsRecording] = useState(false);
  const [liveCaptions, setLiveCaptions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Maya', time: '2:14 PM', text: 'This is great!' },
    { id: '2', sender: 'Kabir', time: '2:15 PM', text: 'Love this.' },
    { id: '3', sender: 'Tara', time: '2:16 PM', text: 'Can you share that link?' },
  ]);

  // Participants state
  const [participants, setParticipants] = useState([
    { id: '1', name: 'You', role: 'Host', isMuted: false },
    { id: '2', name: 'Aarav', role: 'Speaker', isMuted: false },
    { id: '3', name: 'Maya', role: 'Speaker', isMuted: false },
    { id: '4', name: 'Kabir', role: 'Speaker', isMuted: true },
  ]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://supertime.so/room/${Math.random().toString(36).substring(7)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'You',
        time: 'Just now',
        text: chatInput.trim(),
      },
    ]);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end justify-center">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl border-t border-neutral-200 dark:border-neutral-800 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          {activeTab !== 'menu' ? (
            <button
              onClick={() => setActiveTab('menu')}
              className="p-1.5 -ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <h3 className="font-semibold text-sm">
            {activeTab === 'menu' && 'In Room Menu'}
            {activeTab === 'chat' && 'Chat'}
            {activeTab === 'participants' && `Participants (${participants.length})`}
            {activeTab === 'invite' && 'Invite People'}
            {activeTab === 'settings' && 'Room Settings'}
          </h3>

          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* ──────── Menu Main View ──────── */}
          {activeTab === 'menu' && (
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('chat')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <MessageSquare className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span>Chat</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                onClick={() => setActiveTab('participants')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Users className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span>Participants</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                onClick={() => setActiveTab('invite')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <UserPlus className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span>Invite</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Share2 className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span>Share room link</span>
                </div>
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              </button>

              {/* Toggles */}
              <div className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Disc className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span>Record</span>
                </div>
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isRecording ? 'bg-red-500' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      isRecording ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Captions className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span>Live captions</span>
                </div>
                <button
                  onClick={() => setLiveCaptions(!liveCaptions)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    liveCaptions ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                      liveCaptions ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={onEndRoom}
                  className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>End room</span>
                </button>
              </div>
            </div>
          )}

          {/* ──────── Chat View ──────── */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[350px]">
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div key={m.id} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold shrink-0">
                      {m.sender[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{m.sender}</span>
                        <span className="text-[10px] text-neutral-400">{m.time}</span>
                      </div>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 mt-0.5">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ──────── Participants View ──────── */}
          {activeTab === 'participants' && (
            <div className="space-y-3">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold">
                      {p.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-[11px] text-neutral-400">{p.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setParticipants((prev) =>
                          prev.map((item) => (item.id === p.id ? { ...item, isMuted: !item.isMuted } : item))
                        );
                      }}
                      className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      {p.isMuted ? (
                        <MicOff className="w-4 h-4 text-red-500" />
                      ) : (
                        <Mic className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      )}
                    </button>
                    <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ──────── Invite Sheet ──────── */}
          {activeTab === 'invite' && (
            <div className="space-y-6 pt-2">
              <div>
                <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Share this link</label>
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-mono truncate mr-2">https://supertime.so/room/abc123</span>
                  <button onClick={handleCopyLink} className="p-1">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-500 font-medium mb-3 block">Share via...</label>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <button
                    onClick={handleCopyLink}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Copy className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium">Copy link</span>
                  </button>

                  <a
                    href="https://api.whatsapp.com/send?text=Join%20my%20Supertime%20room:%20https://supertime.so/room/abc123"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium">WhatsApp</span>
                  </a>

                  <a
                    href="https://t.me/share/url?url=https://supertime.so/room/abc123&text=Join%20my%20Supertime%20room"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
                      <Send className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium">Telegram</span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium">More</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
