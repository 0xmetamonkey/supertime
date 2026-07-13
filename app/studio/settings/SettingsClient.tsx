/* eslint-disable @next/next/no-html-link-for-pages */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Mic,
  Globe,
  Save,
  Check,
  Monitor,
  Moon,
  Sun,
  PhoneCall,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { useAlertDialog } from '../../components/AlertDialog';

interface SettingsClientProps {
  initialSettings: {
    videoRate: number;
    audioRate: number;
    roomType: 'audio' | 'video';
    isRoomFree: boolean;
    videoProvider?: string;
    isGoogleConnected?: boolean;
    isZoomConnected?: boolean;
  };
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const { alert: customAlert, AlertDialog } = useAlertDialog();

  const [pendingVideoRate, setPendingVideoRate] = useState(initialSettings.videoRate);
  const [pendingAudioRate, setPendingAudioRate] = useState(initialSettings.audioRate);
  const [roomType, setRoomType] = useState<'audio' | 'video'>(initialSettings.roomType || 'audio');
  const [isRoomFree, setIsRoomFree] = useState<boolean>(initialSettings.isRoomFree ?? true);

  // Integrations state
  const [videoProvider, setVideoProvider] = useState<string>(initialSettings.videoProvider || 'supercalls');
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(initialSettings.isGoogleConnected || false);
  const [isZoomConnected, setIsZoomConnected] = useState<boolean>(initialSettings.isZoomConnected || false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoRate: pendingVideoRate,
          audioRate: pendingAudioRate,
          roomType,
          isRoomFree,
          videoProvider,
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      customAlert({
        title: 'Save Failed',
        message: 'Failed to save settings. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const SectionHeader = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children?: React.ReactNode }) => (
    <div className="border-b border-gray-100 dark:border-border pb-4 mb-6 flex justify-between items-center transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="font-sans transition-colors duration-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-foreground">App Preferences & Calls</h2>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${saveSuccess ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-foreground text-white dark:text-background hover:opacity-90'}`}
        >
          {saveSuccess ? <><Check className="w-4 h-4" /> Saved</> : isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* ROOM CONFIGURATION */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
            <SectionHeader id="room" title="Room Config" icon={<Globe className="w-5 h-5 text-gray-400" />} />
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRoomType('audio')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition-all ${roomType === 'audio' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-surface text-gray-500 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Mic className="w-4 h-4" /> Audio Room
                </button>
                <button
                  onClick={() => setRoomType('video')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition-all ${roomType === 'video' ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800' : 'bg-white dark:bg-surface text-gray-500 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Video className="w-4 h-4" /> Video Room
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-border pt-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Entrance Fee</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsRoomFree(true)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${isRoomFree ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-surface text-gray-500 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="font-medium text-sm">Free Entry</span>
                    <span className={`text-xs mt-1 ${isRoomFree ? 'text-green-600/70 dark:text-green-400/70' : 'text-gray-400'}`}>Anyone can join</span>
                  </button>
                  <button
                    onClick={() => setIsRoomFree(false)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${!isRoomFree ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-surface text-gray-500 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="font-medium text-sm">Paid Only</span>
                    <span className={`text-xs mt-1 ${!isRoomFree ? 'text-purple-600/70 dark:text-purple-400/70' : 'text-gray-400'}`}>Requires payment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CALL RATES */}
          {!isRoomFree && (
            <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
              <SectionHeader id="rates" title="Call Rates" icon={<PhoneCall className="w-5 h-5 text-gray-400" />} />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-500" /> Audio Rate / min
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={pendingAudioRate}
                      onChange={(e) => setPendingAudioRate(Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-lg pl-8 pr-3 py-2.5 text-sm font-medium text-gray-900 dark:text-foreground outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4 text-pink-500" /> Video Rate / min
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={pendingVideoRate}
                      onChange={(e) => setPendingVideoRate(Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-lg pl-8 pr-3 py-2.5 text-sm font-medium text-gray-900 dark:text-foreground outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* PREFERENCES */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
            <SectionHeader id="theme" title="Preferences" icon={<Monitor className="w-5 h-5 text-gray-400" />} />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</p>
              <div className="flex bg-gray-100 dark:bg-background rounded-lg p-1 w-full transition-colors">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-surface text-gray-900 dark:text-foreground shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-foreground'}`}
                >
                  <Sun className="w-4 h-4" /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-surface text-gray-900 dark:text-foreground shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-foreground'}`}
                >
                  <Moon className="w-4 h-4" /> Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-surface text-gray-900 dark:text-foreground shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-foreground'}`}
                >
                  <Monitor className="w-4 h-4" /> System
                </button>
              </div>
            </div>
          </div>

          {/* VIDEO MEETING INTEGRATIONS */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors space-y-6">
            <SectionHeader id="integrations" title="Video Integrations" icon={<Calendar className="w-5 h-5 text-gray-400" />} />

            <div className="space-y-4">
              {/* Supercalls Native Engine */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-150 dark:border-border rounded-xl">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-foreground">Supercalls Native Engine</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Built-in recording, screen sharing, and atomic booking locks.</p>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-md">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
              </div>

              {/* Google Calendar & Meet Integration Card */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-150 dark:border-border rounded-xl">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-foreground">Google Calendar & Meet</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Automate unique Google Meet links for bookings</p>
                </div>
                <div className="flex items-center">
                  {isGoogleConnected ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-md">
                        <Check className="w-3.5 h-3.5" /> Linked
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm('Disconnect Google Calendar?')) {
                            await fetch('/api/auth/google/disconnect', { method: 'POST' });
                            setIsGoogleConnected(false);
                            setVideoProvider('supercalls');
                          }
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium ml-2"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <a
                      href="/api/auth/google"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-foreground text-white dark:text-background text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Connect <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Zoom Integration Card */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-150 dark:border-border rounded-xl">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-foreground">Zoom Video Rooms</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Generate dynamic personal Zoom meeting rooms</p>
                </div>
                <div className="flex items-center">
                  {isZoomConnected ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-md">
                        <Check className="w-3.5 h-3.5" /> Linked
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm('Disconnect Zoom?')) {
                            await fetch('/api/auth/zoom/disconnect', { method: 'POST' });
                            setIsZoomConnected(false);
                            setVideoProvider('supercalls');
                          }
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium ml-2"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <a
                      href="/api/auth/zoom"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-foreground text-white dark:text-background text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Connect <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Video Provider Preference Selector */}
            <div className="border-t border-gray-100 dark:border-border pt-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">Preferred Live Meeting Method</label>
              <select
                value={videoProvider}
                onChange={(e) => setVideoProvider(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm outline-none bg-white dark:bg-background text-gray-900 dark:text-foreground"
              >
                <option value="supercalls">Supercalls (Zero-Setup, default)</option>
                <option value="googlemeet" disabled={!isGoogleConnected}>
                  Google Meet {!isGoogleConnected && '(Connect calendar first)'}
                </option>
                <option value="zoom" disabled={!isZoomConnected}>
                  Zoom Rooms {!isZoomConnected && '(Connect Zoom first)'}
                </option>
              </select>
              <p className="text-[10px] text-gray-400 mt-2">
                Clients will receive booking links according to this preference. If the selected service is disconnected or unavailable, Supertime falls back to Supercalls.
              </p>
            </div>
          </div>
        </div>
      </div>
      {AlertDialog}
    </div>
  );
}

