'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface WalletTabProps {
  withdrawable: number;
  balance: number;
}

export default function WalletTab({ withdrawable, balance }: WalletTabProps) {
  const router = useRouter();

  return (
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
  );
}
