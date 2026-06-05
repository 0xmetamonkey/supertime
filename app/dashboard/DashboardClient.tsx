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
} from 'lucide-react';
import { useClerk, UserButton } from "@clerk/nextjs";

import OverviewTab from './OverviewTab';
import WalletTab from './WalletTab';
import ToolsTab from './ToolsTab';
import StorefrontTab from './StorefrontTab';
import FeastTab from './FeastTab';
import SettingsClient from '../studio/settings/SettingsClient';
import ProfileEditor from './ProfileEditor';
import GlobalStudioRecorder from './GlobalStudioRecorder';
import InboxTab from './InboxTab';

interface UIProps {
  session: any;
  username: string | null;
  initialBalance: number;
  initialWithdrawable: number;
  initialSettings?: any;
}

type Tab = 'overview' | 'storefront' | 'tools' | 'wallet' | 'settings' | 'feast' | 'inbox';

export default function DashboardClient({ session, username, initialBalance, initialWithdrawable, initialSettings }: UIProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [balance, setBalance] = useState(initialBalance);
  const [withdrawable, setWithdrawable] = useState(initialWithdrawable);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'storefront', 'tools', 'wallet', 'settings', 'feast', 'inbox'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, []);

  const isCreator = !!username;

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
    { label: 'Storefront', icon: Store, id: 'storefront' as const },
    { label: 'Tools', icon: Wrench, id: 'tools' as const },
    { label: 'Wallet', icon: Wallet, id: 'wallet' as const },
    { label: 'Settings', icon: Settings, id: 'settings' as const },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden transition-colors">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0 z-50 transition-colors">
        <div className="p-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <span className="text-lg font-medium tracking-tight text-foreground">Supertime</span>
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

        <div className="p-4">
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
          <button
            onClick={() => setActiveTab('storefront')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'storefront' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Store</span>
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'inbox' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Inbox</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'tools' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Bot className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Tools</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'wallet' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Vault</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'settings' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Settings</span>
          </button>
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

            {activeTab === 'tools' && (
              <ToolsTab
                username={username}
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
              <InboxTab />
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
                  }} />
                </div>
                <div className="w-full h-1 bg-black/10 rounded-full my-8" />
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
