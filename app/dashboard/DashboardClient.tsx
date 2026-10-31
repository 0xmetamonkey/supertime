/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, @next/next/no-img-element, jsx-a11y/alt-text */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Wallet,
  Settings,
  LogOut,
  LayoutDashboard,
  Calendar,
  Share,
  CheckCircle,
  MessageSquare,
  User,
  Sun,
  Moon,
  Sparkles,
  PhoneCall,
  Zap,
  QrCode,
} from 'lucide-react';
import { useClerk, UserButton } from "@clerk/nextjs";

import OverviewTab from './OverviewTab';
import WalletTab from './WalletTab';
import BookingsTab from './BookingsTab';
import ProfileEditor from './ProfileEditor';
import SettingsClient from '../studio/settings/SettingsClient';
import InboxTab from './InboxTab';
import { useTheme } from '../components/ThemeProvider';
import MessagesPanel from '../components/chat/upgrade/MessagesPanel';
import ActiveChatWindow from '../components/chat/upgrade/ActiveChatWindow';
import ProfileQRModal from '../components/ProfileQRModal';

interface UIProps {
  session: any;
  username: string | null;
  role?: string | null;
  initialBalance: number;
  initialWithdrawable: number;
  initialSettings?: any;
}

type Tab = 'overview' | 'bookings' | 'wallet' | 'settings' | 'inbox';

