'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { getLocalizedPrice, BASE_PRO_PRICE, getCurrencySymbol, getPPPMultiplier } from '../lib/ppp';

export default function PricingClient({ countryCode }: { countryCode: string }) {
  const [isAnnual, setIsAnnual] = useState(false);
  
  const currency = getCurrencySymbol(countryCode);
  const multiplier = getPPPMultiplier(countryCode);
  const localizedMonthlyPrice = getLocalizedPrice(BASE_PRO_PRICE, countryCode);
  const localizedAnnualPrice = Math.round(localizedMonthlyPrice * 10); // 2 months free

  const displayPrice = isAnnual ? localizedAnnualPrice : localizedMonthlyPrice;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-rose-500 selection:text-white pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-border/50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-8 h-8 bg-surface flex items-center justify-center border border-border rounded-lg shadow-sm">
            <Zap className="text-yellow-500 w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">Supertime</span>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} className="text-sm font-medium hover:text-rose-500 transition-colors">
          Go to Dashboard
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
        >
          Pricing that scales <br/><span className="text-rose-500">with your empire.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted text-lg max-w-2xl mx-auto mb-12"
        >
          Whether you&apos;re taking your first call or running a million-dollar business, we have a plan for you.
          {multiplier < 1 && (
            <span className="block mt-2 text-green-500 font-medium text-sm bg-green-500/10 px-3 py-1 rounded-full inline-block">
              🎉 Regional Pricing applied for {countryCode}. You get a {Math.round((1 - multiplier) * 100)}% discount!
            </span>
          )}
        </motion.p>

        <div className="flex justify-center mb-16">
          <div className="bg-surface border border-border p-1 rounded-xl flex items-center gap-1 shadow-sm">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${!isAnnual ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isAnnual ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              Yearly <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-md">SAVE 16%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
          {/* FREE TIER */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface/50 border border-border p-8 rounded-3xl shadow-sm relative overflow-hidden"
          >
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-muted text-sm mb-6 h-10">Perfect for getting started and earning your first $100.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold">{currency}0</span>
              <span className="text-muted"> / month</span>
            </div>
            <button className="w-full py-3 rounded-xl border border-border font-medium hover:bg-background transition-all mb-8">
              Current Plan
            </button>
            <div className="space-y-4 text-sm font-medium text-foreground">
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 20% Platform Fee</div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 100 Call Minutes / mo</div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 1 Active Digital Product</div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 2 Saved Studio Highlights</div>
              <div className="flex items-center gap-3 text-muted"><X className="w-4 h-4" /> Supertime Watermark</div>
            </div>
          </motion.div>

          {/* PRO TIER */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-background border-2 border-rose-500 p-8 rounded-3xl shadow-xl relative overflow-hidden transform md:-translate-y-4"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-indigo-500" />
            <div className="absolute top-4 right-4 text-[10px] font-bold bg-rose-500/10 text-rose-500 px-2 py-1 rounded-md border border-rose-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> POPULAR
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-rose-500">Pro</h3>
            <p className="text-muted text-sm mb-6 h-10">For evolving creators pushing high volume.</p>
            <div className="mb-8 flex items-end gap-1">
              <span className="text-4xl font-bold">{currency}{displayPrice}</span>
              <span className="text-muted pb-1"> / {isAnnual ? 'year' : 'month'}</span>
            </div>
            <button className="w-full py-3 rounded-xl bg-foreground text-background font-bold hover:scale-105 transition-transform mb-8 shadow-md">
              Upgrade to Pro
            </button>
            <div className="space-y-4 text-sm font-medium text-foreground">
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-rose-500" /> 15% Platform Fee (Keep more!)</div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-rose-500" /> 1,000 Call Minutes / mo</div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-rose-500" /> 10 Active Digital Products</div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-rose-500" /> 20 Saved Studio Highlights</div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-rose-500" /> Custom Branding (No Watermark)</div>
            </div>
          </motion.div>

          {/* ENTERPRISE TIER */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-xl relative overflow-hidden text-white"
          >
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <p className="text-white/60 text-sm mb-6 h-10">White-glove service for massive creators.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <button className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all mb-8 flex items-center justify-center gap-2">
              Contact Us <ArrowRight className="w-4 h-4" />
            </button>
            <div className="space-y-4 text-sm font-medium text-white/90">
              <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-blue-400" /> Custom Platform Fee</div>
              <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-blue-400" /> Unlimited Call Minutes</div>
              <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-blue-400" /> Unlimited Digital Products</div>
              <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-blue-400" /> Unlimited Studio Highlights</div>
              <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-blue-400" /> Priority Slack Support</div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
