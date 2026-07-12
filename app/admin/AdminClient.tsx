'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users, Megaphone, LogOut, ArrowLeft } from 'lucide-react';
import { useClerk, UserButton } from "@clerk/nextjs";

import UsersTab from './UsersTab';
import MarketingTab from './MarketingTab';

type Tab = 'users' | 'marketing';

export default function AdminClient() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // Sync tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['users', 'marketing'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const menuItems = [
    { label: 'Users', icon: Users, id: 'users' as const },
    { label: 'Marketing', icon: Megaphone, id: 'marketing' as const },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden transition-colors">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0 z-50 transition-colors">
        <div className="p-6">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => router.push('/')}>
            <span className="text-lg font-medium tracking-tight text-foreground">Supertime Admin</span>
            <span className="text-[9px] font-bold uppercase tracking-widest bg-red-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">HQ</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all text-sm font-medium ${activeTab === item.id
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted hover:bg-background hover:text-foreground border border-transparent'
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-1">
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 px-4 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
        <div className="flex justify-around items-center">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === item.id ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-background pb-20 lg:pb-0 transition-colors">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex justify-between items-center lg:px-12 lg:py-8 border-b border-border transition-colors">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {menuItems.find(m => m.id === activeTab)?.icon && React.createElement(menuItems.find(m => m.id === activeTab)!.icon as any, { className: 'w-5 h-5 text-muted' })}
            {menuItems.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-3">
             <div className="ml-2 flex items-center">
                <UserButton afterSignOutUrl="/" />
             </div>
          </div>
        </header>

        <div className="px-6 lg:px-12 pb-12 pt-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-6xl mx-auto space-y-12"
          >
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'marketing' && <MarketingTab />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