export default function DashboardClient({ session, username: initialUsername, role: initialRole, initialBalance, initialWithdrawable, initialSettings }: UIProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();

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
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [unreadFrom, setUnreadFrom] = useState<Set<string>>(new Set());
  const [chatListRefreshKey, setChatListRefreshKey] = useState(0);

  const hasUnreadInbox = unreadFrom.size > 0;

  // Listen for unread chat events from GlobalChatListener
  useEffect(() => {
    const handler = (e: Event) => {
      const from = (e as CustomEvent).detail?.from?.toLowerCase();
      if (from) {
        setUnreadFrom(prev => {
          const next = new Set(prev);
          next.add(from);
          return next;
        });
      }
    };
    window.addEventListener('supertime:unread-chat', handler);
    return () => window.removeEventListener('supertime:unread-chat', handler);
  }, []);

  // Automatically mark the current active chat user as read
  useEffect(() => {
    if (activeTab === 'inbox' && activeChatUser) {
      const recipientLower = activeChatUser.toLowerCase();
      if (unreadFrom.has(recipientLower)) {
        setUnreadFrom(prev => {
          const next = new Set(prev);
          next.delete(recipientLower);
          return next;
        });
      }
    }
  }, [activeTab, activeChatUser, unreadFrom]);

  // Derived state: sidebar is collapsed when a chat is open
  const isSidebarCollapsed = activeTab === 'inbox' && !!activeChatUser;
  // Chat view mode: split-screen when a chat is active
  const isChatSplitView = activeTab === 'inbox' && !!activeChatUser;

  // Sync tab and active chat user from URL parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const toParam = searchParams.get('to');
    if (tabParam && ['overview', 'bookings', 'wallet', 'settings', 'inbox'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    } else if (toParam) {
      setActiveTab('inbox');
    }

    if (toParam) {
      setActiveChatUser(toParam);
    }
  }, [searchParams]);

  // Sync state changes back to URL parameters dynamically
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab);
      changed = true;
    }

    if (activeTab === 'inbox' && activeChatUser) {
      if (params.get('to') !== activeChatUser) {
        params.set('to', activeChatUser);
        changed = true;
      }
    } else {
      if (params.has('to')) {
        params.delete('to');
        changed = true;
      }
    }

    if (changed) {
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [activeTab, activeChatUser]);

  // Clear activeChatUser when switching away from inbox
  const handleTabChange = (tab: Tab) => {
    if (tab !== 'inbox') {
      setActiveChatUser(null);
    }
    setActiveTab(tab);
  };

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
            <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">S</span>
            </div>
          </div>

          {onboardingStep === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-foreground text-center mb-2">Welcome to Supertime</h1>
              <p className="text-muted text-center mb-8">How do you plan to use the platform?</p>

              <div className="space-y-4">
                <button
                  onClick={() => { setSelectedRole('creator'); setOnboardingStep(2); }}
                  className="w-full flex items-center p-4 border border-border rounded-xl hover:border-foreground hover:bg-foreground/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center group-hover:bg-foreground/10 transition-colors shrink-0 mr-4">
                    <Sparkles className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">I am a Creator</h3>
                    <p className="text-sm text-muted">I want to host paid calls, receive tips, and connect with my believers.</p>
                  </div>
                </button>

                <button
                  onClick={() => { setSelectedRole('fan'); setOnboardingStep(2); }}
                  className="w-full flex items-center p-4 border border-border rounded-xl hover:border-foreground hover:bg-foreground/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center group-hover:bg-foreground/10 transition-colors shrink-0 mr-4">
                    <MessageSquare className="w-6 h-6 text-foreground" />
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
                  className="w-full pl-10 pr-4 py-4 bg-background border border-border rounded-xl text-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-foreground/50 transition-all"
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
                  className="flex-1 bg-foreground text-background font-semibold py-4 rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isClaiming ? <div className="w-4 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : "Complete Setup"}
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
    { label: 'Bookings', icon: Calendar, id: 'bookings' as const },
    { label: 'Inbox', icon: MessageSquare, id: 'inbox' as const },
    { label: 'Wallet', icon: Wallet, id: 'wallet' as const },
    ...(isCreator ? [
      { label: 'Settings', icon: Settings, id: 'settings' as const },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden transition-colors">
      {/* COLLAPSIBLE SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col bg-surface border-r border-border h-screen sticky top-0 z-50 sidebar-collapsible ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ width: isSidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-expanded)' }}
      >
        <div className={`p-6 ${isSidebarCollapsed ? 'px-4 flex justify-center' : ''}`}>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => router.push('/')}>
            {isSidebarCollapsed ? (
              <span className="text-lg font-bold text-foreground">S</span>
            ) : (
              <>
                <span className="text-lg font-medium tracking-tight text-foreground sidebar-logo-text">Supertime</span>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-foreground text-background px-1.5 py-0.5 rounded-full shadow-sm">Beta</span>
              </>
            )}
          </div>
        </div>

        <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`sidebar-nav-item relative w-full flex items-center gap-3 rounded-md transition-all text-sm font-medium ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-2.5'
                } ${activeTab === item.id
                  ? 'bg-background text-foreground'
                  : 'text-muted hover:bg-background hover:text-foreground'
                }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="sidebar-label">{item.label}</span>}
              {isSidebarCollapsed && <span className="sidebar-tooltip">{item.label}</span>}
              {item.id === 'inbox' && hasUnreadInbox && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neo-pink opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neo-pink" />
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} space-y-2`}>
          <button
            onClick={() => router.push('/roulette')}
            className={`sidebar-nav-item relative w-full flex items-center gap-2 text-sm font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-md transition-all ${
              isSidebarCollapsed ? 'justify-center px-0 py-3' : 'justify-center px-4 py-2.5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            {!isSidebarCollapsed && <span>Live Roulette</span>}
            {isSidebarCollapsed && <span className="sidebar-tooltip">Roulette</span>}
          </button>
          <button
            onClick={() => window.location.href = "/pricing"}
            className={`sidebar-nav-item relative w-full flex items-center gap-2 text-sm font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-all ${
              isSidebarCollapsed ? 'justify-center px-0 py-3' : 'justify-center px-4 py-2.5'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Upgrade to Pro</span>}
            {isSidebarCollapsed && <span className="sidebar-tooltip">Upgrade</span>}
          </button>
          <button
            onClick={() => signOut(() => { window.location.href = "/"; })}
            className={`sidebar-nav-item relative w-full flex items-center gap-3 text-sm font-medium text-muted hover:bg-background hover:text-foreground rounded-md transition-all ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-2.5'
              }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="sidebar-label">Logout</span>}
            {isSidebarCollapsed && <span className="sidebar-tooltip">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE DASHBOARD VIEW — sub-tabs moved to header for clean native navigation */}

      {/* MAIN CONTENT AREA */}
      {isChatSplitView ? (
        /* ── CHAT SPLIT-SCREEN MODE ── */
        <main className="flex-1 h-screen flex overflow-hidden bg-background transition-colors">
          {/* Left: Messages Panel (conversation list) */}
          <div className={`${activeChatUser ? 'hidden lg:flex' : 'flex'} flex-col`}>
            <MessagesPanel
              key={chatListRefreshKey}
              username={username || ''}
              activeChatUser={activeChatUser}
              onSelectChat={(chatUser) => setActiveChatUser(chatUser)}
              unreadFrom={unreadFrom}
            />
          </div>

          {/* Right: Active Chat Window */}
          {activeChatUser && session && (
            <div className={`${activeChatUser ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}>
              <ActiveChatWindow
                user={{
                  id: session.user.id,
                  username: username || '',
                  email: session.user.email || '',
                }}
                recipient={activeChatUser}
                balance={balance}
                onBack={() => setActiveChatUser(null)}
                onDeleteChat={() => setChatListRefreshKey(k => k + 1)}
              />
            </div>
          )}

          {/* Placeholder when no chat selected (desktop) */}
          {!activeChatUser && (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-background">
              <div className="text-center">
                <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-1">Select a conversation</h3>
                <p className="text-muted text-sm">Choose a chat from the list to start messaging</p>
              </div>
            </div>
          )}
        </main>
      ) : (
        /* ── NORMAL DASHBOARD MODE ── */
        <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-background pb-20 lg:pb-0 transition-colors">
          <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md px-4 sm:px-6 py-3.5 lg:px-12 lg:py-6 border-b border-border/60 transition-colors">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {menuItems.find(m => m.id === activeTab)?.label}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3">
                {username && (
                  <>
                    <a
                      href={`/${username}`}
                      target="_blank"
                      className="hidden md:flex items-center gap-2 text-xs font-medium text-muted hover:text-foreground transition-colors"
                    >
                      @{username}
                    </a>
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-surface transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-foreground" />
                      <span className="hidden sm:inline">QR & Share</span>
                    </button>
                    <div className="flex items-center">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Horizontal Sub-Tab Strip */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 -mx-1 px-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-foreground text-background shadow-xs'
                      : 'bg-surface border border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.id === 'inbox' && hasUnreadInbox && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              ))}
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
                  setActiveTab={(tab: string) => handleTabChange(tab as Tab)}
                />
              )}

              {activeTab === 'bookings' && (
                <BookingsTab
                  username={username || ''}
                />
              )}

              {activeTab === 'inbox' && (
                <InboxTab
                  username={username || ''}
                  onSelectChat={(chatUser: string) => setActiveChatUser(chatUser)}
                  unreadFrom={unreadFrom}
                  setUnreadFrom={setUnreadFrom}
                />
              )}

              {activeTab === 'wallet' && (
                <WalletTab
                  balance={balance}
                  withdrawable={withdrawable}
                />
              )}

              {activeTab === 'settings' && (
                <div className="space-y-12">
                  <div className="mb-12">
                    <ProfileEditor username={username || ''} initialSettings={{
                      profileImage: initialSettings?.profileImage || '',
                      coverImage: initialSettings?.coverImage || '',
                      socials: initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' },
                      faqs: initialSettings?.faqs || [],
                      templates: initialSettings?.templates || [],
                      displayName: initialSettings?.displayName || '',
                      bio: initialSettings?.bio || '',
                    }} />
                  </div>
                  <div className="w-full h-px bg-border my-8" />
                  <SettingsClient initialSettings={{
                    videoRate: initialSettings?.videoRate ?? 100,
                    audioRate: initialSettings?.audioRate ?? 50,
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
      )}

      {/* Profile QR & Share Modal */}
      {username && (
        <ProfileQRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          username={username}
          profileImage={initialSettings?.profileImage}
          bio={initialSettings?.bio}
        />
      )}
    </div>
  );
}
