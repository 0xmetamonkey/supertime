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
      <div className="flex items-center gap-3 mb-4">
        <HelpCircle className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">FAQ</h3>
      </div>
      <div className="space-y-1">
        {faqs.map((faq) => (
          <div key={faq.id} className="border-b border-gray-100 last:border-0 overflow-hidden">
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between py-4 text-left group"
            >
              <span className="font-medium text-sm text-gray-900 group-hover:text-gray-600 transition-colors pr-4">{faq.question}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${openId === faq.id ? 'rotate-180' : ''}`} />
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
                  <div className="pb-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-gray-900 text-white rounded-lg text-sm shadow-sm font-medium"
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

      <main className="max-w-2xl mx-auto px-5 pt-8 pb-20">

        {/* ── Profile Header ── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 mb-4">
            {profileImage ? (
              <img src={profileImage} alt={username} className="w-full h-full object-cover" />
            ) : (
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
            )}
          </div>

          <h1 className="text-2xl font-semibold mb-1">
            {username}
            {isVerified && <span className="ml-1.5 text-blue-500 text-sm">✓</span>}
          </h1>

          <p className="text-sm text-gray-500 max-w-sm mb-4">
            Scaling human connection through time-based digital assets and elite calls.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-3 mb-6">
            {socials?.instagram && (
              <a href={socials.instagram.startsWith('http') ? socials.instagram : `https://instagram.com/${socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {socials?.youtube && (
              <a href={socials.youtube.startsWith('http') ? socials.youtube : `https://youtube.com/${socials.youtube.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {socials?.x && (
              <a href={socials.x.startsWith('http') ? socials.x : `https://x.com/${socials.x.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium">
                𝕏
              </a>
            )}
            {socials?.website && (
              <a href={socials.website.startsWith('http') ? socials.website : `https://${socials.website}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            )}
            <a href={`/chat?to=${username}`} className="text-gray-400 hover:text-gray-600 transition-colors">
              <MessageSquare className="w-4 h-4" />
            </a>
          </div>

          {/* Admire button */}
          <button onClick={toggleAdmire} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isAdmiring ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Heart className={`w-3.5 h-3.5 ${isAdmiring ? 'fill-red-500 text-red-500' : ''}`} /> {admirerCount}
          </button>
        </div>

        {/* ── Primary CTAs: Book a Call ── */}
        <div className="space-y-3 mb-10">
          <button
            onClick={() => handleStartCall('video')}
            className="btn btn-primary w-full py-3.5 text-sm"
          >
            <Video className="w-4 h-4" /> Book a Video Call {videoRate ? `· ₹${videoRate}/min` : ''}
          </button>

          <button
            onClick={() => handleStartCall('audio')}
            className="btn btn-secondary w-full py-3.5 text-sm"
          >
            <Mic className="w-4 h-4" /> Book an Audio Call {audioRate ? `· ₹${audioRate}/min` : ''}
          </button>

          {/* Live status */}
          <button
            onClick={handleJoinRoom}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
              isCreatorOnline
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isCreatorOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            {isCreatorOnline ? 'Live Now · Join Room' : 'Studio Offline'}
          </button>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex">
            {['store', 'shows', 'courses', 'about'].map(tab => (
              <button
                key={tab}
                onClick={() => setProfileTab(tab as any)}
                className={`flex-1 py-3 text-xs font-medium capitalize transition-colors border-b-2 ${
                  profileTab === tab
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
                {tab === 'shows' && shows.length > 0 && (
                  <span className="ml-1 bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">{shows.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="min-h-[300px]">

          {/* STORE TAB */}
          {profileTab === 'store' && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {/* Products */}
                {products && products.length > 0 && products.map((prod: any) => {
                  const typeConf = productTypeConfig[prod.type] || productTypeConfig.digital;
                  const TypeIcon = typeConf.icon;
                  return (
                    <div key={prod.id} className="card">
                      {prod.thumbnail && (
                        <div className="h-36 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl">
                          <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] text-gray-400 font-medium">{typeConf.label}</span>
                        {prod.type === 'booking' && prod.duration && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" /> {prod.duration}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-base mb-1">{prod.name}</h4>
                      {prod.description && (
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{prod.description}</p>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="font-semibold">₹{prod.price}</span>
                        <button
                          onClick={() => handleBuyProduct(prod)}
                          disabled={buyingId === prod.id}
                          className="btn btn-primary text-xs px-4 py-2 disabled:opacity-50"
                        >
                          {buyingId === prod.id ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Processing</>
                          ) : (
                            <><ShoppingBag className="w-3 h-3" /> Buy</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Session Templates */}
                {templates && templates.length > 0 && templates.map((tpl: any) => (
                  <div key={tpl.id} onClick={() => handleStartCall(tpl.type)} className="card cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      {tpl.type === 'video' ? <Video className="w-3.5 h-3.5 text-gray-400" /> : <Mic className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="text-[11px] text-gray-400 font-medium">{tpl.duration} min {tpl.type} call</span>
                    </div>
                    <h4 className="font-semibold text-base mb-1">{tpl.duration} Minute Session</h4>
                    <p className="text-xs text-gray-500 mb-3">{tpl.description || 'Instant 1:1 access.'}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-semibold">{tpl.price} TKN</span>
                      <span className="text-xs text-gray-400">Call Now →</span>
                    </div>
                  </div>
                ))}

                {(!products || products.length === 0) && (!templates || templates.length === 0) && (
                  <div className="py-16 text-center text-gray-300">
                    <Clock className="w-8 h-8 mx-auto mb-3" />
                    <p className="text-sm">No items yet</p>
                  </div>
                )}
              </div>

              {/* Tip Jar */}
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="w-4 h-4 text-gray-400" />
                  <h4 className="font-semibold text-sm">Support {username}</h4>
                </div>
                <p className="text-xs text-gray-400 mb-4">100% goes to the creator</p>
                <div className="flex gap-2 mb-3">
                  {[49, 99, 199, 499].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setTipAmount(String(amt))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        tipAmount === String(amt)
                          ? 'bg-black text-white border-black'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={e => setTipAmount(e.target.value)}
                    placeholder="Custom amount"
                    min="1"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={handleTip}
                    disabled={tipping || !tipAmount || parseInt(tipAmount) < 1}
                    className="btn btn-primary px-5 py-2 text-xs disabled:opacity-30"
                  >
                    {tipping ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Sending</>
                    ) : tipSuccess ? (
                      <><Check className="w-3 h-3" /> Sent!</>
                    ) : (
                      <><Heart className="w-3 h-3" /> Send Tip</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SHOWS TAB */}
          {profileTab === 'shows' && (
            <div className="space-y-4">
              {loadingShows ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading shows...</p>
                </div>
              ) : shows.length === 0 ? (
                <div className="py-16 text-center text-gray-300">
                  <Sparkles className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-sm">No shows scheduled yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {shows.map((show) => (
                    <div key={show.id} className="card">
                      <h4 className="font-semibold text-base mb-1">{show.title}</h4>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{show.description}</p>
                      <div className="flex gap-4 text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {show.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {show.time}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="font-semibold">₹{show.ticketPrice}</span>
                        <button
                          onClick={() => alert("Ticket purchase coming soon!")}
                          className="btn btn-primary text-xs px-4 py-2"
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

          {/* COURSES TAB */}
          {profileTab === 'courses' && (
            <div className="py-16 text-center text-gray-300">
              <Sparkles className="w-8 h-8 mx-auto mb-3" />
              <p className="text-sm">Courses coming soon</p>
            </div>
          )}

          {/* ABOUT TAB */}
          {profileTab === 'about' && (
            <div className="space-y-6">
              {faqs && faqs.length > 0 && <FAQSection faqs={faqs} />}
              <div className="card">
                <h4 className="font-semibold text-sm mb-2">About</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Maximizing human potential through synchronized time. Every minute spent here is an investment in your evolution.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}

      {/* Admirers Modal */}
      <AnimatePresence>
        {showAdmirersModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Admirers</h2>
                <button onClick={() => setShowAdmirersModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {isLoadingAdmirers ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Loading...</p>
                  </div>
                ) : admirerList.length > 0 ? (
                  admirerList.map((admirer, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${admirer.username || admirer.email}`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <span className="flex-1 text-sm font-medium truncate">{admirer.username || 'Anonymous'}</span>
                      {admirer.username && (
                        <button onClick={() => window.location.href = `/${admirer.username}`} className="text-gray-400 hover:text-black transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center py-12 text-sm text-gray-400">No admirers yet</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Book a Session</h2>
                <button onClick={() => setShowBookingModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">✕</button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Date</label>
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Time</label>
                    <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Package</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {templates.map((tpl: any) => (
                      <button key={tpl.id} onClick={() => setBookingTemplate(tpl)} className={`w-full text-left p-3 rounded-lg text-sm flex justify-between items-center border transition-colors ${bookingTemplate?.id === tpl.id ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <span>{tpl.duration} min {tpl.type}</span>
                        <span className="font-semibold">{tpl.price} TKN</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowBookingModal(false)} className="btn btn-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleBookCall} disabled={isBooking || !bookingDate || !bookingTime || !bookingTemplate} className="btn btn-primary flex-1 py-3 disabled:opacity-50">{isBooking ? 'Booking...' : 'Confirm & Pay'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchased Product Modal */}
      <AnimatePresence>
        {purchasedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Purchase Complete ✓</h2>
                <button onClick={() => setPurchasedProduct(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">✕</button>
              </div>
              <p className="text-sm text-gray-500 mb-4">{purchasedProduct.name}</p>
              {purchasedProduct.type === 'booking' ? (
                <>
                  <p className="text-xs text-gray-500 mb-4 text-center">Your 1:1 session is confirmed. Use the link below to join at the scheduled time:</p>
                  <a
                    href={purchasedProduct.meetingUrl || purchasedProduct.content || `/${username}`}
                    target={purchasedProduct.meetingUrl || purchasedProduct.content?.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="btn btn-primary w-full py-3 text-sm"
                  >
                    <Video className="w-4 h-4" /> Join Video Stage
                  </a>
                  <p className="text-[11px] text-gray-400 text-center mt-3">A confirmation email with this link has also been sent to your inbox.</p>
                </>
              ) : purchasedProduct.content && purchasedProduct.content.startsWith('http') ? (
                <a
                  href={purchasedProduct.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full py-3 text-sm"
                >
                  {purchasedProduct.type === 'digital' && <><Download className="w-4 h-4" /> Download File</>}
                  {purchasedProduct.type === 'link' && <><ExternalLink className="w-4 h-4" /> Open Link</>}
                  {!['digital', 'link', 'booking'].includes(purchasedProduct.type) && <><Download className="w-4 h-4" /> Access Content</>}
                </a>
              ) : (
                <p className="text-xs text-gray-400 text-center">The creator will share the deliverable with you soon.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-300">Supertime</p>
        </div>
      </footer>
    </div>
  );
}
