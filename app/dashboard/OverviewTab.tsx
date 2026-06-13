'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Store,
} from 'lucide-react';
import SetupChecklist from './SetupChecklist';

interface OverviewTabProps {
  username: string | null;
  withdrawable: number;
  balance: number;
  initialSettings?: any;
  setActiveTab: (tab: string) => void;
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
};

export default function OverviewTab({ username, withdrawable, balance, initialSettings, setActiveTab }: OverviewTabProps) {
  return (
    <>
      {/* HEADER SECTION */}
      <motion.section variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            Welcome, <span className="text-muted">{username || 'Explorer'}</span>.
          </h1>
          <p className="text-sm text-muted mt-1">Here's how your presence is doing today</p>
        </div>
        {username && (
          <button
            onClick={() => window.open('/studio', '_blank')}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Access Studio
          </button>
        )}
      </motion.section>

      {/* SETUP CHECKLIST */}
      <SetupChecklist username={username || ''} initialSettings={initialSettings} onNavigateTab={setActiveTab} />

      {/* ANALYTICS GRID */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Earnings Card */}
        <motion.div variants={itemVariants} className="bg-surface border border-border text-foreground p-6 rounded-2xl shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Total Earnings</span>
              <h2 className="text-3xl font-medium mt-2">₹{withdrawable.toLocaleString()}</h2>
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">First month</span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <motion.div initial={{ width: 0 }} animate={{ width: '10%' }} className="h-full bg-blue-500 rounded-full" />
          </div>
          <p className="text-xs text-muted mt-3">₹0 pending clearance</p>
          <button
            onClick={() => setActiveTab('wallet')}
            className="w-full py-2.5 bg-background text-foreground text-xs font-semibold rounded-lg hover:bg-surface transition-colors flex items-center justify-center gap-2 mt-4"
          >
            Wallet & Payouts <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </motion.div>

        {/* Storefront Card */}
        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-2xl border border-border shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Storefront</span>
              <h2 className="text-3xl font-medium text-foreground mt-2">Your Store</h2>
            </div>
            <Store className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted">Active Products</span>
              <span className="font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted">Booking Templates</span>
              <span className="font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted">Digital Revenue</span>
              <span className="font-semibold text-foreground">₹0</span>
            </div>
            <button
              onClick={() => setActiveTab('storefront')}
              className="w-full py-2.5 bg-background text-foreground text-xs font-semibold rounded-lg hover:bg-surface transition-colors flex items-center justify-center gap-2 mt-2"
            >
              Configure Storefront <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
