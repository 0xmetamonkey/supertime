'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Wallet,
  Video,
  History,
  ArrowRight,
  Settings,
  Sparkles,
  User,
  LogOut,
  ChevronRight,
  TrendingUp,
  Clock,
  LayoutDashboard,
  Store,
  UserCircle,
  Wrench,
  Bot,
  MessageSquare,
  Instagram,
  Plus,
  Trash2,
  Send,
  X,
  ShoppingBag,
  Crown,
  Globe
} from 'lucide-react';
import { useClerk } from "@clerk/nextjs";

interface UIProps {
  session: any;
  username: string | null;
  initialBalance: number;
  initialWithdrawable: number;
}

type Tab = 'overview' | 'studio' | 'storefront' | 'profile' | 'tools' | 'wallet' | 'membership';

export default function DashboardClient({ session, username, initialBalance, initialWithdrawable }: UIProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [balance, setBalance] = useState(initialBalance);
  const [withdrawable, setWithdrawable] = useState(initialWithdrawable);

  const [activeTool, setActiveTool] = useState<'none' | 'insta-bot'>('none');
  const [botRules, setBotRules] = useState<{ keywords: string[], response: string, triggerType: 'dm' | 'comment' }[]>([
    {
      keywords: ['price', 'join', 'how'],
      response: "Hey! Thanks for reaching out. You can join my session here: supertime.wtf/" + (username || ''),
      triggerType: 'dm'
    }
  ]);
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const [botStep, setBotStep] = useState<'trigger' | 'action' | 'preview'>('trigger');
  const [newKeyword, setNewKeyword] = useState<{ ruleIndex: number, value: string }>({ ruleIndex: -1, value: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [instagramToken, setInstagramToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [botView, setBotView] = useState<'list' | 'editor'>('list');
  const [selectedCategory, setSelectedCategory] = useState<'dm' | 'comment' | null>(null);

  const [storefrontTab, setStorefrontTab] = useState<'store' | 'courses' | 'about'>('store');

  // Fetch bot config on mount or when tools tab is visited
  useEffect(() => {
    // Sync tab from URL if present
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'studio', 'storefront', 'profile', 'tools', 'wallet', 'membership'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }

    if (activeTab === 'tools') {
      fetch('/api/bot/config')
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            // Handle legacy or multi-rule data
            if (data.rules) {
              setBotRules(data.rules);
              // Safety: Reset index if out of bounds
              if (currentRuleIndex >= data.rules.length) {
                setCurrentRuleIndex(0);
              }
            } else if (data.keywords || data.response) {
              setBotRules([{
                keywords: data.keywords || [],
                response: data.response || "",
                triggerType: 'dm'
              }]);
              setCurrentRuleIndex(0);
            }
            setInstagramToken(data.instagramToken || '');
            setIsConnected(!!data.instagramToken);
            if (data.profilePicture) setProfilePicture(data.profilePicture);
          }
        })
        .catch(err => console.error('Error fetching bot config:', err));
    }
  }, [activeTab]);

  // Initialize Facebook SDK
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    if (!appId) return;

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
    };

    // Load the SDK asynchronously
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as any; js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const handleFacebookLogin = () => {
    if (!(window as any).FB) {
      alert('Facebook SDK not loaded yet.');
      return;
    }

    (window as any).FB.login((response: any) => {
      if (response.authResponse) {
        const userToken = response.authResponse.accessToken;
        // Send this token to our backend to exchange it for a Page Access Token
        handleSaveBotConfig(userToken);
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      scope: 'public_profile,email,instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement',
      return_scopes: true
    });
  };

  const hasActiveRules = botRules.length > 0 && !(botRules.length === 1 && (botRules[0].keywords?.length === 0 || !botRules[0].keywords) && botRules[0].response === "");

  const handleSaveBotConfig = async (fbUserToken?: string) => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          rules: botRules,
          instagramToken: fbUserToken || instagramToken,
          isUserToken: !!fbUserToken
        }),
      });
      if (res.ok) {
        if (fbUserToken) {
          setIsConnected(true);
          setInstagramToken('CONNECTED'); // Visual indicator
        }
        alert('Bot configuration saved successfully!');
      } else {
        alert('Failed to save configuration.');
      }
    } catch (err) {
      console.error('Error saving bot config:', err);
      alert('An error occurred while saving.');
    } finally {
      setSavingConfig(false);
    }
  };

  const isCreator = !!username;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, id: 'overview' as const },
    { label: 'Studio', icon: Video, id: 'studio' as const },
    { label: 'Storefront', icon: Store, id: 'storefront' as const },
    { label: 'Profile', icon: UserCircle, id: 'profile' as const },
    { label: 'Tools', icon: Wrench, id: 'tools' as const },
    { label: 'Membership', icon: Sparkles, id: 'membership' as const },
    { label: 'Wallet', icon: Wallet, id: 'wallet' as const },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-black font-sans selection:bg-neo-pink selection:text-white flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r-4 border-black h-screen sticky top-0 z-50">
        <div className="p-6 border-b-4 border-black">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 bg-black flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_theme(colors.neo-pink)]">
              <Zap className="text-neo-yellow w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">Supertime</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-2 transition-all font-black uppercase text-xs tracking-widest ${activeTab === item.id
                ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-white text-black border-transparent hover:border-black hover:bg-zinc-50'
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t-4 border-black bg-zinc-50">
          <button
            onClick={() => signOut(() => { window.location.href = "/"; })}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE NAV BOTTOM */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black z-50 px-2 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'overview' ? 'text-neo-pink' : 'text-zinc-500'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase text-center">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'studio' ? 'text-neo-pink' : 'text-zinc-500'}`}
          >
            <Video className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase text-center">Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'tools' ? 'text-neo-pink' : 'text-zinc-500'}`}
          >
            <Bot className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase text-center">Tools</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'wallet' ? 'text-neo-pink' : 'text-zinc-500'}`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase text-center">Vault</span>
          </button>
          <button
            onClick={() => {
              // We could open a drawer, but for now let's just cycle to membership or show a tiny indicator
              setActiveTab('membership');
            }}
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'membership' || activeTab === 'profile' || activeTab === 'storefront' ? 'text-neo-pink' : 'text-zinc-500'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase text-center">Pro</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-[#F5F5F5] pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 bg-[#F5F5F5]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center lg:px-12 lg:py-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Balance</span>
              <span className="text-sm font-black text-neo-green">{balance.toLocaleString()} TKN</span>
            </div>
            <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="px-6 lg:px-12 pb-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-12"
          >
            {activeTab === 'overview' && (
              <>
                {/* HEADER SECTION */}
                <motion.section variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="inline-block px-3 py-1 bg-neo-yellow border-2 border-black shadow-[4px_4px_0px_0px_black] mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-black">Insights Center</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                      Welcome, <span className="text-neo-blue">{username || 'Explorer'}</span>.
                    </h1>
                  </div>
                </motion.section>

                {/* MAIN GRID */}
                <div className="grid lg:grid-cols-12 gap-8">
                  {/* LEFT COLUMN: PRIMARY ACTIONS */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* STUDIO CARD */}
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ translateX: 4, translateY: 4, boxShadow: 'none' }}
                        onClick={() => setActiveTab('studio')}
                        className="neo-box bg-neo-pink p-8 border-4 border-black shadow-[12px_12px_0px_0px_black] text-white cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-12">
                          <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black]">
                            <Video className="text-black w-8 h-8" />
                          </div>
                          <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                        </div>
                        <h3 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Creator Studio</h3>
                        <p className="font-bold opacity-80 text-sm leading-relaxed">
                          {isCreator
                            ? "Manage your live status, pricing, and 1:1 sessions."
                            : "Claim your username to start earning as a creator."}
                        </p>
                      </motion.div>

                      {/* WALLET CARD */}
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ translateX: 4, translateY: 4, boxShadow: 'none' }}
                        onClick={() => setActiveTab('wallet')}
                        className="neo-box bg-neo-blue p-8 border-4 border-black shadow-[12px_12px_0px_0px_black] text-white cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-12">
                          <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black]">
                            <Wallet className="text-black w-8 h-8" />
                          </div>
                          <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                        </div>
                        <h3 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Power Vault</h3>
                        <p className="font-bold opacity-80 text-sm leading-relaxed">
                          Recharge credits or withdraw your creator earnings to your bank.
                        </p>
                      </motion.div>
                    </div>

                    {/* RECENT HISTORY PREVIEW */}
                    <motion.section variants={itemVariants} className="pt-8 px-8 py-10 bg-white border-4 border-black shadow-[8px_8px_0px_0px_black]">
                      <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                          <History className="w-8 h-8" /> Recent Activity
                        </h3>
                        <div className="h-1 flex-1 bg-black/10" />
                        <button onClick={() => router.push('/history')} className="text-xs font-black uppercase tracking-widest hover:text-neo-pink transition-colors">See all</button>
                      </div>

                      <div className="space-y-4">
                        <div className="neo-box bg-zinc-50 border-4 border-black p-6 flex justify-between items-center opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center">
                              <Sparkles className="text-neo-yellow w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black uppercase text-sm">Welcome Power</p>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase">System Integration</p>
                            </div>
                          </div>
                          <span className="font-black text-neo-green text-lg">+0 TKN</span>
                        </div>
                      </div>
                    </motion.section>
                  </div>

                  {/* RIGHT COLUMN: STATS */}
                  <div className="lg:col-span-4 space-y-8">
                    <motion.div variants={itemVariants} className="neo-box bg-black text-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_theme(colors.neo-green)]">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neo-green mb-8 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Performance
                      </h4>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold opacity-60 uppercase">Settled Earnings</span>
                            <span className="text-3xl font-black tabular-nums">₹{withdrawable.toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-800 border-[1px] border-zinc-700 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '10%' }} className="h-full bg-neo-green" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border-2 border-zinc-800 bg-zinc-900">
                            <span className="block text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Total Calls</span>
                            <span className="text-xl font-black">0</span>
                          </div>
                          <div className="p-4 border-2 border-zinc-800 bg-zinc-900">
                            <span className="block text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Ratings</span>
                            <span className="text-xl font-black italic">NEW</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="neo-box bg-neo-yellow p-8 border-4 border-black shadow-[12px_12px_0px_0px_black]">
                      <Sparkles className="w-8 h-8 text-black mb-6" />
                      <h4 className="text-xl font-black uppercase tracking-tighter mb-4 italic">The Mission</h4>
                      <p className="text-xs font-bold leading-relaxed text-zinc-800">
                        Presence into bliss. 100% capacity.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'studio' && (
              <div className="space-y-8">
                <div className="neo-box bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_black]">
                  <h3 className="text-3xl font-black uppercase italic mb-6">Studio Management</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Quick Config</label>
                      <button className="neo-btn bg-zinc-950 text-white w-full py-4 border-4" onClick={() => router.push('/studio')}>Go to Studio HUD</button>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed">Adjust your pricing, bio, and live status from the dedicated Studio HUD.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-6 border-4 border-black bg-neo-yellow/10">
                        <span className="text-xs font-black uppercase underline decoration-2 underline-offset-4">Active Pricing</span>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="font-bold uppercase text-xs">Video Call</span>
                          <span className="font-black">100 TKN/min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="neo-box bg-neo-green p-8 border-4 border-black shadow-[8px_8px_0px_0px_black]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">Settled Earnings</span>
                    <h2 className="text-5xl font-black mt-2">₹{withdrawable.toLocaleString()}</h2>
                    <button className="neo-btn bg-black text-white w-full mt-8" onClick={() => router.push('/wallet')}>Withdraw Funds</button>
                  </div>
                  <div className="neo-box bg-neo-pink p-8 border-4 border-black shadow-[12px_12px_0px_0px_black] text-white">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Credit tokens</span>
                    <h2 className="text-5xl font-black mt-2">{balance.toLocaleString()} TKN</h2>
                    <button className="neo-btn bg-white text-black w-full mt-8" onClick={() => router.push('/wallet')}>Top Up Credits</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'membership' && (
              <div className="space-y-12">
                <section className="neo-box bg-black text-white p-10 border-4 border-black shadow-[12px_12px_0px_0px_theme(colors.neo-pink)] overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-neo-pink opacity-20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                  <div className="relative z-10">
                    <div className="inline-block px-3 py-1 bg-neo-pink border-2 border-white mb-6 shadow-[4px_4px_0px_0px_white]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Current Status</span>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                      <div>
                        <h3 className="text-5xl font-black uppercase italic tracking-tighter mb-2">Free Plan</h3>
                        <p className="font-bold opacity-60 uppercase text-xs tracking-widest">Upgrade to unlock full energy potential</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="px-6 py-4 bg-zinc-900 border-2 border-zinc-700">
                          <span className="block text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">DMs Remaining</span>
                          <span className="text-2xl font-black">1,000</span>
                        </div>
                        <div className="px-6 py-4 bg-zinc-900 border-2 border-zinc-700">
                          <span className="block text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Store Limit</span>
                          <span className="text-2xl font-black">1 Item</span>
                        </div>
                        <div className="px-6 py-4 bg-zinc-900 border-2 border-zinc-700">
                          <span className="block text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Calls Remaining</span>
                          <span className="text-2xl font-black">2h 00m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Pro Plan Card */}
                  <div className="neo-box bg-white p-10 border-4 border-black shadow-[12px_12px_0px_0px_black] hover:shadow-[16px_16px_0px_0px_theme(colors.neo-yellow)] transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="text-4xl font-black uppercase italic tracking-tighter">Scale-Up Pro</h4>
                        <p className="text-xs font-black uppercase tracking-widest text-neo-pink">Highly Recommended</p>
                      </div>
                      <div className="w-16 h-16 bg-neo-yellow border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black] group-hover:rotate-12 transition-transform shrink-0">
                        <ShoppingBag className="w-8 h-8 text-black" />
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">₹999</span>
                        <span className="text-[10px] font-bold uppercase opacity-40 tracking-widest">/month</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-10">
                      {[
                        'Unlimited DMs & Automations',
                        'Unlimited 1:1 Calls*',
                        'Unlimited Digital Products',
                        'Verified Creator Badge',
                        'Premium Storefront Themes',
                        'Deep Creator Analytics'
                      ].map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 font-bold uppercase text-[10px] tracking-wide text-zinc-500">
                          <span className="text-black">•</span>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <button className="neo-btn bg-black text-white w-full py-5 text-xl font-black uppercase shadow-[8px_8px_0px_0px_theme(colors.neo-yellow)] hover:shadow-none translate-x-[-4px] translate-y-[-4px] active:translate-x-0 active:translate-y-0 transition-all">
                      Upgrade Now
                    </button>
                    <p className="mt-4 text-[8px] font-bold text-zinc-400 text-center uppercase tracking-widest">*Backed by call commissions</p>
                  </div>

                  {/* Enterprise/Custom Card */}
                  <div className="neo-box bg-neo-blue p-10 border-4 border-black shadow-[12px_12px_0px_0px_black] text-white group">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="text-4xl font-black uppercase italic tracking-tighter">Superstar</h4>
                        <p className="text-xs font-black uppercase tracking-widest opacity-80">Custom Enterprise Solutions</p>
                      </div>
                      <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black] group-hover:bg-neo-green transition-colors shrink-0">
                        <Crown className="w-8 h-8 text-black" />
                      </div>
                    </div>

                    <div className="mb-10 min-h-[140px]">
                      <p className="text-lg font-bold leading-relaxed">
                        Scale your digital empire with custom commission rates, white-label stores, and a dedicated manager to handle your growth.
                      </p>
                    </div>

                    <button className="neo-btn bg-white text-black w-full py-5 text-xl font-black uppercase">
                      Contact Us
                    </button>
                  </div>
                </div>

                <div className="text-center opacity-40">
                  <p className="text-[10px] font-black uppercase tracking-widest">Secure Billing Powered by Razorpay</p>
                </div>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-8">
                {activeTool === 'none' ? (
                  <div className="space-y-12">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">Creator Tools</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Power up your creator workflow</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* INSTA BOT TOOL CARD */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        onClick={() => setActiveTool('insta-bot')}
                        className="neo-box bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_black] cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-neo-pink text-white flex items-center justify-center border-4 border-black mb-6 group-hover:rotate-12 transition-transform">
                          <Bot className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-widest mb-2">Insta Automation</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed mb-6">
                          Auto-reply to DMs & Comments with links to your storefront.
                        </p>
                        <div className="flex items-center gap-2 text-neo-pink font-black uppercase text-xs">
                          Configure <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.div>

                      {/* STORY REPLIES */}
                      <div className="neo-box bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_black] opacity-40 grayscale flex flex-col justify-center items-center text-center border-dashed">
                        <History className="w-8 h-8 mb-4" />
                        <h3 className="text-xl font-black uppercase tracking-widest">Story Replies</h3>
                        <p className="text-[8px] font-bold uppercase mt-2">Coming Soon</p>
                      </div>

                      {/* MAGIC LINKS */}
                      <div className="neo-box bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_black] opacity-40 grayscale flex flex-col justify-center items-center text-center border-dashed">
                        <Zap className="w-8 h-8 mb-4" />
                        <h3 className="text-xl font-black uppercase tracking-widest">Magic Links</h3>
                        <p className="text-[8px] font-bold uppercase mt-2">Coming Soon</p>
                      </div>
                    </div>

                    {/* EXTRA OPTIONS FOOTER */}
                    <div className="flex flex-wrap justify-center gap-12 pt-8 opacity-60">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-neo-yellow" />
                        <span className="text-[10px] font-black uppercase">Most popular automations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neo-blue" />
                        <span className="text-[10px] font-black uppercase">Publish in 3 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-neo-pink" />
                        <span className="text-[10px] font-black uppercase">Preview first, go live when ready</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => {
                          if (selectedCategory) {
                            setSelectedCategory(null);
                            setBotView('list');
                          } else {
                            setActiveTool('none');
                          }
                        }}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-neo-pink transition-colors"
                      >
                        ← {selectedCategory ? 'Back to Categories' : 'Back to All Tools'}
                      </button>
                      {selectedCategory && botView === 'editor' && (
                        <button
                          onClick={() => setBotView('list')}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-neo-blue transition-colors"
                        >
                          ← Back to {selectedCategory === 'dm' ? 'DM' : 'Comment'} List
                        </button>
                      )}
                    </div>

                    <div className="neo-box bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_black]">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b-4 border-black">
                        <div>
                          <h3 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                            <Bot className="w-10 h-10 text-neo-pink" /> Insta {selectedCategory === 'comment' ? 'Comment' : selectedCategory === 'dm' ? 'DM' : 'Bot'}
                          </h3>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Scale your presence with AI-driven responses</p>
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleSaveBotConfig()}
                            disabled={savingConfig}
                            className="neo-btn bg-black text-white px-8 py-3 font-black uppercase text-sm hover:bg-neo-blue transition-colors disabled:opacity-50"
                          >
                            {savingConfig ? 'SAVING...' : 'SAVE CONFIG'}
                          </button>
                          <button
                            onClick={(e) => {
                              if (e.altKey || !isConnected) {
                                if (e.altKey) {
                                  const token = prompt('DEVELOPER MODE: Enter Page Access Token manually:');
                                  if (token) {
                                    setInstagramToken(token);
                                    setIsConnected(true);
                                    handleSaveBotConfig(token);
                                  }
                                } else {
                                  handleFacebookLogin();
                                }
                              } else {
                                if (confirm('Disconnect Instagram?')) {
                                  setInstagramToken('');
                                  setIsConnected(false);
                                  handleSaveBotConfig('');
                                }
                              }
                            }}
                            className={`neo-btn px-8 py-3 font-black uppercase text-sm flex items-center gap-2 transition-colors ${isConnected ? 'bg-neo-green text-black' : 'bg-black text-white hover:bg-neo-pink'}`}
                          >
                            <Instagram className="w-5 h-5" />
                            {isConnected ? 'CONNECTED' : 'CONNECT INSTAGRAM'}
                          </button>
                        </div>
                      </div>

                      {/* CONDITIONAL VIEWS: LIST vs EDITOR */}
                      {/* CONDITIONAL VIEWS: CATEGORY -> LIST -> EDITOR */}
                      {!selectedCategory ? (
                        <div className="space-y-12 py-8">
                          <div className="text-center">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Select your automation track:</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pick a category to manage your automations</p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {/* COMMENT AUTOMATION CARD */}
                            <motion.div
                              whileHover={{ y: -5 }}
                              onClick={() => {
                                setSelectedCategory('comment');
                                const hasComments = botRules.some(r => r.triggerType === 'comment');
                                setBotView(hasComments ? 'list' : 'editor');
                                if (!hasComments) {
                                  setBotRules([...botRules, { keywords: [], response: "", triggerType: 'comment' }]);
                                  setCurrentRuleIndex(botRules.length);
                                  setBotStep('trigger');
                                }
                              }}
                              className="neo-box bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] flex flex-col h-full overflow-hidden cursor-pointer group"
                            >
                              <div className="mb-4">
                                <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-neo-pink transition-colors">Loved by Creators</span>
                                <h4 className="text-xl font-black uppercase leading-tight mt-1">Comment Automation</h4>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase leading-snug mt-2">Send DMs to people who comment specific keywords on your posts</p>
                              </div>
                              <div className="flex-1 bg-[#f3f4f6] border-4 border-black aspect-[16/10] mb-6 relative overflow-hidden p-6 rounded-xl">
                                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                <div className="relative z-10 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-300 border-2 border-black flex-shrink-0 relative overflow-hidden">
                                      {profilePicture && <img src={profilePicture} className="w-full h-full object-cover" alt="" />}
                                    </div>
                                    <div className="bg-white border-2 border-black px-3 py-1.5 rounded-2xl rounded-bl-none shadow-[2px_2px_0px_0px_black]">
                                      <p className="text-[10px] font-bold text-black uppercase">link pls ❤️</p>
                                    </div>
                                  </div>
                                  <div className="pl-10 h-6 flex items-center">
                                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="text-zinc-400">
                                      <path d="M0 0C10 0 30 0 38 18" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                      <path d="M35 15L38 19L41 15" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                  </div>
                                  <div className="flex justify-end gap-2 pr-4">
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="bg-[#e9d5ff] border-2 border-black px-3 py-1.5 rounded-2xl rounded-br-none shadow-[2px_2px_0px_0px_black]">
                                        <p className="text-[10px] font-black text-black uppercase">Here it is ✨</p>
                                      </div>
                                      <div className="bg-[#c084fc] text-white border-2 border-black px-3 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_black]">
                                        <Zap className="w-2.5 h-2.5" /> Link
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full py-4 bg-[#0a66c2] text-white text-center font-black uppercase tracking-widest text-sm rounded-lg group-hover:bg-[#004182] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                SEND A LINK FROM COMMENTS
                              </div>
                            </motion.div>

                            {/* DM AUTOMATION CARD */}
                            <motion.div
                              whileHover={{ y: -5 }}
                              onClick={() => {
                                setSelectedCategory('dm');
                                const hasDMs = botRules.some(r => r.triggerType === 'dm');
                                setBotView(hasDMs ? 'list' : 'editor');
                                if (!hasDMs) {
                                  setBotRules([...botRules, { keywords: [], response: "", triggerType: 'dm' }]);
                                  setCurrentRuleIndex(botRules.length);
                                  setBotStep('trigger');
                                }
                              }}
                              className="neo-box bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] flex flex-col h-full overflow-hidden cursor-pointer group"
                            >
                              <div className="mb-4">
                                <span className="text-[10px] font-black uppercase text-neo-blue group-hover:text-neo-pink transition-colors">Boosts engagement</span>
                                <h4 className="text-xl font-black uppercase leading-tight mt-1">DM Automation</h4>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase leading-snug mt-2">Send customized replies when people DM you specific keywords</p>
                              </div>
                              <div className="flex-1 bg-[#f3f4f6] border-4 border-black aspect-[16/10] mb-6 relative overflow-hidden p-6 rounded-xl">
                                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                <div className="relative z-10 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#d1d5db] border-2 border-black flex-shrink-0" />
                                    <div className="bg-white border-2 border-black px-4 py-1.5 rounded-2xl rounded-bl-none shadow-[2px_2px_0px_0px_black]">
                                      <p className="text-[10px] font-bold text-black uppercase">DEMO</p>
                                    </div>
                                  </div>
                                  <div className="pl-12 h-6 flex items-center">
                                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="text-zinc-400">
                                      <path d="M0 0C10 0 30 0 38 18" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                      <path d="M35 15L38 19L41 15" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="bg-white border-2 border-black px-4 py-1.5 rounded-2xl rounded-br-none shadow-[2px_2px_0px_0px_black]">
                                        <p className="text-[10px] font-black text-black uppercase">Here you go ✨</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <div className="bg-[#c084fc] text-white border-2 border-black px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_black]">
                                          <Zap className="w-2.5 h-2.5" /> Link 1
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full py-4 bg-[#0a66c2] text-white text-center font-black uppercase tracking-widest text-sm rounded-lg group-hover:bg-[#004182] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                RESPOND TO ALL YOUR DMS
                              </div>
                            </motion.div>
                          </div>

                          <div className="flex flex-wrap justify-center items-center gap-12 mt-12 py-6 border-t border-zinc-100">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-zinc-50 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_black]">
                                <Zap className="w-4 h-4 text-neo-pink" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase">Most popular</p>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase">Automations</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-zinc-50 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_black]">
                                <Clock className="w-4 h-4 text-neo-blue" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase">Publish in</p>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase">3 Minutes</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-zinc-50 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_black]">
                                <User className="w-4 h-4 text-neo-yellow" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase">Preview first</p>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase">Go live when ready</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : botView === 'list' ? (
                        <div className="space-y-8 py-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xl font-black uppercase italic tracking-widest">
                              Active {selectedCategory === 'dm' ? 'DM' : 'Comment'} Automations
                            </h4>
                            <button
                              onClick={() => {
                                setBotRules([...botRules, { keywords: [], response: "", triggerType: selectedCategory! }]);
                                setCurrentRuleIndex(botRules.length);
                                setBotStep('trigger');
                                setBotView('editor');
                              }}
                              className="neo-btn bg-neo-blue text-white px-6 py-2 font-black uppercase text-[10px] flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" /> Add Automation
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {botRules.map((rule, idx) => {
                              if (rule.triggerType !== selectedCategory) return null;
                              return (
                                <motion.div
                                  key={idx}
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => {
                                    setCurrentRuleIndex(idx);
                                    setBotStep('trigger');
                                    setBotView('editor');
                                  }}
                                  className="neo-box bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_black] cursor-pointer relative group"
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="px-2 py-1 bg-black text-white text-[8px] font-black uppercase rounded">
                                      {rule.triggerType}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Delete this automation?')) {
                                          const newRules = botRules.filter((_, i) => i !== idx);
                                          setBotRules(newRules);
                                          if (currentRuleIndex >= newRules.length) setCurrentRuleIndex(Math.max(0, newRules.length - 1));
                                        }
                                      }}
                                      className="text-zinc-300 hover:text-neo-pink transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <h5 className="text-sm font-black uppercase tracking-tight mb-2 truncate">
                                    {rule.keywords?.length > 0 ? `Trigger: ${rule.keywords.join(', ')}` : 'Empty Keywords'}
                                  </h5>
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase line-clamp-2">
                                    {rule.response || 'No response configured yet'}
                                  </p>
                                  <div className="mt-4 pt-4 border-t-2 border-zinc-100 flex items-center gap-2 text-neo-blue font-black uppercase text-[8px]">
                                    Edit Configuration <ChevronRight className="w-3 h-3" />
                                  </div>
                                </motion.div>
                              );
                            })}
                            {!botRules.some(r => r.triggerType === selectedCategory) && (
                              <div className="lg:col-span-3 flex flex-col items-center justify-center py-10 bg-zinc-50 border-4 border-black border-dashed opacity-70">
                                <Zap className="w-10 h-10 mb-4 text-zinc-400" />
                                <h3 className="text-xl font-black uppercase tracking-widest text-zinc-400">No {selectedCategory?.toUpperCase()} Automations</h3>
                                <p className="text-[10px] font-bold uppercase mt-2 text-zinc-400">Click "Add Automation" to get started!</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid lg:grid-cols-12 gap-12">
                          <div className="lg:col-span-7 space-y-10">
                            {/* WIZARD TABS */}
                            <div className="flex border-4 border-black font-black uppercase text-[10px] tracking-widest overflow-hidden">
                              <button
                                onClick={() => setBotStep('trigger')}
                                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-r-4 border-black ${botStep === 'trigger' ? 'bg-neo-blue text-white' : 'bg-white text-black hover:bg-zinc-50'}`}
                              >
                                <MessageSquare className="w-4 h-4" /> 1. Trigger
                              </button>
                              <button
                                onClick={() => setBotStep('action')}
                                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${botStep === 'action' ? 'bg-neo-pink text-white' : 'bg-white text-black hover:bg-zinc-50'}`}
                              >
                                <Send className="w-4 h-4" /> 2. Reply
                              </button>
                            </div>

                            {/* STEP CONTENT */}
                            <div className="space-y-6">
                              {botStep === 'trigger' ? (
                                <div className="space-y-6">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-3xl font-black uppercase italic tracking-widest">Setup Trigger</h4>
                                    <span className="px-3 py-1 bg-neo-blue text-white text-[8px] font-black uppercase rounded-full">
                                      {botRules[currentRuleIndex]?.triggerType || 'dm'} automation
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">The bot will reply when the message contains ANY of these keywords:</p>

                                  <div className="flex flex-wrap gap-2">
                                    {botRules[currentRuleIndex]?.keywords?.map((kw, i) => (
                                      <div key={i} className="bg-neo-blue text-white border-2 border-black px-3 py-1 flex items-center gap-2 shadow-[4px_4px_0px_0px_black]">
                                        <span className="text-xs font-black uppercase italic">{kw}</span>
                                        <button
                                          onClick={() => {
                                            const newRules = [...botRules];
                                            if (newRules[currentRuleIndex]) {
                                              newRules[currentRuleIndex].keywords = newRules[currentRuleIndex].keywords.filter(k => k !== kw);
                                              setBotRules(newRules);
                                            }
                                          }}
                                          className="hover:text-neo-pink"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="ADD KEYWORD..."
                                        className="bg-zinc-100 border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white"
                                        value={newKeyword.ruleIndex === currentRuleIndex ? newKeyword.value : ''}
                                        onChange={(e) => setNewKeyword({ ruleIndex: currentRuleIndex, value: e.target.value })}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && newKeyword.value.trim()) {
                                            const newRules = [...botRules];
                                            if (newRules[currentRuleIndex]) {
                                              if (!newRules[currentRuleIndex].keywords.includes(newKeyword.value.trim().toLowerCase())) {
                                                newRules[currentRuleIndex].keywords.push(newKeyword.value.trim().toLowerCase());
                                                setBotRules(newRules);
                                              }
                                            }
                                            setNewKeyword({ ruleIndex: -1, value: '' });
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => {
                                          if (newKeyword.value.trim()) {
                                            const newRules = [...botRules];
                                            if (!newRules[currentRuleIndex].keywords.includes(newKeyword.value.trim().toLowerCase())) {
                                              newRules[currentRuleIndex].keywords.push(newKeyword.value.trim().toLowerCase());
                                              setBotRules(newRules);
                                            }
                                            setNewKeyword({ ruleIndex: -1, value: '' });
                                          }
                                        }}
                                        className="bg-black text-white px-3 py-1 border-2 border-black hover:bg-neo-blue transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex justify-end pt-4">
                                    <button onClick={() => setBotStep('action')} className="neo-btn bg-black text-white px-8 py-3 font-black uppercase text-sm flex items-center gap-2">
                                      Next: Action <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xl font-black uppercase italic tracking-widest">Setup Reply</h4>
                                    <span className="px-3 py-1 bg-neo-pink text-white text-[8px] font-black uppercase rounded-full">
                                      Active Rule #{currentRuleIndex + 1}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">This message will be sent to the user:</p>

                                  <div className="space-y-4">
                                    <textarea
                                      value={botRules[currentRuleIndex]?.response || ''}
                                      onChange={(e) => {
                                        const newRules = [...botRules];
                                        if (newRules[currentRuleIndex]) {
                                          newRules[currentRuleIndex].response = e.target.value;
                                          setBotRules(newRules);
                                        }
                                      }}
                                      rows={6}
                                      placeholder="EX: HEY! YOU CAN JOIN MY SESSION HERE: SUPERTIME.WTF/..."
                                      className="w-full bg-zinc-50 border-4 border-black p-4 font-bold text-sm focus:outline-none focus:bg-white transition-colors"
                                    />
                                  </div>
                                  <div className="flex justify-between items-center pt-4">
                                    <button onClick={() => setBotStep('trigger')} className="text-[10px] font-black uppercase text-zinc-400 hover:text-black">← Back to Trigger</button>
                                    <button
                                      onClick={() => {
                                        handleSaveBotConfig();
                                        setBotView('list');
                                      }}
                                      disabled={savingConfig}
                                      className="neo-btn bg-neo-pink text-white px-8 py-3 font-black uppercase text-sm flex items-center gap-2"
                                    >
                                      {savingConfig ? 'SAVING...' : 'FINISH & GO LIVE'} <Zap className="w-4 h-4 shadow-sm" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* OTHER AUTOMATIONS LIST */}
                            <div className="pt-10 border-t-4 border-black border-dashed">
                              <h5 className="text-sm font-black uppercase tracking-widest mb-6">Your Automations</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {botRules.map((rule, idx) => {
                                  if (rule.triggerType !== selectedCategory) return null;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setCurrentRuleIndex(idx);
                                        setBotStep('trigger');
                                      }}
                                      className={`p-4 border-4 border-black text-left transition-all ${currentRuleIndex === idx ? 'bg-zinc-100 shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[4px_4px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5'}`}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="text-[8px] font-black text-white bg-black px-1.5 py-0.5 rounded uppercase">
                                          Rule #{idx + 1}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this rule?')) {
                                              const newRules = botRules.filter((_, i) => i !== idx);
                                              setBotRules(newRules);
                                              if (currentRuleIndex >= newRules.length) setCurrentRuleIndex(Math.max(0, newRules.length - 1));
                                            }
                                          }}
                                          className="p-1 hover:text-neo-pink"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <p className="text-[8px] font-bold text-zinc-400 uppercase truncate">
                                        {rule.keywords.length > 0 ? rule.keywords.join(', ') : 'NO KEYWORDS'}
                                      </p>
                                      <p className="text-[10px] font-black uppercase truncate mt-1">{rule.triggerType}</p>
                                    </button>
                                  );
                                })}
                                <button
                                  onClick={() => {
                                    const newIdx = botRules.length;
                                    setBotRules([...botRules, { keywords: [], response: "", triggerType: selectedCategory! }]);
                                    setCurrentRuleIndex(newIdx);
                                    setBotStep('trigger');
                                  }}
                                  className="p-4 border-4 border-black border-dashed flex flex-col items-center justify-center gap-1 hover:bg-zinc-50 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-[8px] font-black uppercase">Add Rule</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT: PHONE PREVIEW */}
                          <div className="lg:col-span-5 hidden lg:block">
                            <div className="sticky top-10">
                              <div className="mx-auto w-[320px] h-[640px] bg-black rounded-[60px] border-[8px] border-zinc-800 shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-20"></div>
                                <div className="h-full bg-zinc-950 flex flex-col">
                                  <div className="bg-zinc-900 px-6 py-10 border-b border-zinc-800 flex items-center gap-3">
                                    {profilePicture ? (
                                      <img src={profilePicture} className="w-10 h-10 rounded-full border-2 border-neo-pink object-cover" alt="Profile" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neo-yellow via-neo-pink to-neo-blue border-2 border-zinc-800"></div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-white leading-none uppercase">{username || 'houseofextsy'}</span>
                                      <span className="text-[8px] font-bold text-zinc-500 uppercase">Supertime Creator</span>
                                    </div>
                                  </div>
                                  <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                    <div className="flex flex-col items-center space-y-1 py-4">
                                      <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700"></div>
                                      <span className="text-xs font-black text-white uppercase mt-2">Instagram User</span>
                                      <span className="text-[8px] font-bold text-zinc-500 uppercase italic">Followed by 2,401 others</span>
                                    </div>
                                    <div className="flex justify-start">
                                      <div className="bg-zinc-800 rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%] border-2 border-zinc-700">
                                        <p className="text-[10px] font-bold text-zinc-300 uppercase leading-relaxed">
                                          {botRules[currentRuleIndex]?.keywords?.length > 0
                                            ? `Hey! I noticed you ${botRules[currentRuleIndex]?.triggerType === 'comment' ? 'commented' : 'messaged'} about "${botRules[currentRuleIndex]?.keywords[0]}"...`
                                            : `I'm interested in your ${botRules[currentRuleIndex]?.triggerType === 'comment' ? 'recent post' : 'services'}!`}
                                        </p>
                                      </div>
                                    </div>

                                    {/* BOT REPLY PREVIEW */}
                                    <AnimatePresence>
                                      {botRules[currentRuleIndex]?.response && (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          className="flex justify-end"
                                        >
                                          <div className="bg-neo-blue rounded-2xl rounded-br-none px-4 py-3 max-w-[80%] border-2 border-black shadow-[4px_4px_0px_0px_black]">
                                            <p className="text-[10px] font-black text-white uppercase leading-relaxed">
                                              {botRules[currentRuleIndex].response}
                                            </p>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                                    <div className="bg-zinc-800 rounded-full px-4 py-2 flex items-center gap-2 border border-zinc-700">
                                      <span className="text-[8px] font-bold text-zinc-500 uppercase">Message...</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="neo-box bg-neo-yellow/10 p-6 border-4 border-black shadow-[4px_4px_0px_0px_black] flex items-start gap-4">
                      <div className="w-10 h-10 bg-neo-yellow flex items-center justify-center border-4 border-black shrink-0">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black uppercase text-sm italic">Pro Tip: Strategy Selection</h4>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase leading-relaxed">
                          Your bot is currently using **Standard Mode**. It will trigger on exact keyword matches. Upgrade to Premium for AI Fuzzy matching!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'storefront' && (
              <div className="space-y-8">
                <div className="neo-box bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_black] relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b-4 border-black">
                    <div>
                      <h3 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <Store className="w-10 h-10 text-neo-blue" /> Storefront Demo
                      </h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Preview your organized profile layout</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => router.push(`/${username || ''}`)}
                        className="neo-btn bg-black text-white px-8 py-3 font-black uppercase text-sm hover:bg-neo-blue transition-colors"
                      >
                        View Live Profile
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  <div className="max-w-4xl mx-auto border-4 border-black bg-[#F9F9F9] shadow-[12px_12px_0px_0px_black] min-h-[600px] overflow-hidden flex flex-col">
                    {/* MINI HEADER */}
                    <div className="px-6 py-4 flex justify-between items-center bg-white border-b-4 border-black">
                      <div className="flex items-center gap-3">
                        <div className="tiny-call-btn">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="tiny-call-btn">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="monochrome-social">
                          <Instagram className="w-4 h-4" />
                        </div>
                        <div className="monochrome-social">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="monochrome-social">
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* HERO PREVIEW */}
                    <div className="p-8 text-center border-b-4 border-black bg-white">
                      <div className="w-24 h-24 mx-auto border-4 border-black mb-4 flex items-center justify-center bg-neo-yellow shadow-[4px_4px_0px_0px_black]">
                        <UserCircle className="w-12 h-12" />
                      </div>
                      <h4 className="text-3xl font-black uppercase tracking-tighter">@{username || 'CREATOR'}</h4>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2 px-12 leading-relaxed">
                        Helping you scale your digital empire through high-energy sessions and elite digital assets.
                      </p>
                    </div>

                    {/* TABS PREVIEW */}
                    <div className="bg-white flex border-b-4 border-black">
                      <button
                        onClick={() => setStorefrontTab('store')}
                        className={`flex-1 store-tab-btn ${storefrontTab === 'store' ? 'store-tab-active' : 'store-tab-inactive'}`}
                      >
                        Store
                      </button>
                      <button
                        onClick={() => setStorefrontTab('courses')}
                        className={`flex-1 store-tab-btn ${storefrontTab === 'courses' ? 'store-tab-active' : 'store-tab-inactive'}`}
                      >
                        Courses
                      </button>
                      <button
                        onClick={() => setStorefrontTab('about')}
                        className={`flex-1 store-tab-btn ${storefrontTab === 'about' ? 'store-tab-active' : 'store-tab-inactive'}`}
                      >
                        About
                      </button>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="flex-1 p-8">
                      {storefrontTab === 'store' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { name: '15-Min Strategy PDF', price: '₹999', time: '15-Min', type: 'PDF' },
                            { name: 'The Growth Script', price: '₹499', time: '5-Min', type: 'Script' }
                          ].map((item, i) => (
                            <div key={i} className="neo-box bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_black] group hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                              <div className="flex justify-between items-start mb-4">
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-neo-yellow border-2 border-black">{item.time} Value</span>
                                <ShoppingBag className="w-4 h-4 text-zinc-400 group-hover:text-neo-blue transition-colors" />
                              </div>
                              <h5 className="font-black uppercase tracking-tight text-sm mb-1">{item.name}</h5>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase">{item.type}</p>
                              <div className="mt-4 pt-4 border-t-2 border-zinc-50 flex justify-between items-center">
                                <span className="font-black text-neo-green">{item.price}</span>
                                <span className="text-[8px] font-black uppercase text-neo-blue">Buy Now</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {storefrontTab === 'courses' && (
                        <div className="flex flex-col items-center justify-center h-48 py-10 border-4 border-black border-dashed opacity-50 bg-white">
                          <Sparkles className="w-8 h-8 mb-4 text-neo-blue" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Enrollments loading...</p>
                        </div>
                      )}
                      {storefrontTab === 'about' && (
                        <div className="space-y-6">
                          <div className="p-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_black]">
                            <h5 className="text-xs font-black uppercase tracking-widest mb-2 italic">About the Creator</h5>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase leading-relaxed">
                              I've spent 10,000+ minutes mastery my craft. Now I'm packaging that time into bite-sized digital assets for you.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback for empty tabs */}
            {activeTab === 'profile' && (
              <div className="flex flex-col items-center justify-center py-20 bg-white border-4 border-black border-dashed opacity-50">
                <Sparkles className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-black uppercase tracking-widest text-black">Feature Coming Soon</h3>
                <p className="text-[10px] font-bold uppercase mt-2">This module is being synchronized...</p>
                <button className="mt-8 neo-btn bg-black text-white px-8 py-3 font-black uppercase tracking-widest text-sm" onClick={() => router.push(`/${username || ''}`)}>
                  View Public Profile
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
