'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import {
  Zap,
  Globe,
  Heart,
  Clock,
  Sparkles,
  ArrowRight,
  Mic,
  Video,
  Instagram,
  Link as LinkIcon,
  Send,
  HelpCircle,
  ChevronDown,
  ShoppingBag,
  Package,
  Calendar,
  Coffee,
  Download,
  ExternalLink,
  Check,
  Loader2,
  Youtube,
  Twitter,
  MessageSquare,
} from 'lucide-react';
import WalletManager from '../components/WalletManager';
import dynamic from 'next/dynamic';
const SuperCall = dynamic(() => import('../components/SuperCall'), { ssr: false });
const BroadcastViewer = dynamic(() => import('../components/Broadcast/BroadcastViewer'), { ssr: false });
import { useUser, useClerk } from "@clerk/nextjs";

interface CreatorClientProps {
  username: string,
  user: any,
  isOwner: boolean,
  ownerEmail: string,
  isVerified?: boolean,
  socials?: any,
  videoRate?: number;
  audioRate?: number;
  profileImage?: string;
  isLive?: boolean;
  isAcceptingCalls?: boolean;
  templates?: any[];
  availability?: any;
  artifacts?: any[];
  faqs?: any[];
  roomType?: 'audio' | 'video';
  isRoomFree?: boolean;
  studioMode?: 'solitude' | 'theatre' | 'private';
  _ablySignaling?: any; // Injected from CreatorWrapper for real-time signaling
}

