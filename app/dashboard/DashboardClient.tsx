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
  Globe,
  Loader2,
  Upload,
  Link,
  Calendar,
  FileText,
  Eye,
  Edit2,
  Package,
  Copy,
  CheckCircle,
  Heart
} from 'lucide-react';
import { useClerk, UserButton } from "@clerk/nextjs";
import SettingsClient from '../studio/settings/SettingsClient';
import ProfileEditor from './ProfileEditor';
import SetupChecklist from './SetupChecklist';
import FundraiserManager from './FundraiserManager';

interface UIProps {
  session: any;
  username: string | null;
  initialBalance: number;
  initialWithdrawable: number;
  initialSettings?: any;
}

type Tab = 'overview' | 'storefront' | 'tools' | 'wallet' | 'settings';

export default function DashboardClient({ session, username, initialBalance, initialWithdrawable, initialSettings }: UIProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [balance, setBalance] = useState(initialBalance);
  const [withdrawable, setWithdrawable] = useState(initialWithdrawable);
  const [copiedLink, setCopiedLink] = useState(false);

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
  // Live Shows state
  const [showCreateShow, setShowCreateShow] = useState(false);
  const [newShowTitle, setNewShowTitle] = useState('');
  const [newShowDesc, setNewShowDesc] = useState('');
  const [newShowDate, setNewShowDate] = useState('');
  const [newShowTime, setNewShowTime] = useState('');
  const [newShowPrice, setNewShowPrice] = useState('');
  const [newShowSeats, setNewShowSeats] = useState('100');
  const [products, setProducts] = useState<any[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    type: 'digital' as 'digital' | 'link' | 'booking',
    content: '', // download URL for digital, external URL for link, meeting URL for booking
    duration: '', // for booking type
    thumbnail: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Fetch products and bot config
  useEffect(() => {
    // Sync tab from URL if present
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'storefront', 'tools', 'wallet', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }

    if (activeTab === 'storefront') {
      fetch('/api/user/products')
        .then(res => res.json())
        .then(data => setProducts(data.products || []));
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

  // Handle Instagram OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ig_connected') === 'true') {
      setIsConnected(true);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    }
    if (params.get('ig_error')) {
      console.error('Instagram connection error:', params.get('ig_error'));
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const handleInstagramConnect = () => {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    if (!appId) {
      alert('Instagram App ID not configured.');
      return;
    }

    const redirectUri = encodeURIComponent(
      `${window.location.origin}/api/auth/instagram/callback`
    );

    // native Instagram OAuth URL
    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
    ].join(',');

    const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // Open in a popup window instead of redirecting
    const popup = window.open(
      authUrl,
      'instagram_auth',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,status=no`
    );

    // Listen for messages from the popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'IG_AUTH_SUCCESS') {
        setIsConnected(true);
        // Re-fetch config to get the profile picture and status immediately
        fetch('/api/bot/config')
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              if (data.rules) setBotRules(data.rules);
              setInstagramToken(data.instagramToken || '');
              setIsConnected(!!data.instagramToken);
              if (data.profilePicture) setProfilePicture(data.profilePicture);
            }
          })
          .catch(err => console.error('Error re-fetching bot config:', err));

        window.removeEventListener('message', messageListener);
        popup?.close();
      } else if (event.data?.type === 'IG_AUTH_ERROR') {
        console.error('Instagram connection error:', event.data.error);
        window.removeEventListener('message', messageListener);
        popup?.close();
      }
    };

    window.addEventListener('message', messageListener);

    // Fallback if popup blocker prevents the window from opening
    if (!popup) {
      window.location.href = authUrl;
    }
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

  const handleSaveProducts = async (newProducts: any[]) => {
    setProducts(newProducts);
    try {
      await fetch('/api/user/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: newProducts }),
      });
    } catch (err) {
      console.error('Error saving products:', err);
    }
  };

  const handleFileUpload = async (file: File, type: 'product' | 'thumbnail') => {
    if (type === 'product') setUploadingFile(true);
    else setUploadingThumb(true);
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      const data = await res.json();
      if (data.url) {
        if (type === 'product') {
          setProductForm(prev => ({ ...prev, content: data.url }));
        } else {
          setProductForm(prev => ({ ...prev, thumbnail: data.url }));
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      if (type === 'product') setUploadingFile(false);
      else setUploadingThumb(false);
    }
  };

  const handleProductSubmit = () => {
    if (!productForm.name || !productForm.price) return;
    const product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name: productForm.name,
      description: productForm.description,
      price: parseInt(productForm.price),
      type: productForm.type,
      content: productForm.content,
      duration: productForm.duration,
      thumbnail: productForm.thumbnail,
      createdAt: editingProduct?.createdAt || Date.now(),
    };
    let newProducts;
    if (editingProduct) {
      newProducts = products.map(p => p.id === editingProduct.id ? product : p);
    } else {
      newProducts = [...products, product];
    }
    handleSaveProducts(newProducts);
    setProductForm({ name: '', description: '', price: '', type: 'digital', content: '', duration: '', thumbnail: '' });
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const startEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      description: prod.description || '',
      price: String(prod.price || ''),
      type: prod.type || 'digital',
      content: prod.content || '',
      duration: prod.duration || '',
      thumbnail: prod.thumbnail || '',
    });
    setShowProductForm(true);
  };

  const productTypeConfig = {
    digital: { icon: Package, label: 'Digital Product', color: 'neo-green', desc: 'PDF, preset, template, video' },
    link: { icon: Link, label: 'Link / Course', color: 'neo-blue', desc: 'Course, community, resource URL' },
    booking: { icon: Calendar, label: 'Booking / Call', color: 'neo-pink', desc: 'Zoom, Meet, Calendly link' },
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
    { label: 'Storefront', icon: Store, id: 'storefront' as const },
    { label: 'Tools', icon: Wrench, id: 'tools' as const },
    { label: 'Wallet', icon: Wallet, id: 'wallet' as const },
    { label: 'Settings', icon: Settings, id: 'settings' as const },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background text-gray-900 dark:text-foreground font-sans flex overflow-hidden transition-colors">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-surface border-r border-gray-100 dark:border-border h-screen sticky top-0 z-50 transition-colors">
        <div className="p-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <span className="text-lg font-medium tracking-tight text-gray-900 dark:text-foreground">Supertime</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all text-sm font-medium ${activeTab === item.id
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-300'
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
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE NAV BOTTOM */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface border-t border-gray-100 dark:border-border z-50 px-2 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
        <div className="flex justify-around items-center">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'overview' ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('storefront')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'storefront' ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Store</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'tools' ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Bot className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Tools</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'wallet' ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Vault</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'settings' ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide text-center">Settings</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-background pb-20 lg:pb-0 transition-colors">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-background/80 backdrop-blur-md px-6 py-4 flex justify-between items-center lg:px-12 lg:py-8 border-b border-gray-100 dark:border-border transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-foreground">
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
                  onClick={() => {
                    navigator.clipboard.writeText(`https://supertime.wtf/${username}`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {copiedLink ? <><CheckCircle className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
                <div className="ml-2 flex items-center">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            )}
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
                <motion.section variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 dark:text-foreground">
                      Welcome, <span className="text-gray-500 dark:text-gray-400">{username || 'Explorer'}</span>.
                    </h1>
                  </div>
                </motion.section>

                {/* SETUP CHECKLIST */}
                <SetupChecklist
                  username={username || ''}
                  initialSettings={initialSettings}
                  onNavigateTab={(tab: string) => setActiveTab(tab as Tab)}
                />

                {/* MAIN GRID */}
                <div className="grid lg:grid-cols-12 gap-8">
                  {/* LEFT COLUMN: PRIMARY ACTIONS */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* GO LIVE CARD */}
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        onClick={() => router.push('/studio')}
                        className="bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-border shadow-sm cursor-pointer group transition-all hover:shadow-md"
                      >
                        <div className="flex justify-between items-start mb-12">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Video className="w-6 h-6" />
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-foreground mb-2">Go Live Now</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {isCreator
                            ? "Start a broadcast, manage calls, and engage your audience."
                            : "Claim your username to start earning as a creator."}
                        </p>
                      </motion.div>

                      {/* MEMBERSHIP UPSELL CARD */}
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        onClick={() => router.push('/membership')}
                        className="bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-border shadow-sm cursor-pointer group transition-all hover:shadow-md"
                      >
                        <div className="flex justify-between items-start mb-12">
                          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                            <Crown className="w-6 h-6" />
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-foreground mb-2">Scale-Up Pro</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          Upgrade to unlock full energy potential, unlimited DMs, and deep analytics.
                        </p>
                      </motion.div>
                    </div>

                    {/* RECENT HISTORY PREVIEW */}
                    <motion.section variants={itemVariants} className="pt-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground flex items-center gap-2">
                          <History className="w-5 h-5 text-gray-400" /> Recent Activity
                        </h3>
                        <button onClick={() => router.push('/history')} className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors">See all</button>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border rounded-xl p-4 flex justify-between items-center opacity-50 grayscale cursor-not-allowed transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                              <Sparkles className="text-gray-400 w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-foreground text-sm">Welcome Power</p>
                              <p className="text-xs text-gray-500 mt-0.5">System Integration</p>
                            </div>
                          </div>
                          <span className="font-medium text-gray-400 text-sm">+0 TKN</span>
                        </div>
                      </div>
                    </motion.section>
                  </div>

                  {/* RIGHT COLUMN: STATS */}
                  <div className="lg:col-span-4 space-y-6">
                    <motion.div variants={itemVariants} className="bg-gray-900 dark:bg-surface border border-gray-900 dark:border-border text-white dark:text-foreground p-6 rounded-2xl shadow-sm transition-colors">
                      <h4 className="text-xs font-medium text-gray-400 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Performance
                      </h4>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-3">
                            <span className="text-sm text-gray-400">Settled Earnings</span>
                            <span className="text-3xl font-medium tabular-nums">₹{withdrawable.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '10%' }} className="h-full bg-blue-500 rounded-full" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                          <div>
                            <span className="block text-xs text-gray-400 mb-1">Total Calls</span>
                            <span className="text-xl font-medium">0</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-400 mb-1">Ratings</span>
                            <span className="text-xl font-medium text-gray-500">NEW</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <Store className="w-6 h-6 text-gray-400 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Your Store</h4>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Products</span>
                          <span className="font-medium text-gray-900">{products?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Status</span>
                          <span className="font-medium text-gray-900">{products?.length > 0 ? '🟢 Live' : '⚫ Empty'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('storefront')}
                        className="w-full py-2.5 bg-gray-50 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        Manage Store <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </motion.div>
                  </div>
                </div>
              </>
            )}



            {activeTab === 'wallet' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm transition-colors">
                    <span className="text-sm font-medium text-gray-500">Settled Earnings</span>
                    <h2 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-foreground mt-2">₹{withdrawable.toLocaleString()}</h2>
                    <button className="w-full mt-8 bg-gray-900 dark:bg-foreground text-white dark:text-background rounded-lg font-medium py-3 transition-all hover:opacity-90" onClick={() => router.push('/wallet')}>Withdraw Funds</button>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm transition-colors text-gray-900 dark:text-foreground">
                    <span className="text-sm font-medium text-gray-500">Credit tokens</span>
                    <h2 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-foreground mt-2">{balance.toLocaleString()} TKN</h2>
                    <button className="w-full mt-8 bg-white dark:bg-surface text-gray-900 dark:text-foreground rounded-lg font-medium py-3 shadow-sm transition-all hover:opacity-90" onClick={() => router.push('/wallet')}>Top Up Credits</button>
                  </div>
                </div>
              </div>
            )}



            {activeTab === 'tools' && (
              <div className="space-y-8">
                {activeTool === 'none' ? (
                  <div className="space-y-12">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-foreground">Creator Tools</h3>
                        <p className="text-sm text-gray-500 mt-1">Power up your creator workflow</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* INSTA BOT TOOL CARD */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        onClick={() => setActiveTool('insta-bot')}
                        className="bg-white dark:bg-surface p-6 border border-gray-100 dark:border-border rounded-2xl shadow-sm cursor-pointer group transition-all hover:shadow-md"
                      >
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-foreground flex items-center justify-center rounded-xl mb-6 group-hover:scale-110 transition-transform">
                          <Bot className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">Insta Automation</h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                          Auto-reply to DMs & Comments with links to your storefront.
                        </p>
                        <div className="flex items-center gap-2 text-blue-500 font-medium text-sm group-hover:text-blue-600">
                          Configure <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.div>

                      {/* STORY REPLIES */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-100 dark:border-gray-800 rounded-2xl opacity-60 flex flex-col justify-center items-center text-center border-dashed">
                        <History className="w-6 h-6 mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">Story Replies</h3>
                        <p className="text-xs font-medium text-gray-500 mt-2">Coming Soon</p>
                      </div>

                      {/* MAGIC LINKS */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-100 dark:border-gray-800 rounded-2xl opacity-60 flex flex-col justify-center items-center text-center border-dashed">
                        <Zap className="w-6 h-6 mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">Magic Links</h3>
                        <p className="text-xs font-medium text-gray-500 mt-2">Coming Soon</p>
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

          <div className="bg-white dark:bg-surface p-8 rounded-2xl border border-gray-200 dark:border-border shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-gray-100 dark:border-border">
              <div>
                <h3 className="text-2xl font-medium tracking-tight flex items-center gap-3 text-gray-900 dark:text-foreground">
                  <Bot className="w-6 h-6 text-gray-500" /> Insta {selectedCategory === 'comment' ? 'Comment' : selectedCategory === 'dm' ? 'DM' : 'Bot'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Scale your presence with AI-driven responses</p>
              </div>
              <div className="flex gap-4">
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
                        handleInstagramConnect();
                      }
                    } else {
                      if (confirm('Disconnect Instagram?')) {
                        setInstagramToken('');
                        setIsConnected(false);
                        handleSaveBotConfig('');
                      }
                    }
                  }}
                  className={`px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-900 dark:bg-foreground text-white dark:text-background hover:opacity-90'}`}
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
                  <h3 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-foreground mb-2">Select your automation track</h3>
                  <p className="text-sm text-gray-500">Pick a category to manage your automations</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* COMMENT AUTOMATION CARD */}
                  <motion.div
                    whileHover={{ y: -4 }}
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
                    className="bg-white dark:bg-surface p-6 border border-gray-200 dark:border-border rounded-2xl shadow-sm flex flex-col h-full overflow-hidden cursor-pointer group hover:shadow-md transition-all"
                  >
                    <div className="mb-4">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 transition-colors">Loved by Creators</span>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-foreground mt-1">Comment Automation</h4>
                      <p className="text-sm text-gray-500 mt-2">Send DMs to people who comment specific keywords on your posts</p>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-border aspect-[16/10] mb-6 relative overflow-hidden p-6 rounded-xl">
                      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-300 flex-shrink-0 relative overflow-hidden">
                            {profilePicture && <img src={profilePicture} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-border px-3 py-1.5 rounded-2xl rounded-bl-none shadow-sm">
                            <p className="text-xs text-gray-700 dark:text-gray-300">link pls ❤️</p>
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
                            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900 px-3 py-1.5 rounded-2xl rounded-br-none shadow-sm">
                              <p className="text-xs text-purple-700 dark:text-purple-300">Here it is ✨</p>
                            </div>
                            <div className="bg-purple-500 text-white px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" /> Link
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full py-3 bg-blue-600 text-white text-center font-medium tracking-wide text-sm rounded-xl group-hover:bg-blue-700 transition-colors shadow-sm">
                      Send a link from comments
                    </div>
                  </motion.div>

                  {/* DM AUTOMATION CARD */}
                  <motion.div
                    whileHover={{ y: -4 }}
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
                    className="bg-white dark:bg-surface p-6 border border-gray-200 dark:border-border rounded-2xl shadow-sm flex flex-col h-full overflow-hidden cursor-pointer group hover:shadow-md transition-all"
                  >
                    <div className="mb-4">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 transition-colors">Boosts engagement</span>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-foreground mt-1">DM Automation</h4>
                      <p className="text-sm text-gray-500 mt-2">Send customized replies when people DM you specific keywords</p>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-border aspect-[16/10] mb-6 relative overflow-hidden p-6 rounded-xl">
                      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#d1d5db] flex-shrink-0" />
                          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-border px-4 py-1.5 rounded-2xl rounded-bl-none shadow-sm">
                            <p className="text-xs text-gray-700 dark:text-gray-300">DEMO</p>
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
                            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-border px-4 py-1.5 rounded-2xl rounded-br-none shadow-sm">
                              <p className="text-xs text-gray-700 dark:text-gray-300">Here you go ✨</p>
                            </div>
                            <div className="flex gap-2">
                              <div className="bg-purple-500 text-white px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" /> Link 1
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full py-3 bg-blue-600 text-white text-center font-medium tracking-wide text-sm rounded-xl group-hover:bg-blue-700 transition-colors shadow-sm">
                      Respond to all your DMs
                    </div>
                  </motion.div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-12 mt-12 py-6 border-t border-gray-100 dark:border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-border">
                      <Zap className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-foreground">Most popular</p>
                      <p className="text-[10px] text-gray-400">Automations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-border">
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-foreground">Publish in</p>
                      <p className="text-[10px] text-gray-400">3 Minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-border">
                      <User className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-foreground">Preview first</p>
                      <p className="text-[10px] text-gray-400">Go live when ready</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : botView === 'list' ? (
              <div className="space-y-8 py-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-medium text-gray-900 dark:text-foreground">
                    Active {selectedCategory === 'dm' ? 'DM' : 'Comment'} Automations
                  </h4>
                  <button
                    onClick={() => {
                      setBotRules([...botRules, { keywords: [], response: "", triggerType: selectedCategory! }]);
                      setCurrentRuleIndex(botRules.length);
                      setBotStep('trigger');
                      setBotView('editor');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
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
                        whileHover={{ y: -2 }}
                        onClick={() => {
                          setCurrentRuleIndex(idx);
                          setBotStep('trigger');
                          setBotView('editor');
                        }}
                        className="bg-white dark:bg-surface p-6 border border-gray-200 dark:border-border rounded-2xl shadow-sm cursor-pointer relative group hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-[10px] font-medium rounded">
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
                            className="text-zinc-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-foreground mb-2 truncate">
                          {rule.keywords?.length > 0 ? `Trigger: ${rule.keywords.join(', ')}` : 'Empty Keywords'}
                        </h5>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {rule.response || 'No response configured yet'}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border flex items-center gap-1 text-blue-600 font-medium text-xs">
                          Edit Configuration <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </motion.div>
                    );
                  })}
                  {!botRules.some(r => r.triggerType === selectedCategory) && (
                    <div className="lg:col-span-3 flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-zinc-900/50 border border-dashed border-gray-300 dark:border-border rounded-2xl">
                      <Zap className="w-8 h-8 mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">No {selectedCategory} Automations</h3>
                      <p className="text-sm text-gray-500 mt-1">Click "Add Automation" to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7 space-y-10">
                  {/* WIZARD TABS */}
                  <div className="flex border border-gray-200 dark:border-border rounded-xl font-medium text-sm overflow-hidden">
                    <button
                      onClick={() => setBotStep('trigger')}
                      className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-r border-gray-200 dark:border-border transition-colors ${botStep === 'trigger' ? 'bg-gray-950 text-white' : 'bg-white dark:bg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                      <MessageSquare className="w-4 h-4" /> 1. Trigger
                    </button>
                    <button
                      onClick={() => setBotStep('action')}
                      className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${botStep === 'action' ? 'bg-gray-950 text-white' : 'bg-white dark:bg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                      <Send className="w-4 h-4" /> 2. Reply
                    </button>
                  </div>

                  {/* STEP CONTENT */}
                  <div className="space-y-6">
                    {botStep === 'trigger' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-medium text-gray-900 dark:text-foreground">Setup Trigger</h4>
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium rounded-full">
                            {botRules[currentRuleIndex]?.triggerType || 'dm'} automation
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">The bot will reply when the message contains ANY of these keywords:</p>

                        <div className="flex flex-wrap gap-2">
                          {botRules[currentRuleIndex]?.keywords?.map((kw, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{kw}</span>
                              <button
                                onClick={() => {
                                  const newRules = [...botRules];
                                  if (newRules[currentRuleIndex]) {
                                    newRules[currentRuleIndex].keywords = newRules[currentRuleIndex].keywords.filter(k => k !== kw);
                                    setBotRules(newRules);
                                  }
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add keyword..."
                              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus:bg-white transition-colors"
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
                              className="bg-gray-900 dark:bg-foreground text-white dark:text-background px-3 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-end pt-4">
                          <button onClick={() => setBotStep('action')} className="bg-gray-900 dark:bg-foreground text-white dark:text-background px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                            Next: Action <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-foreground">Setup Reply</h4>
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 text-xs font-medium rounded-full">
                            Active Rule #{currentRuleIndex + 1}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">This message will be sent to the user:</p>

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
                            placeholder="Hey! You can join my session here: supertime.wtf/..."
                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-border rounded-xl p-4 font-medium text-sm focus:outline-none focus:bg-white transition-colors resize-none"
                          />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                          <button onClick={() => setBotStep('trigger')} className="text-xs font-medium text-gray-400 hover:text-gray-950 dark:hover:text-foreground">← Back to Trigger</button>
                          <button
                            onClick={() => {
                              handleSaveBotConfig();
                              setBotView('list');
                            }}
                            disabled={savingConfig}
                            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 group hover:bg-purple-700 transition-colors disabled:opacity-50"
                          >
                            {savingConfig ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> SAVING...
                              </>
                            ) : (
                              <>
                                FINISH & GO LIVE <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OTHER AUTOMATIONS LIST */}
                  <div className="pt-8 border-t border-gray-100 dark:border-border">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-foreground mb-4">Your Automations</h5>
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
                            className={`p-4 border rounded-xl text-left transition-all ${currentRuleIndex === idx ? 'bg-gray-50 dark:bg-zinc-800/50 border-gray-950 dark:border-white' : 'bg-white dark:bg-surface border-gray-200 dark:border-border hover:border-gray-450'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
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
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {rule.keywords.length > 0 ? rule.keywords.join(', ') : 'NO KEYWORDS'}
                            </p>
                            <p className="text-xs font-medium text-gray-750 dark:text-gray-350 mt-1">{rule.triggerType}</p>
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
                        className="p-4 border border-dashed border-gray-300 dark:border-border rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-medium">Add Rule</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT: PHONE PREVIEW */}
                <div className="lg:col-span-5 hidden lg:block">
                  <div className="sticky top-10">
                    <div className="mx-auto w-[320px] h-[640px] bg-zinc-950 rounded-[48px] border-[6px] border-zinc-800 shadow-xl overflow-hidden relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-zinc-800 rounded-b-2xl z-20"></div>
                      <div className="h-full bg-zinc-900 flex flex-col pt-3">
                        <div className="px-6 py-6 border-b border-zinc-800/50 flex items-center gap-3">
                          {profilePicture ? (
                            <img src={profilePicture} className="w-10 h-10 rounded-full border border-zinc-700 object-cover" alt="Profile" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700"></div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-white leading-none">{username || 'houseofextsy'}</span>
                            <span className="text-[10px] text-zinc-400 mt-1">Supertime Creator</span>
                          </div>
                        </div>
                        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                          <div className="flex flex-col items-center space-y-1 py-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-750"></div>
                            <span className="text-xs font-medium text-white mt-2">Instagram User</span>
                            <span className="text-[10px] text-zinc-550">Followed by 2,401 others</span>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-zinc-800 rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%] border border-zinc-700/50">
                              <p className="text-xs text-zinc-300 leading-relaxed">
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
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="flex justify-end"
                              >
                                <div className="bg-blue-600 rounded-2xl rounded-br-none px-4 py-3 max-w-[80%] shadow-sm">
                                  <p className="text-xs text-white leading-relaxed">
                                    {botRules[currentRuleIndex].response}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                          <div className="bg-zinc-800 rounded-full px-4 py-2 flex items-center gap-2 border border-zinc-700">
                            <span className="text-[10px] font-medium text-zinc-500 uppercase">Message...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

            {activeTab === 'storefront' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <h3 className="text-2xl font-medium tracking-tight text-gray-900 dark:text-foreground">Product Manager</h3>
                    <p className="text-sm text-gray-500 mt-1">Sell digital products, courses, bookings & more</p>
                  </div>
                  <div className="flex gap-3">
                    {username && (
                      <button
                        onClick={() => window.open('/' + username, '_blank')}
                        className="bg-white dark:bg-surface text-gray-900 dark:text-foreground px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        <Eye className="w-4 h-4" /> View Live Store
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({ name: '', description: '', price: '', type: 'digital', content: '', duration: '', thumbnail: '' });
                        setShowProductForm(true);
                      }}
                      className="bg-gray-900 dark:bg-foreground text-white dark:text-background px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  </div>
                </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showProductForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-surface p-8 rounded-2xl border border-gray-200 dark:border-border shadow-lg"
          >
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-xl font-medium text-gray-900 dark:text-foreground">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h4>
              <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="mb-8">
              <label className="block text-xs font-medium text-gray-450 mb-3">Product Type</label>
              <div className="grid grid-cols-3 gap-4">
                {(['digital', 'link', 'booking'] as const).map((type) => {
                  const config = productTypeConfig[type];
                  const isActive = productForm.type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setProductForm(prev => ({ ...prev, type }))}
                      className={`p-4 rounded-xl text-left border transition-all ${isActive
                        ? `bg-gray-900 dark:bg-foreground text-white dark:text-background border-transparent shadow-sm`
                        : 'bg-white dark:bg-surface text-gray-900 dark:text-foreground border-gray-200 dark:border-border hover:border-gray-400'
                        }`}
                    >
                      <config.icon className={`w-5 h-5 mb-2 ${isActive ? 'text-blue-450' : 'text-gray-400'}`} />
                      <p className="text-sm font-medium leading-none">{config.label}</p>
                      <p className={`text-xs mt-1.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{config.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-450 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Premium Lightroom Presets"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm focus:outline-none focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-450 mb-2">Price (₹) *</label>
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="499"
                  min="0"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm focus:outline-none focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-450 mb-2">Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what the buyer will get..."
                rows={3}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm focus:outline-none focus:bg-white transition-colors resize-none"
              />
            </div>

            {/* Type-specific fields */}
            {productForm.type === 'digital' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-450 mb-2">Upload File</label>
                <div className="border border-dashed border-gray-300 dark:border-border rounded-xl p-6 bg-gray-50 dark:bg-zinc-900/50 text-center">
                  {productForm.content ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-5 h-5 text-green-500" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">File Uploaded ✓</span>
                      <button onClick={() => setProductForm(prev => ({ ...prev, content: '' }))} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className={`w-8 h-8 ${uploadingFile ? 'animate-bounce text-blue-500' : 'text-gray-300'}`} />
                      <span className="text-xs font-medium text-gray-400">
                        {uploadingFile ? 'Uploading...' : 'Click to upload (PDF, ZIP, etc.)'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'product')}
                        disabled={uploadingFile}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {productForm.type === 'link' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-450 mb-2">External URL</label>
                <input
                  type="url"
                  value={productForm.content}
                  onChange={(e) => setProductForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="https://notion.so/your-course or discord.gg/invite"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm focus:outline-none focus:bg-white transition-colors"
                />
              </div>
            )}

            {productForm.type === 'booking' && (
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-450 mb-2">Meeting Link</label>
                  <input
                    type="url"
                    value={productForm.content}
                    onChange={(e) => setProductForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="https://meet.google.com/... or calendly.com/..."
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-450 mb-2">Duration</label>
                  <input
                    type="text"
                    value={productForm.duration}
                    onChange={(e) => setProductForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="30 min / 1 hour"
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Cover Image */}
            <div className="mb-8">
              <label className="block text-xs font-medium text-gray-450 mb-2">Cover Image (optional)</label>
              <div className="border border-dashed border-gray-300 dark:border-border rounded-xl p-4 bg-gray-50 dark:bg-zinc-900/50">
                {productForm.thumbnail ? (
                  <div className="flex items-center gap-4">
                    <img src={productForm.thumbnail} alt="Cover" className="w-16 h-16 object-cover border border-gray-200 dark:border-border rounded-lg" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 flex-1">Image uploaded ✓</span>
                    <button onClick={() => setProductForm(prev => ({ ...prev, thumbnail: '' }))} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center justify-center gap-2 py-2">
                    <Upload className={`w-5 h-5 ${uploadingThumb ? 'animate-bounce text-blue-500' : 'text-gray-350'}`} />
                    <span className="text-xs font-medium text-gray-450">
                      {uploadingThumb ? 'Uploading...' : 'Upload cover image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'thumbnail')}
                      disabled={uploadingThumb}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                className="px-6 py-2.5 font-medium text-sm text-gray-400 hover:text-gray-900 dark:hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProductSubmit}
                disabled={!productForm.name || !productForm.price}
                className="bg-gray-900 dark:bg-foreground text-white dark:text-background px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-30 hover:opacity-90 transition-opacity shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                {editingProduct ? 'Save Changes' : 'Publish Product'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface p-5 border border-gray-200 dark:border-border rounded-2xl shadow-sm">
          <span className="block text-xs font-medium text-gray-400 mb-1">Total Products</span>
          <span className="text-2xl font-medium text-gray-900 dark:text-foreground">{products?.length || 0}</span>
        </div>
        <div className="bg-white dark:bg-surface p-5 border border-gray-200 dark:border-border rounded-2xl shadow-sm">
          <span className="block text-xs font-medium text-gray-400 mb-1">Types Active</span>
          <span className="text-2xl font-medium text-gray-900 dark:text-foreground">{new Set(products?.map((p: any) => p.type)).size || 0}</span>
        </div>
        <div className="bg-white dark:bg-surface p-5 border border-gray-200 dark:border-border rounded-2xl shadow-sm">
          <span className="block text-xs font-medium text-gray-400 mb-1">Store Status</span>
          <span className="text-2xl font-medium text-green-600 dark:text-green-400">{products?.length > 0 ? 'LIVE' : '—'}</span>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((prod: any) => {
          const typeConf = productTypeConfig[prod.type as keyof typeof productTypeConfig] || productTypeConfig.digital;
          const TypeIcon = typeConf.icon;
          return (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-2xl group relative overflow-hidden hover:shadow-md transition-all shadow-sm"
            >
              {/* Thumbnail / Header */}
              {prod.thumbnail ? (
                <div className="h-36 bg-zinc-100 border-b border-gray-200 dark:border-border overflow-hidden">
                  <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              ) : (
                <div className="h-24 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-border flex items-center justify-center">
                  <TypeIcon className="w-10 h-10 opacity-20" />
                </div>
              )}

              <div className="p-6">
                {/* Type Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded">
                    {typeConf.label}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditProduct(prod)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this product?')) {
                          handleSaveProducts(products.filter((p: any) => p.id !== prod.id));
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-medium text-gray-900 dark:text-foreground mb-1 leading-tight">{prod.name}</h4>
                {prod.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{prod.description}</p>
                )}

                <div className="flex justify-between items-end pt-4 border-t border-gray-100 dark:border-border">
                  <span className="text-lg font-medium text-gray-955 dark:text-white">₹{prod.price}</span>
                  {prod.type === 'booking' && prod.duration && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {prod.duration}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Empty State / Add Card */}
        {(!products || products.length === 0) ? (
          <div
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ name: '', description: '', price: '', type: 'digital', content: '', duration: '', thumbnail: '' });
              setShowProductForm(true);
            }}
            className="lg:col-span-3 py-16 bg-gray-50 dark:bg-zinc-900/50 border border-dashed border-gray-300 dark:border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-colors group"
          >
            <div className="w-12 h-12 bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-foreground">Add Your First Product</p>
            <p className="text-xs text-gray-500 mt-1">Digital goods, courses, bookings & more</p>
          </div>
        ) : (
          <div
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ name: '', description: '', price: '', type: 'digital', content: '', duration: '', thumbnail: '' });
              setShowProductForm(true);
            }}
            className="border border-dashed border-gray-300 dark:border-border rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors group"
          >
            <Plus className="w-6 h-6 text-gray-350 group-hover:text-gray-900 transition-colors mb-2" />
            <span className="text-xs font-medium text-gray-400 group-hover:text-gray-900">Add Another</span>
          </div>
        )}
      </div>

      <div className="w-full h-[1px] bg-gray-200 dark:bg-border my-12" />
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
           <h3 className="text-xl font-medium text-gray-900 dark:text-foreground">Live Shows</h3>
           <p className="text-sm text-gray-500 mb-6">Schedule ticketed broadcast events</p>
           <button onClick={() => setShowCreateShow(true)}
              className="w-full py-3 bg-gray-950 dark:bg-white text-white dark:text-black rounded-xl font-medium text-sm hover:opacity-90 transition-opacity shadow-sm">
              Create a Show
           </button>
           <AnimatePresence>
                {showCreateShow && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-surface border border-gray-200 dark:border-border p-6 rounded-2xl shadow-lg mt-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">New Event</h3>
                      </div>
                      <button onClick={() => setShowCreateShow(false)}
                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">Show Title</label>
                        <input type="text" value={newShowTitle} onChange={e => setNewShowTitle(e.target.value)}
                          placeholder="e.g. Live Acoustic Night"
                          className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">Description</label>
                        <textarea value={newShowDesc} onChange={e => setNewShowDesc(e.target.value)}
                          placeholder="Tell fans what to expect..." rows={2}
                          className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm outline-none resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1.5">Date</label>
                          <input type="date" value={newShowDate} onChange={e => setNewShowDate(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1.5">Time</label>
                          <input type="time" value={newShowTime} onChange={e => setNewShowTime(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1.5">Ticket Price (INR)</label>
                          <input type="number" value={newShowPrice} onChange={e => setNewShowPrice(e.target.value)}
                            placeholder="299" min="0"
                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1.5">Max Seats</label>
                          <select value={newShowSeats} onChange={e => setNewShowSeats(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-border rounded-xl p-3 font-medium text-sm outline-none bg-white dark:bg-zinc-800">
                            <option value="25">25 seats</option>
                            <option value="100">100 seats</option>
                            <option value="1000">1,000 seats</option>
                            <option value="10000">Unlimited</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!newShowTitle || !newShowDate || !newShowTime || !newShowPrice) { alert('Please fill in all fields'); return; }
                          try {
                            await fetch('/api/shows', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'create', title: newShowTitle, description: newShowDesc, date: newShowDate, time: newShowTime, ticketPrice: Number(newShowPrice), maxSeats: Number(newShowSeats) }),
                            });
                            setShowCreateShow(false);
                            alert('Show created!');
                          } catch (e) { alert('Failed to create show'); }
                        }}
                        disabled={!newShowTitle || !newShowDate || !newShowTime || !newShowPrice}
                        className="w-full py-3 bg-gray-900 dark:bg-foreground text-white dark:text-background rounded-xl font-medium text-sm disabled:opacity-50 mt-4">
                        Create Event
                      </button>
                    </div>
                  </motion.div>
                )}
           </AnimatePresence>
        </div>
        <div>
           <h3 className="text-xl font-medium text-gray-900 dark:text-foreground">Fundraisers</h3>
           <p className="text-sm text-gray-500 mb-6">Run a charity stream or personal goal</p>
           <FundraiserManager username={username || ''} />
        </div>
      </div>
    </div>
  )
}

{
  activeTab === 'settings' && (
    <div className="space-y-12">
      <div className="mb-12">
        <ProfileEditor username={username || ''} initialSettings={{
          profileImage: initialSettings?.profileImage || '',
          socials: initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' },
          faqs: initialSettings?.faqs || [],
          templates: initialSettings?.templates || [],
        }} />
      </div>
      <div className="w-full h-1 bg-black/10 rounded-full my-8" />
      <div>
        <SettingsClient username={username || ''} initialSettings={{
          videoRate: initialSettings?.videoRate ?? 100,
          audioRate: initialSettings?.audioRate ?? 50,
          socials: initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' },
          profileImage: initialSettings?.profileImage || '',
          templates: initialSettings?.templates || [],
          faqs: initialSettings?.faqs || [],
          roomType: initialSettings?.roomType || 'audio',
          isRoomFree: initialSettings?.isRoomFree ?? true,
        }} />
      </div>
    </div>
  )
}

          </motion.div >
        </div >
      </main >
    </div >
  );
}
