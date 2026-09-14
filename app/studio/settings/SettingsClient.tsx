/* eslint-disable @next/next/no-html-link-for-pages */
'use client';

import React, { useState } from 'react';
import {
  Video,
  Mic,
  Save,
  Check,
  Monitor,
  Moon,
  Sun,
  PhoneCall,
  Calendar,
  ExternalLink,
  Zap,
  Sparkles,
  CreditCard,
  Radio,
} from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { useAlertDialog } from '../../components/AlertDialog';

interface SettingsClientProps {
  username?: string;
  initialSettings: {
    videoRate: number;
    audioRate: number;
    isAcceptingCalls?: boolean;
    subscriptionPrice?: number;
    upiId?: string;
    videoProvider?: string;
    isGoogleConnected?: boolean;
    isZoomConnected?: boolean;
    roomType?: 'audio' | 'video';
    isRoomFree?: boolean;
  };
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const { alert: customAlert, AlertDialog } = useAlertDialog();

  // Instant Availability state (Uber Driver Online model)
  const [isAcceptingCalls, setIsAcceptingCalls] = useState<boolean>(initialSettings.isAcceptingCalls ?? true);

  // Pricing & Payouts
  const [pendingVideoRate, setPendingVideoRate] = useState(initialSettings.videoRate ?? 100);
  const [pendingAudioRate, setPendingAudioRate] = useState(initialSettings.audioRate ?? 50);
  const [pendingSubPrice, setPendingSubPrice] = useState(initialSettings.subscriptionPrice ?? 199);
  const [pendingUpiId, setPendingUpiId] = useState(initialSettings.upiId ?? '');

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
          isAcceptingCalls,
          subscriptionPrice: pendingSubPrice,
          upiId: pendingUpiId.trim(),
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
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-foreground">Calls, Rates & Availability</h2>
          <p className="text-sm text-muted mt-1">Control your live status, call pricing, and believer memberships.</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${saveSuccess ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-foreground text-white dark:text-background hover:opacity-90'}`}
        >
          {saveSuccess ? <><Check className="w-4 h-4" /> Saved</> : isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: AVAILABILITY & RATES */}
        <div className="space-y-6">
          {/* INSTANT AVAILABILITY (UBER ONLINE TOGGLE) */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
            <SectionHeader id="availability" title="Instant Availability" icon={<Radio className="w-5 h-5 text-neo-green" />} />
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 border border-border rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isAcceptingCalls ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-zinc-600'}`} />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground">
                    {isAcceptingCalls ? 'Available for Instant Calls' : 'Offline / Scheduled Only'}
                  </h4>
                </div>
                <p className="text-xs text-muted max-w-sm">
                  {isAcceptingCalls 
                    ? 'You appear as "Available Now" on Explore. Believers can call you instantly.' 
                    : 'Instant calling is paused. Believers can only book scheduled timeslots.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAcceptingCalls(!isAcceptingCalls)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAcceptingCalls ? 'bg-green-500' : 'bg-gray-200 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAcceptingCalls ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* CALL PRICING */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
            <SectionHeader id="rates" title="1:1 Session Pricing" icon={<PhoneCall className="w-5 h-5 text-gray-400" />} />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-neo-pink" /> Video Session (30 min)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-medium text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={pendingVideoRate}
                    onChange={(e) => setPendingVideoRate(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-foreground outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-blue-500" /> Audio Session (30 min)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-medium text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={pendingAudioRate}
                    onChange={(e) => setPendingAudioRate(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-foreground outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="250"
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-3">Fans pay this fee upfront via UPI/Cards when booking or calling.</p>
          </div>

          {/* BELIEVER MONTHLY PASS (SUBSCRIPTION) */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
            <SectionHeader id="subscription" title="Believer Monthly Pass" icon={<Sparkles className="w-5 h-5 text-neo-yellow" />} />
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Monthly Membership Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-medium text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={pendingSubPrice}
                    onChange={(e) => setPendingSubPrice(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-foreground outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="199"
                  />
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Fans who subscribe as your <strong>Believers</strong> get monthly recurring call credits and direct messaging access in your Inbox.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PAYOUTS & INTEGRATIONS */}
        <div className="space-y-6">
          {/* UPI PAYOUT ACCOUNT */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
            <SectionHeader id="payout" title="Earnings Payout (UPI)" icon={<CreditCard className="w-5 h-5 text-green-500" />} />
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Your UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={pendingUpiId}
                  onChange={(e) => setPendingUpiId(e.target.value)}
                  placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-foreground outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              <p className="text-xs text-muted">
                Withdrawals from your Wallet will be credited directly to this UPI address.
              </p>
            </div>
          </div>

          {/* MEETING & VIDEO PREFERENCES */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
            <SectionHeader id="integrations" title="Live Meeting Engine" icon={<Calendar className="w-5 h-5 text-gray-400" />} />
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Meeting Service</label>
                <select
                  value={videoProvider}
                  onChange={(e) => setVideoProvider(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm outline-none text-gray-900 dark:text-foreground"
                >
                  <option value="supercalls">Supercalls (In-Browser Instant Call, default)</option>
                  <option value="googlemeet" disabled={!isGoogleConnected}>
                    Google Meet {!isGoogleConnected && '(Connect calendar first)'}
                  </option>
                  <option value="zoom" disabled={!isZoomConnected}>
                    Zoom Rooms {!isZoomConnected && '(Connect Zoom first)'}
                  </option>
                </select>
                <p className="text-[11px] text-muted mt-2">
                  For instant Uber-style calls, Supercalls connects believers and creators in zero-setup WebRTC rooms immediately.
                </p>
              </div>

              {/* Connected Accounts */}
              <div className="pt-2 border-t border-gray-100 dark:border-border space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-background rounded-xl border border-gray-150 dark:border-border">
                  <div className="text-xs font-medium text-gray-900 dark:text-foreground">Google Calendar / Meet</div>
                  {isGoogleConnected ? (
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <a
                      href="/api/auth/google"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 dark:bg-foreground text-white dark:text-background text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Connect <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-background rounded-xl border border-gray-150 dark:border-border">
                  <div className="text-xs font-medium text-gray-900 dark:text-foreground">Zoom Video Rooms</div>
                  {isZoomConnected ? (
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <a
                      href="/api/auth/zoom"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 dark:bg-foreground text-white dark:text-background text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Connect <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* THEME PREFERENCE */}
          <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border p-6 rounded-2xl shadow-sm transition-colors">
            <SectionHeader id="appearance" title="Interface Appearance" icon={<Sun className="w-5 h-5 text-gray-400" />} />
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-gray-200 dark:border-border text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-gray-200 dark:border-border text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs">Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  theme === 'system'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-gray-200 dark:border-border text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {AlertDialog}
    </div>
  );
}
