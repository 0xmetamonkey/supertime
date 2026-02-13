'use client';

import React from 'react';
import { LayoutDashboard, Wallet, User, Settings, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav({ username }: { username: string | null }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Studio', icon: LayoutDashboard, href: '/studio' },
    { label: 'Wallet', icon: Wallet, href: '/wallet' },
    { label: 'Profile', icon: User, href: `/${username}` },
    { label: 'Settings', icon: Settings, href: '/studio?settings=true' },
  ];

  if (!username) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t-4 border-black px-6 py-3 pb-safe-area flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-black' : 'text-black/30'}`}
          >
            <div className={`p-2 rounded-lg border-2 ${isActive ? 'bg-neo-yellow border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-transparent'}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
