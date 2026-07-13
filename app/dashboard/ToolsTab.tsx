/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  ChevronRight,
  History,
  Zap,
  Instagram,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Send,
  Loader2,
  Clock,
  User
} from 'lucide-react';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useAlertDialog } from '../components/AlertDialog';

interface ToolsTabProps {
  username: string | null;
}

export default function ToolsTab({ username }: ToolsTabProps) {
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

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { alert: customAlert, AlertDialog } = useAlertDialog();

  useEffect(() => {
    fetch('/api/bot/config')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          if (data.rules) {
            setBotRules(data.rules);
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
  }, []);

  const handleInstagramConnect = () => {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    if (!appId) {
      customAlert({
        title: 'Configuration Error',
        message: 'Instagram App ID not configured.',
        variant: 'error',
      });
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/instagram/callback`);
    const scopes = ['instagram_business_basic', 'instagram_business_manage_messages', 'instagram_business_manage_comments'].join(',');
    const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      authUrl,
      'instagram_auth',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,status=no`
    );

    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'IG_AUTH_SUCCESS') {
        setIsConnected(true);
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
    if (!popup) {
      window.location.href = authUrl;
    }
  };

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
          setInstagramToken('CONNECTED');
        }
        customAlert({
          title: 'Success',
          message: 'Bot configuration saved successfully!',
          variant: 'success',
        });
      } else {
        customAlert({
          title: 'Save Failed',
          message: 'Failed to save configuration.',
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Error saving bot config:', err);
      customAlert({
        title: 'Error',
        message: 'An error occurred while saving.',
        variant: 'error',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const hasActiveRules = botRules.length > 0 && !(botRules.length === 1 && (botRules[0].keywords?.length === 0 || !botRules[0].keywords) && botRules[0].response === "");

  return (
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
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-100 dark:border-gray-800 rounded-2xl opacity-60 flex flex-col justify-center items-center text-center border-dashed">
              <Bot className="w-6 h-6 mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">Insta Automation</h3>
              <p className="text-xs font-medium text-gray-500 mt-2">Coming Soon (Pending Meta Review)</p>
            </div>

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
                  onClick={async (e) => {
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
                      const ok = await confirm({
                        title: 'Disconnect Instagram?',
                        message: 'Your bot automations will stop working until you reconnect.',
                        confirmLabel: 'Disconnect',
                        cancelLabel: 'Keep connected',
                        variant: 'danger',
                      });
                      if (ok) {
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
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm({
                                title: 'Delete this automation?',
                                message: 'This automation rule will be permanently removed.',
                                confirmLabel: 'Delete',
                                cancelLabel: 'Keep it',
                                variant: 'danger',
                              });
                              if (ok) {
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
                      <p className="text-sm text-gray-500 mt-1">Click &quot;Add Automation&quot; to get started!</p>
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const ok = await confirm({
                                    title: 'Delete this rule?',
                                    message: 'This automation rule will be permanently removed.',
                                    confirmLabel: 'Delete',
                                    cancelLabel: 'Keep it',
                                    variant: 'danger',
                                  });
                                  if (ok) {
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
      {ConfirmDialog}
      {AlertDialog}
    </div>
  );
}
