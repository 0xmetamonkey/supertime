'use client';
import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

type WalletProps = {
  onBalanceChange: (balance: number) => void;
};

export default function WalletManager({ onBalanceChange }: WalletProps) {
  const router = useRouter();
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
        onClick={() => router.push('/wallet')}
        className="flex items-center gap-2 bg-white border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none translate-x-[-2px] translate-y-[-2px]"
      >
        <span className="text-black font-black text-sm tabular-nums">
          {balance === null ? '...' : balance} <span className="text-[10px]">TKN</span>
        </span>
        <div className="w-6 h-6 bg-neo-green border-2 border-black flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-neo-yellow">
          +
        </div>
      </button>
    </>
  );
}
