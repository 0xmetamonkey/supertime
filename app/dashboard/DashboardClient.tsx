'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Settings,
  LogOut,
  LayoutDashboard,
  Store,
  Wrench,
  Bot,
  Share,
  CheckCircle,
  FileText,
  MessageSquare,
  User,
  Heart,
  Zap,
} from 'lucide-react';
import { useClerk, UserButton } from "@clerk/nextjs";

import OverviewTab from './OverviewTab';
import WalletTab from './WalletTab';
import ToolsTab from './ToolsTab';
import StorefrontTab from './StorefrontTab';
import FeastTab from './FeastTab';
import ProfileEditor from './ProfileEditor';
import GlobalStudioRecorder from './GlobalStudioRecorder';
import InboxTab from './InboxTab';
import FundraiserManager from './FundraiserManager';
import SettingsClient from '../studio/settings/SettingsClient';

interface UIProps {
  session: any;
  username: string | null;
  role?: string | null;
  initialBalance: number;
  initialWithdrawable: number;
  initialSettings?: any;
}

type Tab = 'overview' | 'storefront' | 'wallet' | 'settings' | 'feast' | 'inbox' | 'fundraise';

export default function DashboardClient({ session, username: initialUsername, role: initialRole, initialBalance, initialWithdrawable, initialSettings }: UIProps) {
  const router = useRouter();
  const { signOut } = useClerk();

  // Platform Identity State
  const [username, setUsername] = useState(initialUsername);
  const [role, setRole] = useState(initialRole);

  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [claimInput, setClaimInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'creator' | 'fan' | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [balance, setBalance] = useState(initialBalance);
  const [withdrawable, setWithdrawable] = useState(initialWithdrawable);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'storefront', 'wallet', 'settings', 'feast', 'inbox', 'fundraise'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, []);

  const handleCompleteOnboarding = async () => {
    if (!claimInput || !selectedRole) return;
    setIsClaiming(true);
    setClaimError('');
    try {
      const { completeOnboarding } = await import('../actions');
      const res = await completeOnboarding(claimInput, selectedRole);
      if (res.success) {
        setUsername(res.username);
        setRole(res.role);
        // Force a hard refresh to ensure server components (like the Global Chat Listener) pick up the new KV data
        window.location.href = '/dashboard';
      }
    } catch (e: any) {
      setClaimError(e.message || 'Failed to claim username.');
      setIsClaiming(false);
    }
  };

  // --- THE ONBOARDING GATE ---
  if (!username || !role) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-surface border border-border p-8 rounded-3xl shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-neo-pink/10 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-neo-pink">S</span>
            </div>
          </div>

          {onboardingStep === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-foreground text-center mb-2">Welcome to Supertime</h1>
              <p className="text-muted text-center mb-8">How do you plan to use the platform?</p>

              <div className="space-y-4">
                <button
                  onClick={() => { setSelectedRole('creator'); setOnboardingStep(2); }}
                  className="w-full flex items-center p-4 border border-border rounded-xl hover:border-neo-pink hover:bg-neo-pink/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center group-hover:bg-neo-pink/10 transition-colors shrink-0 mr-4">
                    <Store className="w-6 h-6 text-foreground group-hover:text-neo-pink" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">I am a Creator</h3>
                    <p className="text-sm text-muted">I want to host paid calls, sell digital products, and manage my audience.</p>
                  </div>
                </button>

                <button
                  onClick={() => { setSelectedRole('fan'); setOnboardingStep(2); }}
                  className="w-full flex items-center p-4 border border-border rounded-xl hover:border-neo-pink hover:bg-neo-pink/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center group-hover:bg-neo-pink/10 transition-colors shrink-0 mr-4">
                    <MessageSquare className="w-6 h-6 text-foreground group-hover:text-neo-pink" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">I am a Fan</h3>
                    <p className="text-sm text-muted">I just want to message and book calls with my favorite creators.</p>
                  </div>
                </button>
              </div>

              <div className="mt-8 text-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground text-center mb-2">Choose your identity</h1>
              <p className="text-muted text-center mb-8">This is your unique handle on Supertime.</p>

              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium text-lg">@</span>
                <input
                  type="text"
                  value={claimInput}
                  onChange={(e) => {
                    setClaimInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    setClaimError('');
                  }}
                  placeholder="username"
                  className="w-full pl-10 pr-4 py-4 bg-background border border-border rounded-xl text-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-neo-pink/50 transition-all"
                />
              </div>

              {claimError && (
                <p className="text-red-500 text-sm mb-6 text-center font-medium bg-red-500/10 py-2 rounded-lg">{claimError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="px-6 py-4 rounded-xl border border-border text-foreground font-medium hover:bg-surface transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={!claimInput || isClaiming}
                  className="flex-1 bg-neo-pink text-white font-semibold py-4 rounded-xl hover:bg-neo-pink/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isClaiming ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Complete Setup"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // --- THE DASHBOARD ---
  const isCreator = role === 'creator';

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, id: 'overview' as const },
    { label: 'Feast', icon: FileText, id: 'feast' as const },
    { label: 'Inbox', icon: MessageSquare, id: 'inbox' as const },
    ...(isCreator ? [
      { label: 'Storefront', icon: Store, id: 'storefront' as const },
      { label: 'Fundraise', icon: Heart, id: 'fundraise' as const },
    ] : []),
    { label: 'Wallet', icon: Wallet, id: 'wallet' as const },
    ...(isCreator ? [
      { label: 'Settings', icon: Settings, id: 'settings' as const },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden transition-colors">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0 z-50 transition-colors">
        <div className="p-6">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => router.push('/')}>
            <span className="text-lg font-medium tracking-tight text-foreground">Supertime</span>
            <span className="text-[9px] font-bold uppercase tracking-widest bg-neo-pink text-white px-1.5 py-0.5 rounded-full shadow-sm">Beta</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all text-sm font-medium ${activeTab === item.id
                ? 'bg-background text-foreground'
                : 'text-muted hover:bg-background hover:text-foreground'
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-2">
          <button
            onClick={() => window.location.href = "/pricing"}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-all"
          >
            <Zap className="w-4 h-4" /> Upgrade to Pro
          </button>
          <button
            onClick={() => signOut(() => { window.location.href = "/"; })}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted hover:bg-background hover:text-foreground rounded-md transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE NAV BOTTOM */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 px-2 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
        <div className="flex justify-around items-center">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'overview' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Home</span>
          </button>
          {isCreator && (
            <button
              onClick={() => setActiveTab('storefront')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'storefront' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <Store className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide text-center">Store</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'inbox' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Inbox</span>
          </button>
          {isCreator && (
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'tools' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <Bot className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide text-center">Tools</span>
            </button>
          )}
          {isCreator && (
            <button
              onClick={() => setActiveTab('fundraise')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'fundraise' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide text-center">Fundraise</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'wallet' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Vault</span>
          </button>
          {isCreator && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'settings' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide text-center">Settings</span>
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-background pb-20 lg:pb-0 transition-colors">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex justify-between items-center lg:px-12 lg:py-8 border-b border-border transition-colors">
          <h2 className="text-lg font-medium text-foreground">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-3">
            {username && (
              <>
                <a
                  href={`/${username}`}
                  target="_blank"
                  className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  supertime.wtf/{username}
                </a>
                <button
                  onClick={async () => {
                    const url = `https://supertime.wtf/${username}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({ url });
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      } catch (e) {
                        navigator.clipboard.writeText(url);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }
                    } else {
                      navigator.clipboard.writeText(url);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-surface transition-colors"
                >
                  {copiedLink ? <><CheckCircle className="w-4 h-4 text-green-500" /> Shared</> : <><Share className="w-4 h-4" /> Share</>}
                </button>
                <div className="ml-2 flex items-center">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            )}
          </div>
        </header>

        <div className="px-6 lg:px-12 pb-12 pt-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-12"
          >
            {activeTab === 'overview' && (
              <OverviewTab
                username={username}
                initialSettings={initialSettings}
                balance={balance}
                withdrawable={withdrawable}
                setActiveTab={(tab: string) => setActiveTab(tab as Tab)}
              />
            )}

            {activeTab === 'wallet' && (
              <WalletTab
                balance={balance}
                withdrawable={withdrawable}
              />
            )}



            {activeTab === 'storefront' && (
              <StorefrontTab
                username={username}
                initialSettings={initialSettings}
              />
            )}

            {activeTab === 'feast' && (
              <FeastTab
                username={username || ''}
              />
            )}

            {activeTab === 'inbox' && (
              <InboxTab username={username || ''} />
            )}

            {activeTab === 'fundraise' && (
              <FundraiserManager username={username || ''} />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-12">
                <div className="mb-12">
                  <ProfileEditor username={username || ''} initialSettings={{
                    profileImage: initialSettings?.profileImage || '',
                    socials: initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' },
                    faqs: initialSettings?.faqs || [],
                    templates: initialSettings?.templates || [],
                    displayName: initialSettings?.displayName || '',
                    bio: initialSettings?.bio || '',
                  }} />
                </div>
                <div className="w-full h-px bg-border my-8" />
                <SettingsClient username={username || ''} initialSettings={{
                  videoRate: initialSettings?.videoRate ?? 100,
                  audioRate: initialSettings?.audioRate ?? 50,
                  socials: initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' },
                  profileImage: initialSettings?.profileImage || '',
                  templates: initialSettings?.templates || [],
                  faqs: initialSettings?.faqs || [],
                  roomType: initialSettings?.roomType || 'audio',
                  isRoomFree: initialSettings?.isRoomFree ?? true,
                  videoProvider: initialSettings?.videoProvider || 'supercalls',
                  isGoogleConnected: initialSettings?.isGoogleConnected ?? false,
                  isZoomConnected: initialSettings?.isZoomConnected ?? false,
                }} />
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Floating Studio Recorder */}
      {username && <GlobalStudioRecorder username={username} />}
    </div>
  );
}