// FAQ Accordion component for public profile
function FAQSection({ faqs }: { faqs: { id: string; question: string; answer: string }[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <HelpCircle className="w-7 h-7" />
        <h3 className="text-3xl font-black uppercase tracking-tighter text-black">FAQ</h3>
        <div className="h-2 flex-1 bg-black" />
      </div>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 transition-colors"
            >
              <span className="font-black text-sm uppercase tracking-tight pr-4">{faq.question}</span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${openId === faq.id ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openId === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0 border-t-4 border-black">
                    <p className="text-sm font-bold text-zinc-600 leading-relaxed pt-4">{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreatorClient({
  username,
  user: initialUser,
  isOwner,
  ownerEmail,
  isVerified,
  socials,
  videoRate = 100,
  audioRate = 50,
  profileImage = "",
  isLive = true,
  isAcceptingCalls = true,
  templates = [],
  availability = {},
  artifacts = [],
  faqs = [],
  roomType = 'audio',
  isRoomFree = true,
  studioMode = 'solitude',
  _ablySignaling
}: CreatorClientProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const [guestId] = useState(() => Math.random().toString(36).slice(2, 7));
  const uid = clerkUser?.id || `guest-${guestId}`;
  const isLoggedIn = !!clerkUser;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSimulated = searchParams.get('sim') === 'true';
  const isTestMode = searchParams.get('test') === 'true';

  // State
  const [balance, setBalance] = useState<number>(5000); // TEST MODE: Backdoor Enabled
  const [isCalling, setIsCalling] = useState(false);
  const [isWatching, setIsWatching] = useState(false); // Watching broadcast (Theatre mode)
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [tokensSpent, setTokensSpent] = useState(0);
  const [isCreatorOnline, setIsCreatorOnline] = useState(isLive);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingTemplate, setBookingTemplate] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);

  const [admirerList, setAdmirerList] = useState<{ email: string; username: string | null }[]>([]);
  const [showAdmirersModal, setShowAdmirersModal] = useState(false);
  const [isLoadingAdmirers, setIsLoadingAdmirers] = useState(false);

  const [profileTab, setProfileTab] = useState<'store' | 'shows' | 'courses' | 'about'>('store');
  const [shows, setShows] = useState<any[]>([]);
  const [loadingShows, setLoadingShows] = useState(false);

  useEffect(() => {
    const fetchShows = async () => {
      setLoadingShows(true);
      try {
        const res = await fetch(`/api/shows?username=${username}`);
        const data = await res.json();
        setShows(data.shows || []);
      } catch (e) {
        console.error("Failed to fetch shows", e);
      } finally {
        setLoadingShows(false);
      }
    };
    if (username) fetchShows();
  }, [username]);
  const [products, setProducts] = useState<any[]>([]);
  const [tipAmount, setTipAmount] = useState('');
  const [purchasedProduct, setPurchasedProduct] = useState<any>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [tipping, setTipping] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/user/products?username=${username}`)
      .then(res => res.json())
      .then(data => setProducts(data.products || []));
  }, [username]);

  const handleBuyProduct = async (product: any) => {
    if (!isLoggedIn) {
      openSignIn({ forceRedirectUrl: window.location.pathname });
      return;
    }
    setBuyingId(product.id);
    try {
      const res = await fetch('/api/payment/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: product.price,
          productId: product.id,
          creatorUsername: username,
        }),
      });
      const order = await res.json();
      if (!order.orderId) { setBuyingId(null); return; }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: `Buy: ${product.name}`,
        description: `From @${username}`,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payment/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify',
              amount: product.price,
              productId: product.id,
              creatorUsername: username,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();
          if (result.success && result.deliverable) {
            setPurchasedProduct(result.deliverable);
          } else if (result.success) {
            setPurchasedProduct({ type: product.type, content: product.content, name: product.name });
          }
          setBuyingId(null);
        },
        modal: { ondismiss: () => setBuyingId(null) },
        theme: { color: '#000000' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Purchase error:', err);
      setBuyingId(null);
    }
  };

  const handleTip = async () => {
    if (!isLoggedIn) {
      openSignIn({ forceRedirectUrl: window.location.pathname });
      return;
    }
    const amount = parseInt(tipAmount);
    if (!amount || amount < 1) return;
    setTipping(true);
    try {
      const res = await fetch('/api/payment/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, creatorUsername: username }),
      });
      const order = await res.json();
      if (!order.orderId) { setTipping(false); return; }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: `Tip for @${username}`,
        description: `₹${amount} tip`,
        handler: async (response: any) => {
          await fetch('/api/payment/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify',
              amount,
              creatorUsername: username,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          setTipSuccess(true);
          setTipAmount('');
          setTipping(false);
          setTimeout(() => setTipSuccess(false), 3000);
        },
        modal: { ondismiss: () => setTipping(false) },
        theme: { color: '#000000' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Tip error:', err);
      setTipping(false);
    }
  };

  const productTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
    digital: { icon: Package, label: 'Digital Product', color: 'neo-green' },
    link: { icon: LinkIcon, label: 'Link / Course', color: 'neo-blue' },
    booking: { icon: Calendar, label: 'Booking / Call', color: 'neo-pink' },
  };

  // Reactive sync with unified signaling
  useEffect(() => {
    if (_ablySignaling?.activeCall) {
      console.log('[CreatorClient] 📞 Active call detected via signaling:', _ablySignaling.activeCall);
      setIsCalling(true);
      setCallType(_ablySignaling.activeCall.type);
      setActiveChannelName(_ablySignaling.activeCall.channelName);
    } else if (isCalling && !_ablySignaling?.activeCall && !activeChannelName?.startsWith('room-')) {
      console.log('[CreatorClient] 👋 Call ended via signaling. Resetting session.');
      setIsCalling(false);
      setActiveChannelName(null);
      setCallDuration(0);
      setTokensSpent(0);
    }
  }, [_ablySignaling?.activeCall, isCalling, activeChannelName]);

  const handleFetchAdmirers = async () => {
    setShowAdmirersModal(true);
    if (admirerList.length > 0) return; // Optimization: only fetch once per page load
    setIsLoadingAdmirers(true);
    try {
      const res = await fetch(`/api/user/admire?username=${username}&list=true`);
      const data = await res.json();
      setAdmirerList(data.admirers || []);
    } catch (e) {
      console.error('Failed to fetch admirers:', e);
    } finally {
      setIsLoadingAdmirers(false);
    }
  };

  const lastDeductMinuteRef = useRef<number>(-1);
  // Handle joining Theatre mode broadcast (watch stream)
  const handleJoinRoom = async () => {
    if (!isLoggedIn && !isRoomFree && !isSimulated) {
      openSignIn({ forceRedirectUrl: window.location.pathname });
      return;
    }

    if (isOwner) {
      window.location.href = '/dashboard';
      return;
    }

    // Theatre mode = watch stream (BroadcastViewer)
    setActiveChannelName(`room-${username}`);
    setIsWatching(true);
    setCallDuration(0);
    setTokensSpent(0);
    lastDeductMinuteRef.current = 0;

    // Track stream join
    fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event: 'stream_join', username })
    });
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!isLoggedIn && !isSimulated) {
      openSignIn({ forceRedirectUrl: window.location.pathname });
      return;
    }

    if (isOwner) {
      showError("You can't call yourself! Go to Studio to receive calls.");
      return;
    }

    const currentRate = type === 'video' ? videoRate : audioRate;

    if (balance < currentRate && !isSimulated) {
      showError(`Add ${currentRate} TKN to start a ${type} call.`);
      return;
    }

    if (!isAcceptingCalls && !isSimulated && !isTestMode) {
      showError(`${username} is not accepting calls right now. Try again soon!`);
      return;
    }

    console.log('[Caller] Starting call...', {
      type,
      isSimulated,
      isTestMode,
      isAcceptingCalls,
      providerConnected: _ablySignaling?.isConnected
    });
    let callChannelName: string | null = null;
    try {
      // Use Ably for instant signaling if available
      if (_ablySignaling?.isConnected && _ablySignaling?.initiateCall) {
        console.log('[Caller] Using Ably to initiate call to:', username);
        const isUUID = (str: string) => /^[0-9a-f-]{36}$/i.test(str);
        const fromName = [
          clerkUser?.username,
          clerkUser?.firstName,
          clerkUser?.emailAddresses?.[0]?.emailAddress?.split('@')[0],
        ].find(n => n && typeof n === 'string' && n.trim() !== "" && !isUUID(n)) || (isSimulated ? 'Test User' : 'Guest');

        callChannelName = await _ablySignaling.initiateCall(username, type, fromName);
        setActiveChannelName(callChannelName);
      } else {
        // Fallback to old API if Ably not connected
        console.log('[Caller] Fallback: Using signal API');
        const isUUID = (str: string) => /^[0-9a-f-]{36}$/i.test(str);
        const fromName = [
          clerkUser?.username,
          clerkUser?.firstName,
          clerkUser?.emailAddresses?.[0]?.emailAddress?.split('@')[0],
        ].find(n => n && typeof n === 'string' && n.trim() !== "" && !isUUID(n)) || (isSimulated ? 'Test User' : 'Guest');
        const response = await fetch('/api/call/signal', {
          method: 'POST',
          body: JSON.stringify({ action: 'call', from: uid, fromName, to: username, type })
        });
        const data = await response.json();

        if (data.success && data.channelName) {
          callChannelName = data.channelName;
          setActiveChannelName(data.channelName);
        } else {
          showError("Failed to connect. Please try again.");
          return;
        }
      }
    } catch (e) {
      console.error('[Caller] Error initiating call:', e);
      showError("Connection error. Please try again.");
      return;
    }

    setCallType(type);
    setIsCalling(true);
    setCallDuration(0);
    setTokensSpent(0);
    // Initialize to -1 so the first minute (0) is charged when handleTimeUpdate starts
    lastDeductMinuteRef.current = -1;

    // Track Call Initiation (Not start yet)
    fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event: 'call_initiate', username })
    });
  };

  const handleTimeUpdate = React.useCallback(async (seconds: number) => {
    const currentMinute = Math.floor(seconds / 60);
    const currentRate = callType === 'video' ? videoRate : audioRate;
    const isRoom = activeChannelName?.startsWith('room-');

    console.log(`[Timer] Tick: ${seconds}s, CurrentMinute: ${currentMinute}, LastMinute: ${lastDeductMinuteRef.current}`);

    if (currentMinute > lastDeductMinuteRef.current) {
      console.log(`[Timer] 🔔 NEW MINUTE DETECTED: Charging ${currentRate} TKN`);
      lastDeductMinuteRef.current = currentMinute;
      if (!(isRoom && isRoomFree) && !isSimulated) {
        const success = await deductBalance(currentRate);
        if (success) {
          setTokensSpent(prev => prev + currentRate);
          // Track Earning
          fetch('/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify({ event: 'earning', username, metadata: { amount: currentRate } })
          });
        }
      }
    }
    setCallDuration(seconds);
  }, [callType, videoRate, audioRate, activeChannelName, isRoomFree, isSimulated, username]);

  const [incomingCall, setIncomingCall] = useState<any>(null);

  // Timer for active calls (billing)
  useEffect(() => {
    if (!isCalling || !isPeerConnected) return; // Only run timer if call is active and peer is connected
    const interval = setInterval(() => {
      setCallDuration(prev => {
        const next = prev + 1;
        handleTimeUpdate(next); // Deduct balance every minute
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCalling, isPeerConnected, handleTimeUpdate]); // Add handleTimeUpdate to dependencies

  // Handle call rejection from creator
  useEffect(() => {
    if (_ablySignaling?.hasBeenRejected && isCalling) {
      console.log('[Caller] ❌ Call was rejected by creator');
      showError(`${username} declined the call.`);
      handleEndCall();
      _ablySignaling.setHasBeenRejected(false);
    }
  }, [_ablySignaling?.hasBeenRejected, isCalling, username, _ablySignaling]);

  // Caller Ringer Logic
  const callerRingerRef = useRef<HTMLAudioElement | null>(null); // Ringer Logic (Caller Side)
  useEffect(() => {
    // Stop ringer if peer connected OR if signaling says call was accepted
    const shouldRing = isCalling && !isPeerConnected && !_ablySignaling?.isAccepted;

    if (shouldRing) {
      if (!callerRingerRef.current) {
        callerRingerRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1350/1350-preview.mp3');
        callerRingerRef.current.loop = true;
      }
      callerRingerRef.current.play().catch(e => console.log('[Caller] Ringer blocked:', e));
    } else {
      if (callerRingerRef.current) {
        callerRingerRef.current.pause();
        callerRingerRef.current.currentTime = 0;
      }
    }

    return () => {
      if (callerRingerRef.current) {
        callerRingerRef.current.pause();
      }
    };
  }, [isCalling, isPeerConnected, _ablySignaling?.isAccepted]);


  const handleAcceptCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsCalling(true);
    setActiveChannelName(incomingCall.channelName);
    setIncomingCall(null);
  };

  const handleRejectCall = async () => {
    try {
      await fetch('/api/call/signal', {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', from: uid, to: username })
      });
    } catch (e) { }
    setIncomingCall(null);
  };

  const handleEndCall = async () => {
    console.log('[Caller] 👋 Ending Call Session');

    // 1. Immediately clear local UI state
    setIsCalling(false);
    setActiveChannelName(null);
    setIsPeerConnected(false);
    setCallDuration(0);
    setTokensSpent(0);

    // 2. Immediately tell the signaling hook to clear its state
    // This prevents the useEffect from re-triggering setIsCalling(true)
    _ablySignaling?.endActiveCall();

    try {
      // 3. Notify backend and peer
      fetch('/api/call/signal', {
        method: 'POST',
        body: JSON.stringify({ action: 'end', from: uid, to: username })
      });

      if (_ablySignaling?.cancelCall) {
        await _ablySignaling.cancelCall(username);
      }
    } catch (e) {
      console.error('[Caller] Error during end call cleanup:', e);
    }
  };

  const deductBalance = async (amount: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct_split', amount, recipientEmail: ownerEmail })
      });

      if (res.status === 402) {
        showError("Out of tokens! Call ending...");
        handleEndCall();
        return false;
      }
      const data = await res.json();
      setBalance(data.balance);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleBookCall = async () => {
    if (!bookingDate || !bookingTime || !bookingTemplate) {
      alert("Please select date, time and a session template.");
      return;
    }
    setIsBooking(true);
    try {
      const res = await fetch('/api/call/book', {
        method: 'POST',
        body: JSON.stringify({
          creatorUsername: username,
          date: bookingDate,
          time: bookingTime,
          templateId: bookingTemplate.id,
          type: bookingTemplate.type,
          duration: bookingTemplate.duration,
          price: bookingTemplate.price
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Booking Request Sent!");
        setShowBookingModal(false);
      } else {
        alert("Booking failed: " + data.error);
      }
    } catch (e) {
      alert("Booking failed.");
    } finally {
      setIsBooking(false);
    }
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const [admirerCount, setAdmirerCount] = useState(0);
  const [isAdmiring, setIsAdmiring] = useState(false);

  useEffect(() => {
    fetch(`/api/user/admire?username=${username}`)
      .then(res => res.json())
      .then(data => {
        setAdmirerCount(data.count);
        setIsAdmiring(data.isAdmiring);
      });
  }, [username]);

  const toggleAdmire = async () => {
    if (!isLoggedIn) {
      openSignIn({ forceRedirectUrl: window.location.pathname });
      return;
    }
    const newStatus = !isAdmiring;
    setIsAdmiring(newStatus);
    setAdmirerCount(prev => newStatus ? prev + 1 : prev - 1);
    await fetch('/api/user/admire', {
      method: 'POST',
      body: JSON.stringify({ username, action: newStatus ? 'admire' : 'unadmire' })
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-neo-pink selection:text-white pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-red-500 text-white font-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase text-sm"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {/* The IncomingCallRing is now handled globally in CreatorWrapper/StudioWrapper */}
      </AnimatePresence>

      {/* Watching Stream (Theatre mode) → BroadcastViewer */}
      {isWatching && activeChannelName && (
        <BroadcastViewer
          channelName={activeChannelName}
          uid={uid}
          creatorUsername={username}
          userBalance={balance}
          onLeave={() => {
            setIsWatching(false);
            setActiveChannelName(null);
          }}
          onRequestCall={(type) => {
            // Fan wants 1:1 call from within stream
            setIsWatching(false);
            handleStartCall(type);
          }}
          userDisplayName={[
            clerkUser?.username,
            clerkUser?.firstName,
            clerkUser?.emailAddresses?.[0]?.emailAddress?.split('@')[0],
          ].find(n => n && typeof n === 'string' && n.trim() !== "") || (isSimulated ? 'Test User' : undefined)}
        />
      )}

      {/* 1:1 Call → SuperCall (Premium HUD) */}
      {isCalling && activeChannelName && (
        <div className="fixed inset-0 z-[500] bg-zinc-950">
          {/* Status Bar for 1:1 calls - Standardized Premium Style */}
          <div className="absolute top-6 left-6 right-6 z-[510] flex items-center justify-start">
            <div className="flex items-center gap-2">
              <div className="bg-neo-pink/10 border border-neo-pink/20 px-4 py-2 rounded-xl">
                <span className="text-neo-pink text-sm font-black tabular-nums">-{tokensSpent} TKN</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
                <span className="text-white text-sm font-black tabular-nums">{formatTime(callDuration)}</span>
              </div>
            </div>
          </div>
          <SuperCall
            key={activeChannelName}
            channelName={activeChannelName}
            uid={`caller-${uid}`}
            type={callType!}
            creatorEmail={ownerEmail}
            isCreator={isOwner}
            onDisconnect={handleEndCall}
            onPeerJoined={() => setIsPeerConnected(true)}
            onPeerLeft={() => setIsPeerConnected(false)}
          />
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-10 relative">

        {/* ORGANIZED HEADER: TINY CALL ACTIONS AT TOP */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <button onClick={() => handleStartCall('video')} className="tiny-call-btn" title="Video Call">
              <Video className="w-5 h-5" />
            </button>
            <button onClick={() => handleStartCall('audio')} className="tiny-call-btn" title="Audio Call">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={handleJoinRoom}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border-2 transition-all group ${
                isCreatorOnline 
                  ? 'bg-neo-green/10 border-neo-green hover:bg-neo-green/20' 
                  : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 opacity-80'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isCreatorOnline ? 'bg-neo-green animate-pulse' : 'bg-zinc-400'}`} />
              <span className={`text-[10px] font-black uppercase ${isCreatorOnline ? 'text-neo-green' : 'text-zinc-500'}`}>
                {isCreatorOnline ? 'Live ' : 'Studio '}
                <span className="opacity-40 group-hover:opacity-100 ml-1">• Enter Room</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {socials?.instagram && (
              <a href={socials.instagram.startsWith('http') ? socials.instagram : `https://instagram.com/${socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="monochrome-social">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {socials?.youtube && (
              <a href={socials.youtube.startsWith('http') ? socials.youtube : `https://youtube.com/${socials.youtube.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="monochrome-social">
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {socials?.x && (
              <a href={socials.x.startsWith('http') ? socials.x : `https://x.com/${socials.x.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="monochrome-social font-black text-xs">
                𝕏
              </a>
            )}
            {socials?.website && (
              <a href={socials.website.startsWith('http') ? socials.website : `https://${socials.website}`} target="_blank" rel="noopener noreferrer" className="monochrome-social">
                <Globe className="w-4 h-4" />
              </a>
            )}
            <a href={`/chat?to=${username}`} className="monochrome-social group relative">
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-widest border border-white/20">
                Direct Chat
              </span>
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showError("Link Copied!");
              }}
              className="monochrome-social"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROFILE HERO */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="relative mb-6">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt={username} className="w-full h-full object-cover" />
              ) : (
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
              )}
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
            {username}
            {isVerified && <Zap className="w-8 h-8 md:w-10 md:h-10 text-neo-blue fill-neo-blue inline-block ml-2" />}
          </h1>
          <div className="flex items-center gap-2 mb-6">
            <button onClick={toggleAdmire} className={`flex items-center gap-2 border-2 border-black px-3 py-1 font-black uppercase text-xs shadow-[2px_2px_0px_0px_black] ${isAdmiring ? 'bg-neo-pink text-white' : 'bg-white text-black'}`}>
              <Heart className={`w-4 h-4 ${isAdmiring ? 'fill-white' : ''}`} /> {admirerCount}
            </button>
          </div>
          <p className="max-w-xl text-sm font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
            Scaling human connection through time-based digital assets and elite calls.
          </p>
        </div>

        {/* TAB SYSTEM */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_black] overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex border-b-4 border-black">
            <button onClick={() => setProfileTab('store')} className={`flex-1 store-tab-btn ${profileTab === 'store' ? 'store-tab-active' : 'store-tab-inactive'}`}>Store</button>
            <button onClick={() => setProfileTab('shows')} className={`flex-1 store-tab-btn ${profileTab === 'shows' ? 'store-tab-active' : 'store-tab-inactive'}`}>
              Shows {shows.length > 0 && <span className="ml-1 bg-neo-pink text-white text-[9px] px-1.5 py-0.5 rounded-full">{shows.length}</span>}
            </button>
            <button onClick={() => setProfileTab('courses')} className={`flex-1 store-tab-btn ${profileTab === 'courses' ? 'store-tab-active' : 'store-tab-inactive'}`}>Courses</button>
            <button onClick={() => setProfileTab('about')} className={`flex-1 store-tab-btn ${profileTab === 'about' ? 'store-tab-active' : 'store-tab-inactive'}`}>About</button>
          </div>

          <div className="p-6 md:p-10 flex-1">
            {profileTab === 'store' && (
              <div className="space-y-8">
                {/* Product Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Real Products */}
                  {products && products.length > 0 && products.map((prod: any) => {
                    const typeConf = productTypeConfig[prod.type] || productTypeConfig.digital;
                    const TypeIcon = typeConf.icon;
                    return (
                      <motion.div
                        key={prod.id}
                        whileHover={{ y: -2 }}
                        className="neo-box bg-white border-4 border-black shadow-[6px_6px_0px_0px_black] group overflow-hidden"
                      >
                        {/* Thumbnail */}
                        {prod.thumbnail ? (
                          <div className="h-40 bg-zinc-100 border-b-4 border-black overflow-hidden">
                            <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                        ) : (
                          <div className="h-20 bg-zinc-50 border-b-4 border-black flex items-center justify-center">
                            <TypeIcon className="w-8 h-8 opacity-10" />
                          </div>
                        )}

                        <div className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-black text-white">
                              {typeConf.label}
                            </span>
                            {prod.type === 'booking' && prod.duration && (
                              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {prod.duration}
                              </span>
                            )}
                          </div>

                          <h4 className="font-black uppercase tracking-tight text-lg mb-1 leading-tight">{prod.name}</h4>
                          {prod.description && (
                            <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed mb-4 line-clamp-2">{prod.description}</p>
                          )}

                          <div className="mt-4 pt-4 border-t-2 border-zinc-100 flex justify-between items-center">
                            <span className="text-xl font-black text-neo-green">₹{prod.price}</span>
                            <button
                              onClick={() => handleBuyProduct(prod)}
                              disabled={buyingId === prod.id}
                              className="neo-btn bg-black text-white px-5 py-2 font-black uppercase text-[10px] flex items-center gap-2 disabled:opacity-50"
                            >
                              {buyingId === prod.id ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                              ) : (
                                <><ShoppingBag className="w-3.5 h-3.5" /> Buy Now</>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Session Templates */}
                  {templates && templates.length > 0 && templates.map((tpl: any) => (
                    <div key={tpl.id} onClick={() => handleStartCall(tpl.type)} className="neo-box bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_black] group hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 border-2 border-black ${tpl.type === 'video' ? 'bg-neo-pink text-white' : 'bg-neo-blue text-white'}`}>{tpl.duration} Min {tpl.type}</span>
                        <Zap className="w-4 h-4 text-zinc-300 group-hover:text-neo-pink transition-colors" />
                      </div>
                      <h4 className="font-black uppercase tracking-tight text-lg mb-1">{tpl.duration} Min Session</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase line-clamp-2">{tpl.description || 'Instant 1:1 access for high-value consulting.'}</p>
                      <div className="mt-6 pt-4 border-t-2 border-zinc-50 flex justify-between items-center">
                        <span className="font-black text-neo-green">{tpl.price} TKN</span>
                        <span className="text-[8px] font-black uppercase text-neo-pink">Call Now</span>
                      </div>
                    </div>
                  ))}

                  {(!products || products.length === 0) && (!templates || templates.length === 0) && (
                    <div className="col-span-2 py-20 bg-zinc-50 border-4 border-black border-dashed flex flex-col items-center justify-center opacity-50">
                      <Clock className="w-10 h-10 mb-4" />
                      <p className="text-[10px] font-black uppercase">Store items arriving soon...</p>
                    </div>
                  )}
                </div>

                {/* Tip Jar */}
                <div className="neo-box bg-zinc-50 p-8 border-4 border-black shadow-[6px_6px_0px_0px_black]">
                  <div className="flex items-center gap-3 mb-4">
                    <Coffee className="w-6 h-6" />
                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Support {username}</h4>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">
                    Show your appreciation with a tip — 100% goes to the creator
                  </p>
                  <div className="flex gap-3 mb-4">
                    {[49, 99, 199, 499].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setTipAmount(String(amt))}
                        className={`flex-1 py-3 border-4 border-black font-black text-sm transition-all ${tipAmount === String(amt)
                            ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]'
                            : 'bg-white shadow-[4px_4px_0px_0px_black] hover:shadow-[2px_2px_0px_0px_black]'
                          }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={tipAmount}
                      onChange={e => setTipAmount(e.target.value)}
                      placeholder="Custom amount"
                      min="1"
                      className="flex-1 bg-white border-4 border-black p-3 font-bold text-sm focus:outline-none"
                    />
                    <button
                      onClick={handleTip}
                      disabled={tipping || !tipAmount || parseInt(tipAmount) < 1}
                      className="neo-btn bg-black text-white px-8 py-3 font-black uppercase text-[10px] flex items-center gap-2 disabled:opacity-30"
                    >
                      {tipping ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                      ) : tipSuccess ? (
                        <><Check className="w-3.5 h-3.5" /> Sent! 🎉</>
                      ) : (
                        <><Heart className="w-3.5 h-3.5" /> Send Tip</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'shows' && (
              <div className="space-y-8">
                {loadingShows ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-zinc-200" />
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Scanning Transmission...</p>
                  </div>
                ) : shows.length === 0 ? (
                  <div className="py-20 border-4 border-black border-dashed flex flex-col items-center justify-center space-y-4 text-zinc-300">
                    <Sparkles className="w-12 h-12" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No live shows scheduled yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    {shows.map((show) => (
                      <div key={show.id} className="neo-box bg-white overflow-hidden group border-4 border-black shadow-[6px_6px_0px_0px_black]">
                        <div className="aspect-video bg-zinc-950 flex flex-col items-center justify-center p-6 border-b-4 border-black relative overflow-hidden">
                          <div className="absolute inset-0 bg-neo-pink/5 animate-pulse" />
                          <Sparkles className="w-10 h-10 text-white relative z-10 mb-4 opacity-20" />
                          <div className="absolute top-4 left-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-neo-green text-black border-2 border-black">
                              <span className="font-black uppercase text-[10px] tracking-widest">₹{show.ticketPrice}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          <div>
                            <h4 className="font-black uppercase text-xl leading-tight mb-2 tracking-tighter">{show.title}</h4>
                            <p className="text-xs font-bold text-zinc-500 line-clamp-2 uppercase tracking-wide">{show.description}</p>
                          </div>
                          
                          <div className="flex gap-4 border-y-2 border-zinc-100 py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-neo-pink" />
                              <span className="text-[10px] font-black uppercase text-black">{show.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-neo-blue" />
                              <span className="text-[10px] font-black uppercase text-black">{show.time}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => alert("Ticket purchase coming soon! For now, just mark your calendar.")}
                            className="w-full bg-black text-white py-3 border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_theme(colors.neo-pink)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                          >
                            Get Ticket
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {profileTab === 'courses' && (
              <div className="flex flex-col items-center justify-center h-64 border-4 border-black border-dashed bg-zinc-50 opacity-50">
                <Sparkles className="w-12 h-12 mb-4 text-neo-blue" />
                <h3 className="text-xl font-black uppercase italic">Workshops & Training</h3>
                <p className="text-[10px] font-bold uppercase mt-2">Curating high-performance curriculum...</p>
              </div>
            )}

            {profileTab === 'about' && (
              <div className="space-y-10">
                {faqs && faqs.length > 0 && <FAQSection faqs={faqs} />}
                <div className="p-8 bg-zinc-50 border-4 border-black shadow-[4px_4px_0px_0px_black]">
                  <h4 className="text-2xl font-black uppercase italic mb-4">The Vision</h4>
                  <p className="text-sm font-bold text-zinc-600 uppercase leading-relaxed">
                    Maximizing human potential through synchronized time. Every minute spent here is an investment in your evolution.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showAdmirersModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-start mb-8 text-black">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Admirers</h2>
                <button onClick={() => setShowAdmirersModal(false)} className="w-8 h-8 border-2 border-black flex items-center justify-center font-black">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {isLoadingAdmirers ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-8 border-black border-t-neo-pink rounded-full animate-spin" />
                    <p className="font-black uppercase text-xs tracking-widest">Finding Admirers...</p>
                  </div>
                ) : admirerList.length > 0 ? (
                  admirerList.map((admirer, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border-4 border-black bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="w-12 h-12 border-2 border-black bg-white overflow-hidden shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${admirer.username || admirer.email}`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black uppercase truncate text-sm">{admirer.username || 'Anonymous Fan'}</p>
                      </div>
                      {admirer.username && (
                        <button
                          onClick={() => window.location.href = `/${admirer.username}`}
                          className="w-8 h-8 bg-black text-white flex items-center justify-center hover:bg-neo-pink transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <p className="font-black uppercase text-zinc-400">No admirers yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBookingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full">
              <div className="flex justify-between items-start mb-8 text-black">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Book Session</h2>
                <button onClick={() => setShowBookingModal(false)} className="w-8 h-8 border-2 border-black flex items-center justify-center font-black">✕</button>
              </div>
              <div className="space-y-6 text-black">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block">Date</label>
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full bg-zinc-50 border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block">Time</label>
                    <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full bg-zinc-50 border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block">Package</label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {templates.map((tpl: any) => (
                      <button key={tpl.id} onClick={() => setBookingTemplate(tpl)} className={`w-full text-left p-3 border-4 border-black font-bold text-xs flex justify-between items-center ${bookingTemplate?.id === tpl.id ? 'bg-neo-yellow' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}>
                        <span>{tpl.duration} Min {tpl.type}</span>
                        <span className="font-black">{tpl.price} TKN</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-4">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 font-black uppercase text-xs py-4 text-black">Cancel</button>
                <button onClick={handleBookCall} disabled={isBooking || !bookingDate || !bookingTime || !bookingTemplate} className="flex-1 neo-btn bg-neo-green text-black py-4 disabled:opacity-50">{isBooking ? '...' : 'Reserve'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchased Product Deliverable Modal */}
      <AnimatePresence>
        {purchasedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Purchase Complete! 🎉</h2>
                <button onClick={() => setPurchasedProduct(null)} className="w-8 h-8 border-2 border-black flex items-center justify-center font-black">✕</button>
              </div>
              <p className="text-sm font-bold text-zinc-600 uppercase mb-6">{purchasedProduct.name}</p>
              {purchasedProduct.content && (
                <a
                  href={purchasedProduct.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full neo-btn bg-black text-white py-4 font-black uppercase text-sm flex items-center justify-center gap-2"
                >
                  {purchasedProduct.type === 'digital' && <><Download className="w-4 h-4" /> Download File</>}
                  {purchasedProduct.type === 'link' && <><ExternalLink className="w-4 h-4" /> Open Link</>}
                  {purchasedProduct.type === 'booking' && <><Calendar className="w-4 h-4" /> Open Meeting Link</>}
                  {!['digital', 'link', 'booking'].includes(purchasedProduct.type) && <><Download className="w-4 h-4" /> Access Content</>}
                </a>
              )}
              {!purchasedProduct.content && (
                <p className="text-xs font-bold text-zinc-400 uppercase text-center">The creator will share the deliverable with you soon.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-20 py-12 border-t-4 border-black bg-zinc-50 text-black">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-6 opacity-30"><Zap className="w-5 h-5 fill-black" /><span className="font-black uppercase text-xs">Supertime</span></div>
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">Blissful Art</p>
        </div>
      </footer>
    </div>
  );
}
