'use client';

import React, { useState } from 'react';
import { ArrowLeft, Clock, Users, User, BarChart2, Mic, Hand, UserPlus, MessageSquare, ChevronRight, Play } from 'lucide-react';
import { RoomMode, ROOM_MODES_CONFIG } from './RoomModeCards';

interface RoomPreflightModalProps {
  mode: RoomMode;
  onClose: () => void;
  onOpenRoom: (config: RoomConfig) => void;
}

export interface RoomConfig {
  mode: RoomMode;
  duration: number; // in minutes
  capacity: number;
  acceptFromWaitlist: boolean;
  autoStartNext: boolean;
  allowEveryoneToSpeak: boolean;
  enableRaiseHand: boolean;
  joinFromWaitlist: boolean;
  allowAudienceToSpeak: boolean;
  inviteToStage: boolean;
  enableLiveChat: boolean;
}

export default function RoomPreflightModal({ mode, onClose, onOpenRoom }: RoomPreflightModalProps) {
  const configMeta = ROOM_MODES_CONFIG[mode];
  const Icon = configMeta.icon;

  // 1:1 Config States
  const [duration, setDuration] = useState<number>(configMeta.defaultDuration);
  const [acceptFromWaitlist, setAcceptFromWaitlist] = useState<boolean>(true);
  const [autoStartNext, setAutoStartNext] = useState<boolean>(false);

  // Circle Config States
  const [capacity, setCapacity] = useState<number>(configMeta.defaultCapacity);
  const [allowEveryoneToSpeak, setAllowEveryoneToSpeak] = useState<boolean>(true);
  const [enableRaiseHand, setEnableRaiseHand] = useState<boolean>(true);
  const [joinFromWaitlist, setJoinFromWaitlist] = useState<boolean>(true);

  // Stage Config States
  const [audienceCapacity, setAudienceCapacity] = useState<number>(50);
  const [allowAudienceToSpeak, setAllowAudienceToSpeak] = useState<boolean>(false);
  const [inviteToStage, setInviteToStage] = useState<boolean>(true);
  const [enableLiveChat, setEnableLiveChat] = useState<boolean>(true);

  // Duration / Capacity selector sheets
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCapacityPicker, setShowCapacityPicker] = useState(false);

  const handleLaunch = () => {
    onOpenRoom({
      mode,
      duration,
      capacity: mode === 'stage' ? audienceCapacity : capacity,
      acceptFromWaitlist,
      autoStartNext,
      allowEveryoneToSpeak,
      enableRaiseHand,
      joinFromWaitlist,
      allowAudienceToSpeak,
      inviteToStage,
      enableLiveChat,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white max-w-lg mx-auto shadow-2xl overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 className="text-base font-semibold">{configMeta.title}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{configMeta.badge}</p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 pb-8 pt-4">
        <div className="w-full flex flex-col items-center">
          {/* Big Hero Icon */}
          <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center my-6">
            <Icon className="w-12 h-12 stroke-[1.5] text-neutral-900 dark:text-white" />
          </div>

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 max-w-xs mb-8">
            {configMeta.description}
          </p>

          {/* Configuration List */}
          <div className="w-full space-y-4">
            {/* 1:1 Config */}
            {mode === '1v1' && (
              <>
                <div 
                  onClick={() => setShowDurationPicker(true)}
                  className="flex items-center justify-between py-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Set duration</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                    <span>{duration} min</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Accept from waitlist</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAcceptFromWaitlist(!acceptFromWaitlist)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      acceptFromWaitlist ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        acceptFromWaitlist ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Auto start next</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoStartNext(!autoStartNext)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoStartNext ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        autoStartNext ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}

            {/* Many:Many Circle Config */}
            {mode === 'circle' && (
              <>
                <div 
                  onClick={() => setShowCapacityPicker(true)}
                  className="flex items-center justify-between py-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Room capacity</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                    <span>{capacity} people</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Allow everyone to speak</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowEveryoneToSpeak(!allowEveryoneToSpeak)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      allowEveryoneToSpeak ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        allowEveryoneToSpeak ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Hand className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Enable raise hand</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableRaiseHand(!enableRaiseHand)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enableRaiseHand ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        enableRaiseHand ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Join from waitlist</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJoinFromWaitlist(!joinFromWaitlist)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      joinFromWaitlist ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        joinFromWaitlist ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}

            {/* 1:Many Stage Config */}
            {mode === 'stage' && (
              <>
                <div 
                  onClick={() => setShowCapacityPicker(true)}
                  className="flex items-center justify-between py-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Audience capacity</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                    <span>{audienceCapacity} people</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Allow audience to speak</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowAudienceToSpeak(!allowAudienceToSpeak)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      allowAudienceToSpeak ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        allowAudienceToSpeak ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Invite to stage</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInviteToStage(!inviteToStage)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      inviteToStage ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        inviteToStage ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.75]" />
                    <span className="text-sm font-medium">Enable live chat</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableLiveChat(!enableLiveChat)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enableLiveChat ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        enableLiveChat ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Big Launch CTA Button */}
        <div className="w-full pt-8">
          <button
            type="button"
            onClick={handleLaunch}
            className="w-full py-4 rounded-full bg-neutral-900 hover:bg-black text-white font-semibold text-sm transition-all shadow-md active:scale-[0.98] dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
          >
            {mode === '1v1' && 'Open 1 : 1 Room'}
            {mode === 'circle' && 'Open Circle Room'}
            {mode === 'stage' && 'Open Stage Room'}
          </button>
        </div>
      </div>

      {/* Quick Duration Picker Modal */}
      {showDurationPicker && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-base mb-4 text-center">Select Session Duration</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => { setDuration(mins); setShowDurationPicker(false); }}
                  className={`py-3 rounded-2xl border text-sm font-medium transition-all ${
                    duration === mins
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDurationPicker(false)}
              className="w-full py-2.5 text-xs text-neutral-500 dark:text-neutral-400 text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Capacity Picker Modal */}
      {showCapacityPicker && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-base mb-4 text-center">
              {mode === 'circle' ? 'Select Room Capacity' : 'Select Audience Capacity'}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(mode === 'circle' ? [4, 8, 12, 16] : [25, 50, 100, 500]).map((cap) => (
                <button
                  key={cap}
                  onClick={() => {
                    if (mode === 'circle') setCapacity(cap);
                    else setAudienceCapacity(cap);
                    setShowCapacityPicker(false);
                  }}
                  className={`py-3 rounded-2xl border text-sm font-medium transition-all ${
                    (mode === 'circle' ? capacity : audienceCapacity) === cap
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  {cap} people
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCapacityPicker(false)}
              className="w-full py-2.5 text-xs text-neutral-500 dark:text-neutral-400 text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
