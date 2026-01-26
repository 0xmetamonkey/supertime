'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await fetch('/api/wallet');
      if (res.status === 401) {
        window.location.href = '/api/auth/signin'; // Force login if not authenticated
        return;
      }
      const data = await res.json();
      setBalance(data.balance || 0);
      setIsCreator(data.isCreator || false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (amount: number) => {
    setProcessing(true);
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
        description: `Add ${amount * 10} Credits`,
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
              alert("Payment Successful! Credits added.");
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
        alert("Payment Failed: " + response.error.description);
      });
      rzp1.open();

    } catch (e: any) {
      alert(`Could not initiate payment: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = () => {
    // MVP Withdraw Logic
    const amount = prompt("Enter amount to withdraw (TKN):");
    if (!amount) return;

    alert(`Withdrawal request for ${amount} TKN received! We will process this to your registered bank account within 7 days. (This is a demo message for MVP)`);
    // Ideally we would send a POST to /api/wallet/withdraw
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <nav className="flex justify-between items-center mb-12">
        <a href="/" className="text-xl font-bold tracking-tighter italic">supertime.wallet</a>
        <div className="flex gap-4">
          {isCreator && (
            <a href="/studio" className="text-zinc-400 hover:text-white text-sm font-bold">Studio</a>
          )}
          <button onClick={() => window.location.href = '/api/auth/signout'} className="text-red-500 text-sm font-bold">Log out</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12">

          {/* LEFT: Balance & Actions */}
          <div className="flex-1">
            <h1 className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Total Balance</h1>
            <div className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter">
              {balance.toLocaleString()} <span className="text-2xl text-purple-500">TKN</span>
            </div>

            {isCreator ? (
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-8">
                <h3 className="font-bold text-xl mb-2 text-white">Creator Earnings</h3>
                <p className="text-zinc-400 text-sm mb-6">You can withdraw your earnings directly to your bank account.</p>
                <button
                  onClick={handleWithdraw}
                  className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Request Payout 💸
                </button>
              </div>
            ) : null}

            {/* Transaction History Placeholder */}
            <div>
              <h3 className="text-zinc-500 text-xs font-bold uppercase mb-4">Recent Activity</h3>
              <div className="space-y-2">
                <div className="bg-zinc-900/50 p-4 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">↓</div>
                    <span className="font-bold text-sm">Welcome Bonus</span>
                  </div>
                  <span className="font-mono text-green-400 font-bold">+0 TKN</span>
                </div>
                {/* Better history requires a dedicated API endpoint */}
              </div>
            </div>
          </div>

          {/* RIGHT: Top Up */}
          <div className="flex-1">
            <div className="bg-[#111] border border-zinc-800 rounded-3xl p-8 sticky top-12">
              <h2 className="text-2xl font-bold mb-6">Add Funds</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[100, 500, 1000, 5000].map((tkn) => (
                  <button
                    key={tkn}
                    onClick={() => handleRecharge(Math.floor(tkn / 10))}
                    disabled={processing}
                    className="group py-6 px-4 bg-black border border-zinc-800 rounded-2xl hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all text-left"
                  >
                    <p className="text-zinc-500 text-xs uppercase mb-1">Buy</p>
                    <p className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors">{tkn}</p>
                    <p className="text-zinc-400 font-mono text-sm mt-1">₹{tkn / 10}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-zinc-500">
                Secured by Razorpay. 100% Safe.
              </p>
              {processing && <p className="text-center text-purple-500 text-sm mt-4 animate-pulse">Processing Payment...</p>}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
