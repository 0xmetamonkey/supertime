'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Globe,
  DollarSign,
  ShoppingBag,
  HelpCircle,
  Share2,
  Check,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Copy,
  CheckCircle,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isComplete: boolean;
  action: () => void;
  actionLabel: string;
  color: string;
}

interface SetupChecklistProps {
  username: string;
  initialSettings: any;
  onNavigateTab: (tab: string) => void;
}

export default function SetupChecklist({ username, initialSettings, onNavigateTab }: SetupChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const items: ChecklistItem[] = [
    {
      id: 'photo',
      label: 'Upload profile photo',
      description: 'First impressions matter — add a photo visitors will see on your profile.',
      icon: Camera,
      isComplete: !!(initialSettings?.profileImage),
      action: () => onNavigateTab('profile'),
      actionLabel: 'Add Photo',
      color: 'neo-pink',
    },
    {
      id: 'socials',
      label: 'Add social links',
      description: 'Connect your Instagram, X, YouTube, or website so fans can find you everywhere.',
      icon: Globe,
      isComplete: !!(
        initialSettings?.socials?.instagram ||
        initialSettings?.socials?.x ||
        initialSettings?.socials?.youtube ||
        initialSettings?.socials?.website
      ),
      action: () => onNavigateTab('profile'),
      actionLabel: 'Add Socials',
      color: 'neo-blue',
    },
    {
      id: 'rates',
      label: 'Set your call rates',
      description: 'How much do you charge per minute for video and audio calls?',
      icon: DollarSign,
      isComplete: (initialSettings?.videoRate != null && initialSettings?.videoRate !== 100) || (initialSettings?.audioRate != null && initialSettings?.audioRate !== 50),
      action: () => onNavigateTab('settings'),
      actionLabel: 'Set Rates',
      color: 'neo-green',
    },
    {
      id: 'product',
      label: 'Add your first product',
      description: 'Sell digital goods, courses, paintings, or bookings from your storefront.',
      icon: ShoppingBag,
      isComplete: !!(initialSettings?.products && initialSettings.products.length > 0) || !!(initialSettings?.templates && initialSettings.templates.length > 0),
      action: () => onNavigateTab('storefront'),
      actionLabel: 'Add Product',
      color: 'neo-yellow',
    },
    {
      id: 'faqs',
      label: 'Add FAQs for visitors',
      description: 'Help visitors understand what you offer before they reach out.',
      icon: HelpCircle,
      isComplete: !!(initialSettings?.faqs && initialSettings.faqs.length > 0),
      action: () => onNavigateTab('profile'),
      actionLabel: 'Add FAQs',
      color: 'neo-pink',
    },
    {
      id: 'share',
      label: 'Share your profile',
      description: `Copy your link and share it on socials — you're ready to earn!`,
      icon: Share2,
      isComplete: false, // This one is always actionable
      action: () => {
        if (username) {
          navigator.clipboard.writeText(`https://supertime.wtf/${username}`);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        }
      },
      actionLabel: copiedLink ? 'Copied!' : 'Copy Link',
      color: 'neo-blue',
    },
  ];

  const completedCount = items.filter(i => i.isComplete).length;
  const totalCount = items.length;
  const allDone = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Don't show if all items are complete
  if (allDone) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neo-yellow border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black]">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <div className="text-left">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">
              Setup Checklist
            </h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
              {completedCount}/{totalCount} complete · {progressPercent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress bar (compact) */}
          <div className="hidden md:block w-32 h-3 bg-zinc-100 border-2 border-black overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-neo-green"
            />
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Checklist Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t-4 border-black">
              {/* Full-width progress bar */}
              <div className="h-2 bg-zinc-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-neo-green"
                />
              </div>

              {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 md:gap-6 p-4 md:p-6 ${idx < items.length - 1 ? 'border-b-2 border-zinc-100' : ''} ${item.isComplete ? 'opacity-50' : 'hover:bg-zinc-50'} transition-all group`}
                  >
                    {/* Check circle */}
                    <div className={`w-8 h-8 md:w-10 md:h-10 border-4 border-black flex items-center justify-center shrink-0 transition-colors ${item.isComplete ? 'bg-neo-green' : 'bg-white'}`}>
                      {item.isComplete ? (
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-black" />
                      ) : (
                        <span className="text-xs font-black text-zinc-300">{idx + 1}</span>
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`w-10 h-10 md:w-12 md:h-12 border-2 border-black bg-${item.color}/10 flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-black uppercase text-sm tracking-tight ${item.isComplete ? 'line-through' : ''}`}>
                        {item.label}
                      </h4>
                      <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 hidden md:block">
                        {item.description}
                      </p>
                    </div>

                    {/* Action button */}
                    {!item.isComplete && (
                      <button
                        onClick={item.action}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-black text-white font-black uppercase text-[9px] border-2 border-black shadow-[3px_3px_0px_0px_black] hover:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
                      >
                        {item.id === 'share' && copiedLink ? (
                          <><CheckCircle className="w-3 h-3" /> Copied!</>
                        ) : (
                          <>{item.actionLabel} <ArrowRight className="w-3 h-3" /></>
                        )}
                      </button>
                    )}

                    {item.isComplete && (
                      <span className="shrink-0 text-[9px] font-black uppercase text-neo-green tracking-widest">Done ✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
