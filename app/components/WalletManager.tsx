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
        className="flex items-center gap-2 bg-white dark:bg-black border-4 border-black dark:border-white px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_theme(colors.neo-pink)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span className="text-black dark:text-white font-black text-sm tabular-nums">
          {balance === null ? '...' : balance} <span className="text-[10px]">TKN</span>
        </span>
        <div className="w-6 h-6 bg-neo-green border-2 border-black flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          +
        </div>
      </button>

      {/* Recharge Modal Overlay */}
      {showRecharge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-8 border-black dark:border-white shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_theme(colors.neo-pink)] p-8 relative overflow-hidden">

            <div className="flex justify-between items-start mb-8 pb-4 border-b-4 border-black dark:border-white">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Energy Vault</h2>
              <button
                onClick={() => setShowRecharge(false)}
                className="w-10 h-10 border-4 border-black dark:border-white flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-all text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-8 leading-relaxed">
              Exchange your currency for <span className="text-neo-pink font-black">Super Tokens</span>. 1 TKN = ₹1.00
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {[100, 500, 1000, 5000].map((tkn) => (
                <button
                  key={tkn}
                  onClick={() => handleRecharge(tkn)}
                  disabled={loading}
                  className="neo-box bg-white dark:bg-black p-4 text-left hover:bg-neo-yellow dark:hover:bg-neo-yellow transition-colors group"
                >
                  <p className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-black">Get Pack</p>
                  <p className="text-2xl font-black tabular-nums group-hover:text-black">{tkn} <span className="text-xs">TKN</span></p>
                  <p className="text-[10px] font-bold text-neo-pink font-mono mt-2">₹{tkn}.00</p>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {loading && (
                <div className="text-center py-4 bg-neo-blue text-white font-black uppercase italic animate-pulse border-4 border-black">
                  Securing Transaction...
                </div>
              )}

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={async () => {
                    await fetch('/api/wallet', {
                      method: 'POST',
                      body: JSON.stringify({ action: 'dev_faucet' })
                    });
                    fetchBalance();
                    alert("Dev Faucet: Added 5000 TKN");
                  }}
                  className="w-full neo-btn bg-neo-green text-black py-4 hover:bg-neo-green/80"
                >
                  DEV FAUCET: +5000 TKN
                </button>
              )}
            </div>

            <p className="mt-8 text-[10px] font-black uppercase text-zinc-400 text-center tracking-[0.2em]">
              Verified Secure by Razorpay
            </p>
          </div>
        </div>
      )}
    </>
  );
}
