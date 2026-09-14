'use client';

import React, { useState } from 'react';
import { ArrowLeft, X, Check, Clock, UserCheck } from 'lucide-react';
import { RoomMode } from './RoomModeCards';

interface WaitlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptUser: (user: WaitlistUser) => void;
}

export interface WaitlistUser {
  id: string;
  name: string;
  roomType: RoomMode;
  roomLabel: string;
  durationLabel: string;
  avatarLetter: string;
}

export default function WaitlistDrawer({ isOpen, onClose, onAcceptUser }: WaitlistDrawerProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | RoomMode>('all');
  const [autoAccept, setAutoAccept] = useState(false);

  const [waitlist, setWaitlist] = useState<WaitlistUser[]>([
    { id: '1', name: 'Ananya', roomType: '1v1', roomLabel: '1 : 1', durationLabel: '30 min', avatarLetter: 'A' },
    { id: '2', name: 'Vikram', roomType: 'circle', roomLabel: 'Circle Room', durationLabel: '45 min', avatarLetter: 'V' },
    { id: '3', name: 'Rhea', roomType: 'circle', roomLabel: 'Circle Room', durationLabel: '45 min', avatarLetter: 'R' },
    { id: '4', name: 'Karan', roomType: 'stage', roomLabel: 'Stage Room', durationLabel: '60 min', avatarLetter: 'K' },
    { id: '5', name: 'Meera', roomType: '1v1', roomLabel: '1 : 1', durationLabel: '30 min', avatarLetter: 'M' },
  ]);

  if (!isOpen) return null;

  const filteredList = selectedTab === 'all' 
    ? waitlist 
    : waitlist.filter((u) => u.roomType === selectedTab);

  const handleDismiss = (id: string) => {
    setWaitlist((prev) => prev.filter((u) => u.id !== id));
  };

  const handleAccept = (user: WaitlistUser) => {
    handleDismiss(user.id);
    onAcceptUser(user);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 sm:rounded-3xl rounded-t-3xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">Waitlist</h3>
            <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold">
              {waitlist.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 px-5 py-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: '1v1', label: '1 : 1' },
            { id: 'circle', label: 'Many : Many' },
            { id: 'stage', label: '1 : Many' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as 'all' | RoomMode)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedTab === tab.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Waiting Users */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-sm text-neutral-400">
              No participants currently in this queue.
            </div>
          ) : (
            filteredList.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-semibold text-sm">
                    {user.avatarLetter}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{user.name}</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {user.roomLabel} {user.durationLabel ? `• ${user.durationLabel}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(user)}
                    className="px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all shadow-xs"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDismiss(user.id)}
                    className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Auto-Accept Toggle */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-medium">Auto-accept next</span>
          </div>

          <button
            type="button"
            onClick={() => setAutoAccept(!autoAccept)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoAccept ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                autoAccept ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
