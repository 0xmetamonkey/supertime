'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ArrowLeft,
  TrendingUp,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [withdrawable, setWithdrawable] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    fetchWalletData();
    const interval = setInterval(fetchWalletData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await fetch('/api/wallet');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setBalance(data.balance);
      setWithdrawable(data.withdrawable || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
              await fetchWalletData();
              alert("Energy Loaded! Your credits are ready.");
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
        fetchWalletData();
      } else {
        alert(data.error || "Withdrawal failed.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-black animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black p-6 md:p-12 font-sans selection:bg-neo-pink selection:text-white">
      {/* NAVIGATION */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 px-4">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 font-black uppercase text-xs tracking-widest hover:text-neo-pink transition-colors"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_theme(colors.neo-pink)]">
            <Zap className="text-neo-yellow w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-black uppercase tracking-tighter">Vault</span>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </nav>

      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12">

          {/* LEFT: BALANCES */}
          <div className="lg:col-span-7 space-y-12">

            {/* SPENDING BALANCE */}
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Current Power</h2>
              <div className="neo-box bg-neo-yellow p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-black/5 rounded-full translate-x-12 translate-y-[-12px] blur-3xl text-black" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="text-8xl font-black tracking-tighter tabular-nums mb-2 leading-none">
                      {balance?.toLocaleString() ?? '0'}
                    </div>
                    <div className="flex items-center gap-2 font-black uppercase text-sm tracking-widest opacity-60">
                      <Sparkles className="w-4 h-4" />
                      Active Credits (TKN)
                    </div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-md px-4 py-2 border-2 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    Available to spend
                  </div>
                </div>
              </div>
            </section>

            {/* WITHDRAWABLE EARNINGS */}
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Creator Earnings</h2>
              <div className="neo-box bg-neo-pink p-10 text-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div>
                    <div className="text-6xl font-black tracking-tighter tabular-nums leading-none mb-2">
                      ₹{withdrawable.toLocaleString()}
                    </div>
                    <div className="font-black uppercase text-xs tracking-widest opacity-80">
                      Settled INR (Withdrawable)
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setWithdrawAmount(withdrawable);
                      setShowWithdrawModal(true);
                    }}
                    disabled={withdrawable <= 0}
                    className="neo-btn bg-white text-black px-10 py-5 font-black uppercase text-sm hover:bg-neo-yellow transition-all disabled:opacity-50"
                  >
                    WITHDRAW TO BANK
                  </button>
                </div>
              </div>
            </section>

            {/* ACTIVITY PLACEHOLDER */}
            <section className="pt-8">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Recent Activity</h3>
                <div className="h-1 flex-1 bg-black/10" />
                <History className="w-6 h-6 text-zinc-300" />
              </div>
              <div className="space-y-4">
                <div className="neo-box bg-zinc-50 border-2 border-black/5 p-6 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neo-green/20 border-2 border-black/5 flex items-center justify-center text-neo-green">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black uppercase text-sm">Welcome Power</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">System Credit</p>
                    </div>
                  </div>
                  <span className="font-black text-neo-green">+0 TKN</span>
                </div>
                <p className="text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest py-8">End of records</p>
              </div>
            </section>
          </div>

          {/* RIGHT: TOP UP MENU */}
          <div className="lg:col-span-5">
            <div className="sticky top-12 space-y-8">
              <div className="neo-box bg-neo-blue p-8 border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] text-white">
                <div className="flex items-center gap-3 mb-8">
                  <TrendingUp className="w-6 h-6 text-[#CEFF1A]" />
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic">Top Up</h3>
                </div>

                <div className="grid gap-4">
                  {[100, 500, 1000, 5000].map((tkn) => (
                    <button
                      key={tkn}
                      onClick={() => handleRecharge(tkn)}
                      disabled={isProcessing}
                      className="group neo-box bg-white p-6 border-4 border-black text-black hover:bg-neo-yellow transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-black">Boost Energy</p>
                        <p className="text-3xl font-black tabular-nums">{tkn} <span className="text-xs">TKN</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-neo-pink group-hover:text-black">Price</p>
                        <p className="text-xl font-black tabular-nums">₹{tkn}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-10 p-4 border-4 border-white/20 border-dashed text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Verified Secure Transaction • 1 TKN = ₹1</p>
                </div>
              </div>

              <div className="neo-box bg-black text-white p-6 border-2 border-black flex items-center gap-4">
                <CreditCard className="w-8 h-8 text-neo-pink" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Payment Partner</p>
                  <p className="text-sm font-bold opacity-60">Managed by Razorpay</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white border-8 border-black shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] p-10 max-w-sm w-full"
            >
              <div className="flex justify-between items-start mb-8 text-black">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Settlement</h2>
                <button onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 border-2 border-black flex items-center justify-center font-black transition-all">✕</button>
              </div>

              <div className="space-y-6 text-black">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1">UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="user@upi"
                    className="w-full bg-zinc-50 border-4 border-black p-4 font-black uppercase text-sm outline-none focus:bg-neo-yellow/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    max={withdrawable}
                    className="w-full bg-zinc-50 border-4 border-black p-4 font-black text-2xl outline-none focus:bg-neo-yellow/10"
                  />
                  <p className="text-[10px] font-bold text-zinc-400 mt-2">Max withdrawable: ₹{withdrawable}</p>
                </div>

                <button
                  onClick={handleWithdrawRequest}
                  disabled={isProcessing || !upiId || withdrawAmount <= 0}
                  className="w-full bg-neo-pink text-white py-5 font-black uppercase text-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'PROCESSING...' : 'CONFIRM WITHDRAWAL'}
                </button>
                <p className="text-[8px] font-bold text-zinc-400 text-center uppercase tracking-widest mt-4">
                  Funds will be transferred via UPI within 24-48 hours.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
