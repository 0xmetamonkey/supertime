'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Wallet, TrendingUp } from 'lucide-react';

interface WalletTabProps {
  withdrawable: number;
  balance: number;
}

export default function WalletTab({ withdrawable, balance }: WalletTabProps) {
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleRecharge = async (amount: number) => {
    setIsProcessing(true);
    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: amount }), // Amount in INR
      });
      const orderData = await orderRes.json();
      if (orderData.error) throw new Error(orderData.error);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Supertime",
        description: `Add ${amount} Credits`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert("Energy Loaded! Your credits are ready.");
              window.location.reload();
            } else {
              alert("Payment Verification Failed.");
            }
          } catch (err) {
            alert("Payment failed during verification.");
          }
        },
        theme: { color: "#D652FF" }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        alert("Transaction Aborted: " + response.error.description);
      });
      rzp1.open();
    } catch (e: any) {
      alert(`Could not initiate payment: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawRequest = async () => {
    if (!upiId || withdrawAmount <= 0) {
      alert("Invalid details.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', amount: withdrawAmount, upiId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Settlement Request Sent. Funds deducted.");
        setShowWithdrawModal(false);
        window.location.reload();
      } else {
        alert(data.error || "Withdrawal failed.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* WITHDRAWABLE / EARNINGS */}
        <div className="bg-white dark:bg-surface border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm transition-colors flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium text-gray-500">Settled Earnings</span>
            <h2 className="text-4xl font-medium tracking-tight text-gray-900 dark:text-foreground mt-2 mb-4">₹{withdrawable.toLocaleString()}</h2>
            <p className="text-sm text-gray-500 dark:text-muted mb-8">
              Available to withdraw to your linked bank account.
            </p>
          </div>
          <button 
            disabled={withdrawable <= 0}
            className="w-full bg-gray-900 dark:bg-foreground text-white dark:text-background rounded-xl font-medium py-3.5 transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" 
            onClick={() => {
              setWithdrawAmount(withdrawable);
              setShowWithdrawModal(true);
            }}
          >
            <Wallet className="w-5 h-5" />
            Withdraw Funds
          </button>
        </div>

        {/* CREDITS / BALANCE */}
        <div className="bg-gray-100 dark:bg-surface border border-gray-200 dark:border-border rounded-2xl p-8 shadow-sm transition-colors text-gray-900 dark:text-foreground flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-neo-pink/10 rounded-full blur-3xl group-hover:bg-neo-pink/20 transition-all pointer-events-none" />
          <div className="relative z-10">
            <span className="text-sm font-medium text-gray-500">Credits</span>
            <h2 className="text-4xl font-medium tracking-tight text-gray-900 dark:text-foreground mt-2 mb-4">{balance.toLocaleString()} Credits</h2>
            <p className="text-sm text-gray-500 dark:text-muted mb-8">
              Use credits to book creators and access premium features.
            </p>
          </div>
          <button 
            className="w-full bg-white dark:bg-background border border-gray-200 dark:border-border text-gray-900 dark:text-foreground rounded-xl font-medium py-3.5 shadow-sm transition-all hover:opacity-90 relative z-10 flex items-center justify-center gap-2" 
            onClick={() => setShowTopUpModal(true)}
          >
            <TrendingUp className="w-5 h-5 text-green-500" />
            Top Up Credits
          </button>
        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="bg-white dark:bg-surface border border-gray-100 dark:border-border shadow-xl rounded-2xl p-8 max-w-sm w-full relative"
            >
              <button 
                onClick={() => setShowWithdrawModal(false)} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground tracking-tight">Withdraw Funds</h2>
                <p className="text-sm text-gray-500 mt-1">Transfer earnings to your bank account.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-muted block mb-1.5">UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="user@upi"
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl p-3.5 text-sm outline-none focus:border-gray-900 dark:focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-muted block mb-1.5">Amount (INR)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    max={withdrawable}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl p-3.5 text-lg font-medium outline-none focus:border-gray-900 dark:focus:border-foreground transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex justify-between">
                    <span>Available: ₹{withdrawable}</span>
                    <button 
                      className="text-blue-500 hover:text-blue-600 font-medium" 
                      onClick={() => setWithdrawAmount(withdrawable)}
                    >
                      Max
                    </button>
                  </p>
                </div>

                <button
                  onClick={handleWithdrawRequest}
                  disabled={isProcessing || !upiId || withdrawAmount <= 0}
                  className="w-full mt-4 bg-gray-900 dark:bg-foreground text-white dark:text-background py-3.5 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 flex justify-center items-center"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* TOP UP MODAL */}
        {showTopUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="bg-white dark:bg-surface border border-gray-100 dark:border-border shadow-xl rounded-2xl p-8 max-w-md w-full relative"
            >
              <button 
                onClick={() => setShowTopUpModal(false)} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground tracking-tight">Top Up Credits</h2>
                <p className="text-sm text-gray-500 mt-1">1 Credit = ₹1. Choose an amount to recharge.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[100, 500, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleRecharge(amount)}
                    disabled={isProcessing}
                    className="bg-gray-50 dark:bg-background border border-gray-200 dark:border-border p-4 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-gray-900 dark:hover:border-foreground transition-all group disabled:opacity-50"
                  >
                    <span className="text-lg font-semibold text-gray-900 dark:text-foreground group-hover:text-green-500 transition-colors">
                      {amount}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Credits</span>
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-background rounded-xl p-4 flex items-center gap-4 border border-gray-100 dark:border-border">
                <CreditCard className="w-8 h-8 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-foreground">Secured by Razorpay</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Supports UPI, Cards, Netbanking & Wallets</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
