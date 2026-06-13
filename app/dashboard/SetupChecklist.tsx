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

  React.useEffect(() => {
    const saved = localStorage.getItem('supertime-setup-checklist-expanded');
    if (saved !== null) {
      setIsExpanded(saved === 'true');
    }
  }, []);

  const handleToggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem('supertime-setup-checklist-expanded', String(next));
  };
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
      className="bg-white dark:bg-surface border border-gray-100 dark:border-border rounded-2xl shadow-sm overflow-hidden mb-8 transition-colors"
    >
      {/* Header */}
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 dark:bg-background rounded-lg flex items-center justify-center transition-colors">
            <Sparkles className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground transition-colors">
              Setup Checklist
            </h3>
            <p className="text-sm text-gray-500 dark:text-muted mt-0.5 transition-colors">
              {completedCount}/{totalCount} complete · {progressPercent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress bar (compact) */}
          <div className="hidden md:block w-32 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden transition-colors">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
            <div className="border-t border-gray-100 dark:border-border transition-colors">
              {/* Full-width progress bar */}
              <div className="h-0.5 bg-gray-100 dark:bg-gray-800 transition-colors">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-blue-500"
                />
              </div>

              {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-5 ${idx < items.length - 1 ? 'border-b border-gray-50 dark:border-border' : ''} ${item.isComplete ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'} transition-all group`}
                  >
                    {/* Check circle */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${item.isComplete ? 'bg-blue-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-350 dark:text-gray-500'}`}>
                      {item.isComplete ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-medium">{idx + 1}</span>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-background text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-gray-900 dark:text-foreground text-sm transition-colors ${item.isComplete ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                        {item.label}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-muted mt-0.5 hidden md:block transition-colors">
                        {item.description}
                      </p>
                    </div>

                    {/* Action button */}
                    {!item.isComplete && (
                      <button
                        onClick={item.action}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-background border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 font-medium text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      >
                        {item.id === 'share' && copiedLink ? (
                          <><CheckCircle className="w-3 h-3 text-green-500" /> Copied!</>
                        ) : (
                          <>{item.actionLabel} <ArrowRight className="w-3 h-3 text-gray-400" /></>
                        )}
                      </button>
                    )}

                    {item.isComplete && (
                      <span className="shrink-0 text-xs font-medium text-blue-500">Done ✓</span>
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
