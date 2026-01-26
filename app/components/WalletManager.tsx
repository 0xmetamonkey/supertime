'use client';
import { useState, useEffect } from 'react';

type WalletProps = {
  onBalanceChange: (balance: number) => void;
};

export default function WalletManager({ onBalanceChange }: WalletProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);

  // Method is now just "Add Funds" since Razorpay handles cards/UPI/Netbanking
  // We keep the state valid for now but will simplify UI
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`/api/wallet`);
      const data = await res.json();
      setBalance(data.balance);
      onBalanceChange(data.balance);
    } catch (e) {
      console.error('Failed to fetch balance', e);
    }
  };

  const handleRecharge = async (amount: number) => {
    setLoading(true);
    try {
      // 1. Create Order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: amount }), // Amount in INR (we treat TKN as 1/10th INR or similar logic)
        // For MVP, let's say 1 TKN = 1 Rupee for simplicity in billing, or 100 TKN = 100 Rupees.
        // The implementation assumes 'amount' passed here is what user pays in INR.
        // Wait, the UI shows "500 TKN". 
        // Let's assume 10 TKN = 1 INR. So 500 TKN = 50 INR.
      });

      const orderData = await orderRes.json();

      if (orderData.error) throw new Error(orderData.error);

      // 2. Open Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Supertime",
        description: `Add ${amount} Credits`, // Amount here is TKN
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify Payment
          try {
            // We verify via our backend
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
              // Refresh Balance
              await fetchBalance();
              setShowRecharge(false);
              alert("Payment Successful! Credits added.");
            } else {
              alert("Payment Verification Failed.");
            }
          } catch (err) {
            console.error("Verification error", err);
            alert("Payment failed during verification.");
          }
        },
        prefill: {
          // We could prefill email/phone if we had it from Auth
          // email: "user@example.com",
        },
        theme: {
          color: "#D652FF"
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp1.open();

    } catch (e: any) {
      console.error('Recharge init failed', e);
      alert(`Could not initiate payment: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <button
        onClick={() => setShowRecharge(true)}
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition-colors px-4 py-2 rounded-full border border-white/5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-purple-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span className="text-white font-mono font-bold text-sm">
          {balance === null ? '...' : balance}
        </span>
        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold leading-none ml-1">
          +
        </div>
      </button>

      {/* Recharge Modal Overlay */}
      {showRecharge && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">

            <div className="p-6 pb-2 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Add Credits</h2>
              <div className="flex gap-4">
                <a href="/wallet" className="text-zinc-500 hover:text-white text-sm font-bold flex items-center">Open Wallet →</a>
                <button onClick={() => setShowRecharge(false)} className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">✕</button>
              </div>
            </div>

            <div className="p-6 pt-4">
              <p className="text-zinc-400 text-sm mb-4">
                Select a pack to recharge. Secure payment via Razorpay.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[100, 500, 1000, 5000].map((tkn) => (
                  <button
                    key={tkn}
                    onClick={() => handleRecharge(Math.floor(tkn / 10))} // Passing INR amount. 10 TKN = 1 INR
                    disabled={loading}
                    className="relative group py-4 px-4 bg-zinc-800 rounded-xl hover:bg-purple-600 active:scale-95 transition-all text-left border border-zinc-700 hover:border-purple-500"
                  >
                    <span className="block text-xs text-zinc-400 group-hover:text-purple-200 mb-1">Get</span>
                    <span className="text-xl font-bold text-white group-hover:text-white">{tkn} TKN</span>
                    <span className="absolute top-4 right-4 text-xs font-mono text-zinc-500 group-hover:text-white opacity-50">
                      ₹{Math.floor(tkn / 10)}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-center text-zinc-500">
                Secured by Razorpay. 100% Safe.
              </p>
              {loading && (
                <div className="mt-4 text-center text-purple-400 text-sm animate-pulse">
                  Opening Secure Payment...
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-center">
                <button onClick={() => window.location.href = '/api/auth/signout'} className="text-xs text-red-500 font-bold hover:text-red-400">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
