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
  ArrowLeft,
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
  X,
  Lock,
  FileText,
} from 'lucide-react';
import WalletManager from '../components/WalletManager';
import dynamic from 'next/dynamic';
const SuperCall = dynamic(() => import('../components/SuperCall'), { ssr: false });
const BroadcastViewer = dynamic(() => import('../components/Broadcast/BroadcastViewer'), { ssr: false });
<<<<<<< HEAD
import { loginWithGoogle, logout, checkCallStatus } from '../actions';
=======
import { useUser, useClerk } from "@clerk/nextjs";
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703

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
  bio?: string;
  subscriptionPrice?: number;
  subscriptionBenefits?: string[];
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
  _ablySignaling,
  bio = "",
  subscriptionPrice = 199,
  subscriptionBenefits = []
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
  const [creditsSpent, setCreditsSpent] = useState(0);
  const [isCreatorOnline, setIsCreatorOnline] = useState(isLive);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingTemplate, setBookingTemplate] = useState<any>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);

  const [admirerList, setAdmirerList] = useState<{ email: string; username: string | null }[]>([]);
  const [showAdmirersModal, setShowAdmirersModal] = useState(false);
  const [isLoadingAdmirers, setIsLoadingAdmirers] = useState(false);

  const [profileTab, setProfileTab] = useState<'sessions' | 'products' | 'feast' | 'about'>('sessions');
  const [shows, setShows] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingShows, setLoadingShows] = useState(false);

  useEffect(() => {
    fetch(`/api/user/posts?username=${username}`)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []));
  }, [username]);

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

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (isLoggedIn && username) {
      fetch(`/api/user/subscription?creatorUsername=${username}`)
        .then(res => res.json())
        .then(data => setIsSubscribed(data.isSubscribed || false))
        .catch(console.error);
    }
  }, [isLoggedIn, username]);

  const handleSubscribe = async () => {
    if (!isLoggedIn && !isSimulated) {
      openSignIn({ forceRedirectUrl: window.location.pathname });
      return;
    }
    
    setIsSubscribing(true);
    try {
      const res = await fetch('/api/payment/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorUsername: username }),
      });
      const order = await res.json();
      if (!order.orderId) { setIsSubscribing(false); return; }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: `Inner Circle: @${username}`,
        description: `30-Day Access Pass`,
        prefill: {
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
          name: clerkUser?.firstName || clerkUser?.username || '',
        },
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payment/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify',
              creatorUsername: username,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            setIsSubscribed(true);
            alert("Welcome to the Inner Circle!");
          }
          setIsSubscribing(false);
        },
        modal: { ondismiss: () => setIsSubscribing(false) },
        theme: { color: '#000000' },
      };
      const loadRazorpay = () => new Promise((resolve) => {
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your connection or disable adblockers.");
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Subscribe error:', err);
      setIsSubscribing(false);
    }
  };

  const handleBuyProduct = async (product: any, bookingDetails?: { date: string, time: string, guestEmail: string, guestName: string }) => {
    if (product.type === 'booking' && !bookingDetails) {
      setBookingTemplate(product);
      setShowBookingModal(true);
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
        prefill: {
          email: bookingDetails?.guestEmail || clerkUser?.emailAddresses?.[0]?.emailAddress || '',
          name: bookingDetails?.guestName || clerkUser?.firstName || '',
        },
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
              bookingDetails,
              buyerEmail: bookingDetails?.guestEmail,
              buyerName: bookingDetails?.guestName,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            if (result.deliverable) {
              setPurchasedProduct(result.deliverable);
            } else {
              setPurchasedProduct({ type: product.type, content: product.content, name: product.name });
            }
            if (product.type === 'booking') {
              setShowBookingModal(false);
              alert("Booking Confirmed & Calendar Invite Sent!");
            }
          }
          setBuyingId(null);
        },
        modal: { ondismiss: () => setBuyingId(null) },
        theme: { color: '#000000' },
      };
      const loadRazorpay = () => new Promise((resolve) => {
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load.");
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Purchase error:', err);
      setBuyingId(null);
    }
  };

  const handleTip = async () => {
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
      const loadRazorpay = () => new Promise((resolve) => {
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load.");
      }

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
    recording: { icon: Video, label: 'Video Recording', color: 'neo-yellow' },
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
      setCreditsSpent(0);
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
    setCreditsSpent(0);
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
      showError(`Add ${currentRate} Credits to start a ${type} call.`);
      return;
    }

    if (!isAcceptingCalls && !isSimulated && !isTestMode) {
      showError(`${username} is not accepting calls right now. Try again soon!`);
      return;
    }

<<<<<<< HEAD
    // Real-time check: Ensure creator hasn't JUST stopped
    if (!isSimulated) {
      try {
        const isStillAccepting = await checkCallStatus(username);
        if (!isStillAccepting) {
          showError(`${username} has stopped accepting calls.`);
          return;
        }
      } catch (e) {
        console.error("Failed to verify call status", e);
        // Fail open or closed? Failing open might be annoying if creator is offline.
        // But failing closed might block valid calls on network hiccup.
        // Let's assume fail open for now, or just log. 
        // Actually, if check fails, we might as well proceed and let the signal fail if strict.
      }
    }

    const callerName = user?.name || user?.email?.split('@')[0] || 'Guest';

    console.log('[Caller] Starting call...', { type, providerConnected: _ablySignaling?.isConnected, callerName });
=======
    console.log('[Caller] Starting call...', {
      type,
      isSimulated,
      isTestMode,
      isAcceptingCalls,
      providerConnected: _ablySignaling?.isConnected
    });
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
    let callChannelName: string | null = null;
    try {
      // Use Ably for instant signaling if available
      if (_ablySignaling?.isConnected && _ablySignaling?.initiateCall) {
        console.log('[Caller] Using Ably to initiate call to:', username);
<<<<<<< HEAD
        callChannelName = await _ablySignaling.initiateCall(username, type, callerName);
=======
        const isUUID = (str: string) => /^[0-9a-f-]{36}$/i.test(str);
        const fromName = [
          clerkUser?.username,
          clerkUser?.firstName,
          clerkUser?.emailAddresses?.[0]?.emailAddress?.split('@')[0],
        ].find(n => n && typeof n === 'string' && n.trim() !== "" && !isUUID(n)) || (isSimulated ? 'Test User' : 'Guest');

        callChannelName = await _ablySignaling.initiateCall(username, type, fromName);
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
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
<<<<<<< HEAD
          body: JSON.stringify({ action: 'call', from: uid, callerName, to: username, type })
=======
          body: JSON.stringify({ action: 'call', from: uid, fromName, to: username, type })
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
        });
        const data = await response.json();

        if (data.success && data.channelName) {
          callChannelName = data.channelName;
          setActiveChannelName(data.channelName);
        } else {
          showError(data.error || "Failed to connect. Please try again.");
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
    setCreditsSpent(0);
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
      console.log(`[Timer] 🔔 NEW MINUTE DETECTED: Charging ${currentRate} Credits`);
      lastDeductMinuteRef.current = currentMinute;
      if (!(isRoom && isRoomFree) && !isSimulated) {
        const success = await deductBalance(currentRate);
        if (success) {
          setCreditsSpent(prev => prev + currentRate);
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
        callerRingerRef.current = new Audio('/Aura_Call_2026-06-04T070202.wav');
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
<<<<<<< HEAD
    lastDeductMinuteRef.current = 0;
    setIsPeerConnected(false); // Reset peer connection status

    // Notify via Ably if connected
    if (_ablySignaling?.cancelCall) {
      await _ablySignaling.cancelCall(username); // 'username' is the creator's ID
    }
=======
    setIsPeerConnected(false);
    setCallDuration(0);
    setCreditsSpent(0);

    // 2. Immediately tell the signaling hook to clear its state
    // This prevents the useEffect from re-triggering setIsCalling(true)
    _ablySignaling?.endActiveCall();
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703

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

  // Handle call ended by remote (creator or peer)
  useEffect(() => {
    if (_ablySignaling?.callEndedSignal && isCalling) {
      console.log('[Caller] Received END signal:', _ablySignaling.callEndedSignal);
      handleEndCall();
      showError("Call ended by " + username);
      _ablySignaling.resetCallSignal?.();
    }
  }, [_ablySignaling?.callEndedSignal, isCalling, username]);

  const deductBalance = async (amount: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct_split', amount, recipientEmail: ownerEmail })
      });

      if (res.status === 402) {
        showError("Out of credits! Call ending...");
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-neo-pink selection:text-white pb-20">
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
                <span className="text-neo-pink text-sm font-black tabular-nums">-{creditsSpent} Credits</span>
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
      {/* Booking Modal (For Guests & Users) */}
      {showBookingModal && bookingTemplate && (
        <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowBookingModal(false)} className="absolute top-4 right-4 p-2 bg-background rounded-full hover:bg-surface transition-colors">
              <X className="w-5 h-5 text-muted" />
            </button>
            <div className="p-6 md:p-8">
              <div className="w-12 h-12 bg-neo-pink/10 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-neo-pink" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Book 1:1 Session</h2>
              <p className="text-sm text-muted mb-8">{bookingTemplate.name}</p>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 font-medium text-foreground outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Time</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 font-medium text-foreground outline-none focus:border-foreground transition-colors appearance-none"
                    >
                      <option value="" disabled>Select Time</option>
                      {Array.from({ length: 48 }).map((_, i) => {
                        const h = Math.floor(i / 2);
                        const m = i % 2 === 0 ? '00' : '30';
                        const val = `${h.toString().padStart(2, '0')}:${m}`;
                        const isPM = h >= 12;
                        const displayH = h % 12 === 0 ? 12 : h % 12;
                        const label = `${displayH}:${m} ${isPM ? 'PM' : 'AM'}`;
                        return <option key={val} value={val}>{label}</option>;
                      })}
                    </select>
                  </div>
                </div>
                {!isLoggedIn && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Your Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 font-medium text-foreground outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Your Email</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 font-medium text-foreground outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={() => {
                    if (!bookingDate || !bookingTime) {
                      alert("Please select a date and time.");
                      return;
                    }
                    if (!isLoggedIn && (!guestName || !guestEmail)) {
                      alert("Please enter your name and email.");
                      return;
                    }
                    handleBuyProduct(bookingTemplate, { date: bookingDate, time: bookingTime, guestEmail, guestName });
                  }}
                  disabled={buyingId === bookingTemplate.id}
                  className="w-full bg-foreground text-background font-semibold py-4 rounded-xl mt-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {buyingId === bookingTemplate.id ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><ShoppingBag className="w-4 h-4" /> Continue to Payment (₹{bookingTemplate.price})</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-5 pt-12 pb-24 relative">
        {isOwner && (
          <div className="absolute top-0 left-5">
            <a href="/dashboard" className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors bg-surface border border-border px-3 py-1.5 rounded-lg shadow-sm">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </a>
          </div>
        )}

        {/* ── Profile Header ── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-28 h-28 rounded-full overflow-hidden mb-5 shadow-sm">
            {profileImage ? (
              <img src={profileImage} alt={username} className="w-full h-full object-cover" />
            ) : (
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} className="w-full h-full object-cover bg-surface" />
            )}
          </div>

          <h1 className="text-3xl font-semibold mb-2 flex items-center gap-1.5 text-foreground">
            {username}
            {isVerified && <span className="text-foreground"><Check className="w-5 h-5 bg-foreground text-background rounded-full p-0.5" /></span>}
          </h1>

          {bio && (
            <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed whitespace-pre-wrap">
              {bio}
            </p>
          )}

          {/* Social links */}
          <div className="flex items-center gap-5 mb-2">
            {socials?.instagram && (
              <a href={socials.instagram.startsWith('http') ? socials.instagram : `https://instagram.com/${socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {socials?.youtube && (
              <a href={socials.youtube.startsWith('http') ? socials.youtube : `https://youtube.com/${socials.youtube.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            )}
            {socials?.x && (
              <a href={socials.x.startsWith('http') ? socials.x : `https://x.com/${socials.x.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground transition-colors font-serif text-xl leading-none flex items-center justify-center">
                <span className="mb-0.5">𝕏</span>
              </a>
            )}
            {socials?.website && (
              <a href={socials.website.startsWith('http') ? socials.website : `https://${socials.website}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="space-y-3 mb-10">
          
          {/* Inner Circle / Membership */}
          <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1"><Sparkles className="w-5 h-5 text-muted" /></div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground text-sm mb-1">Join my inner circle</h3>
                <p className="text-[11px] text-muted max-w-[180px] leading-tight">Monthly updates, behind the scenes, early access and more.</p>
              </div>
            </div>
            {isSubscribed ? (
              <button disabled className="bg-background text-foreground border border-border text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0 flex items-center gap-1.5 opacity-70">
                <Check className="w-3.5 h-3.5 text-green-500" /> Member
              </button>
            ) : (
              <button onClick={handleSubscribe} disabled={isSubscribing} className="bg-foreground text-background text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50">
                {isSubscribing ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> Loading...</> : 'Subscribe · ₹199 / 30 Days'}
              </button>
            )}
          </div>

          {/* Action Stack */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <button
              onClick={() => handleStartCall('video')}
              className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-background transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-foreground" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Book a Video Call</h4>
                  {videoRate ? <p className="text-xs text-muted">₹{videoRate} / min</p> : null}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
            </button>
            
            <button
              onClick={() => handleStartCall('audio')}
              className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-background transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-foreground" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Book an Audio Call</h4>
                  {audioRate ? <p className="text-xs text-muted">₹{audioRate} / min</p> : null}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
            </button>

            <button
              onClick={handleJoinRoom}
              className="w-full flex items-center justify-between p-4 hover:bg-background transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isCreatorOnline ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Join Live Room</h4>
                  <p className="text-xs text-muted">{isCreatorOnline ? "I'm live now!" : "See if I'm live now"}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
            </button>
          </div>

          <button onClick={() => {
            if (isOwner) {
              showError("This is a preview! Fans will use this to DM you.");
              return;
            }
            router.push(`/chat?to=${username}`);
          }} className="w-full bg-surface border border-border rounded-2xl py-3.5 flex items-center justify-center gap-2 hover:bg-background transition-colors font-medium text-sm text-foreground shadow-sm">
            <MessageSquare className="w-4 h-4" /> Message
          </button>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="border-b border-border mb-8 sticky top-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex">
            {['sessions', 'products', 'feast', 'about'].map(tab => (
              <button
                key={tab}
                onClick={() => setProfileTab(tab as any)}
                className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors border-b-2 ${
                  profileTab === tab
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                {tab === 'products' ? 'Art & Products' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        {/* ── Tab Content ── */}
        <div className="min-h-[300px]">

          {/* SESSIONS TAB */}
          {profileTab === 'sessions' && (
            <div className="space-y-6">
              <div className="mb-2">
                <h2 className="text-xl font-semibold text-foreground">Sessions</h2>
                <p className="text-sm text-muted">Book a one-on-one session with me.</p>
              </div>

              {/* Filtering Pills (Visual Only for now) */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button className="px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-medium whitespace-nowrap">All</button>
                <button className="px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-background text-sm font-medium whitespace-nowrap">Audio</button>
                <button className="px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-background text-sm font-medium whitespace-nowrap">Video</button>
                <button className="px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-background text-sm font-medium whitespace-nowrap">Mentorship</button>
              </div>

              <div className="space-y-3">
                {(() => {
                  const sessionItems = [
                    ...(templates || []),
                    ...(products || []).filter((p: any) => p.type === 'booking')
                  ];
                  
                  return sessionItems.length > 0 ? sessionItems.map((item: any) => (
                    <div key={item.id} className="bg-surface border border-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center shrink-0">
                          {item.type === 'video' ? <Video className="w-5 h-5 text-foreground" /> : item.type === 'audio' ? <Mic className="w-5 h-5 text-foreground" /> : <Sparkles className="w-5 h-5 text-foreground" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{item.name || `${item.duration} Minute ${item.type === 'video' ? 'Video' : 'Audio'} Call`}</h4>
                          <p className="text-xs text-muted mb-1.5">{item.description || 'Instant 1:1 access.'}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted font-medium">
                            <Clock className="w-3 h-3" /> {item.duration || 30} mins
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-0 border-border pt-3 sm:pt-0 mt-1 sm:mt-0">
                        <div className="font-semibold text-lg text-foreground sm:mb-1">₹{item.price}</div>
                        <button 
                          onClick={() => item.type === 'booking' ? handleBuyProduct(item) : handleStartCall(item.type)}
                          disabled={buyingId === item.id}
                          className="bg-foreground text-background text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                        >
                          {buyingId === item.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Book Now'}
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center text-muted border border-border border-dashed rounded-2xl">
                      <Clock className="w-8 h-8 mx-auto mb-3 opacity-50 text-muted" />
                      <p className="text-sm">No sessions available.</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {profileTab === 'products' && (
            <div className="space-y-6">
              <div className="mb-2">
                <h2 className="text-xl font-semibold text-foreground">Art & Products</h2>
                <p className="text-sm text-muted">Digital products, art & more.</p>
              </div>

              <div className="space-y-3">
                {(() => {
                  const artProducts = (products || []).filter((p: any) => p.type !== 'booking');
                  return artProducts.length > 0 ? artProducts.map((prod: any) => {
                  const isUnlocked = prod.price === 0 || purchasedProduct?.id === prod.id || (purchasedProduct && purchasedProduct.name === prod.name);
                  
                  return (
                    <div key={prod.id} className="bg-surface border border-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer hover:bg-background transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-foreground/5 rounded-xl flex items-center justify-center shrink-0">
                          {prod.type === 'recording' ? <Video className="w-6 h-6 text-foreground" /> : <Package className="w-6 h-6 text-foreground" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{prod.name}</h4>
                          <p className="text-xs text-muted mb-1.5 line-clamp-2 pr-4">{prod.description || 'Exclusive digital content.'}</p>
                          <div className="font-semibold text-foreground">
                            {prod.price === 0 ? <span className="text-green-600 dark:text-green-400 text-xs">FREE</span> : `₹${prod.price}`}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => isUnlocked && prod.type === 'recording' ? undefined : handleBuyProduct(prod)}
                        disabled={buyingId === prod.id || (isUnlocked && prod.type === 'recording')}
                        className="w-full sm:w-auto bg-background border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-lg group-hover:bg-foreground group-hover:text-background transition-colors disabled:opacity-50 shrink-0"
                      >
                        {buyingId === prod.id ? (
                           <><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Processing</>
                        ) : (isUnlocked && prod.type === 'recording' ? (
                          <><Check className="w-3 h-3 inline mr-1" /> Unlocked</>
                        ) : 'View / Buy')}
                      </button>
                    </div>
                  );
                }) : (
                  <div className="py-12 text-center text-muted border border-border border-dashed rounded-2xl">
                    <Package className="w-8 h-8 mx-auto mb-3 opacity-50 text-muted" />
                    <p className="text-sm">No products available.</p>
                  </div>
                );
                })()}
              </div>

              {/* Tip Jar integrated into Products Tab as per design */}
              <div className="bg-surface border border-border rounded-2xl p-6 mt-8">
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="w-4 h-4 text-muted" />
                  <h4 className="font-semibold text-sm text-foreground">Support {username}</h4>
                </div>
                <p className="text-[11px] text-muted mb-4">Love what I do? Support & help me create more.</p>
                <div className="flex gap-2 mb-3">
                  {[49, 99, 199, 499].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setTipAmount(String(amt))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                        tipAmount === String(amt)
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background border-border hover:bg-surface text-foreground'
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
                    className="flex-1 bg-background text-foreground border border-border rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-foreground"
                  />
                  <button
                    onClick={handleTip}
                    disabled={tipping || !tipAmount || parseInt(tipAmount) < 1}
                    className="bg-neo-pink text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 hover:opacity-90 flex items-center gap-2 shrink-0 transition-opacity"
                  >
                    {tipping ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending</>
                    ) : tipSuccess ? (
                      <><Check className="w-4 h-4" /> Sent!</>
                    ) : (
                      <><Heart className="w-4 h-4" /> Send Tip</>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* FEAST TAB */}
          {profileTab === 'feast' && (
            <div className="space-y-6">
              <div className="mb-2">
                <h2 className="text-xl font-semibold text-foreground">The Feast</h2>
                <p className="text-sm text-muted">Exclusive articles, thoughts, and updates.</p>
              </div>
              
              <div className="space-y-6">
                {posts.length > 0 ? posts.map(post => {
                  const isLockedAndNotSubscribed = post.isLocked && !isSubscribed && !isOwner;
                  
                  return (
                    <div key={post.id} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                      {post.imageUrl && (
                        <div className="w-full h-48 md:h-64 relative">
                          <img src={post.imageUrl} alt="" className={`w-full h-full object-cover ${isLockedAndNotSubscribed ? 'blur-md opacity-80' : ''}`} />
                          {isLockedAndNotSubscribed && (
                            <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                              <Lock className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[11px] font-semibold tracking-wide text-muted bg-background border border-border px-2.5 py-1 rounded-md">
                            {new Date(post.createdAt || parseInt(post.id) || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {post.isLocked && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                              <Sparkles className="w-3 h-3" /> Exclusive
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-foreground mb-4">{post.title}</h3>

                        {post.audioUrl && (
                          <div className="mb-6">
                            <audio 
                              controls 
                              src={post.audioUrl} 
                              className="w-full h-10 rounded-lg outline-none"
                              onTimeUpdate={(e) => {
                                if (isLockedAndNotSubscribed && e.currentTarget.currentTime >= 60) {
                                  e.currentTarget.pause();
                                  e.currentTarget.currentTime = 60;
                                }
                              }}
                            />
                            {isLockedAndNotSubscribed && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">Free preview limited to 60 seconds.</p>
                            )}
                          </div>
                        )}

                        <div className="relative">
                          {isLockedAndNotSubscribed && (
                            <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-xl border border-border">
                              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
                                <Lock className="w-6 h-6 text-amber-500" />
                              </div>
                              <h4 className="font-semibold text-foreground mb-1">Subscriber Exclusive</h4>
                              <p className="text-xs text-muted mb-4 max-w-[200px]">Join the Inner Circle to read and listen to the rest of this Feast.</p>
                              <button onClick={handleSubscribe} disabled={isSubscribing} className="bg-foreground text-background text-xs font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50">
                                {isSubscribing ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Processing...</> : 'Join Inner Circle'}
                              </button>
                            </div>
                          )}
                          
                          <div className={`prose prose-sm dark:prose-invert max-w-none text-muted whitespace-pre-wrap ${isLockedAndNotSubscribed ? 'opacity-30 blur-[2px] select-none pointer-events-none min-h-[150px] overflow-hidden' : ''}`}>
                            {post.audioUrl ? (
                              <div className="bg-surface border border-border/50 rounded-xl p-5 shadow-sm relative">
                                <div className="absolute top-0 left-6 -mt-3 bg-background border border-border px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-muted shadow-sm">
                                  Transcript
                                </div>
                                <p className="leading-relaxed text-foreground/90 mt-1">{post.content}</p>
                              </div>
                            ) : (
                              post.content
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-12 text-center text-muted border border-border border-dashed rounded-2xl">
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-50 text-muted" />
                    <p className="text-sm">No feasts published yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {profileTab === 'about' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">About Me</h2>
                <p className="text-sm text-muted leading-relaxed mb-6 whitespace-pre-wrap">
                  {bio || "Scaling human connection through time-based digital assets and elegant, meaningful conversation."}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <Globe className="w-4 h-4" /> Global Citizen
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <MessageSquare className="w-4 h-4" /> Always open to chat
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <Clock className="w-4 h-4" /> Usually responds quickly
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">What we can talk about</h3>
                <div className="flex flex-wrap gap-2">
                  {['Acting', 'Creativity', 'Music', 'Life', 'Stories', 'Building', 'Mindset', 'Career'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Reviews</h3>
                <div className="space-y-4">
                  {/* Static Placeholder Reviews */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">Rohan S.</span>
                        <div className="flex gap-0.5 text-foreground text-xs">★★★★★</div>
                      </div>
                      <p className="text-sm text-muted mt-1 leading-snug">Amazing conversation. Super insightful and practical.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">Neha M.</span>
                        <div className="flex gap-0.5 text-foreground text-xs">★★★★★</div>
                      </div>
                      <p className="text-sm text-muted mt-1 leading-snug">Very kind, patient and a great listener. Highly recommend!</p>
                    </div>
                  </div>
                </div>
                <button className="text-sm font-medium text-foreground mt-4 hover:underline">View all reviews →</button>
              </div>

            </div>
          )}

        </div>

        {/* ── Footer Elements ── */}
        <div className="mt-12 space-y-4">
          
          {/* Membership Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-foreground mb-1">Membership</h3>
            <p className="text-sm text-muted mb-6">Join to unlock exclusive benefits.</p>
            
            <div className="bg-foreground text-background rounded-2xl p-6 mb-2">
              <div className="text-3xl font-bold mb-1">₹{subscriptionPrice}<span className="text-base font-normal opacity-80">/month</span></div>
              <ul className="space-y-3 mt-6 mb-6 text-sm">
                {(subscriptionBenefits && subscriptionBenefits.length > 0 ? subscriptionBenefits : [
                  'Member-only posts',
                  'Behind the scenes',
                  'Early access to new drops',
                  'Discounts on sessions',
                  'Members-only group calls'
                ]).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3"><Check className="w-4 h-4 opacity-80 shrink-0" /> <span className="leading-tight">{benefit}</span></li>
                ))}
              </ul>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-background opacity-50 border border-foreground"></div>
                  <div className="w-6 h-6 rounded-full bg-background opacity-60 border border-foreground"></div>
                  <div className="w-6 h-6 rounded-full bg-background opacity-70 border border-foreground"></div>
                </div>
                <span className="text-xs font-medium opacity-80">+24</span>
              </div>
              <button onClick={() => alert('Subscriptions coming soon!')} className="w-full bg-background text-foreground font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
                Subscribe Now
              </button>
            </div>
          </div>

          {/* All Sessions Grid Footer */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neo-pink/10 rounded-xl flex items-center justify-center shrink-0"><Check className="w-5 h-5 text-neo-pink"/></div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground leading-tight mb-0.5">Safe & Secure</h4>
                  <p className="text-[10px] text-muted leading-tight">All payments are protected.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0"><Heart className="w-5 h-5 text-red-500"/></div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground leading-tight mb-0.5">100% creator earnings</h4>
                  <p className="text-[10px] text-muted leading-tight">Your support goes directly to creator.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Modals ── */}

      {/* Admirers Modal */}
      <AnimatePresence>
        {showAdmirersModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-surface rounded-xl border border-border shadow-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">Admirers</h2>
                <button onClick={() => setShowAdmirersModal(false)} className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center text-muted transition-colors">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {isLoadingAdmirers ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Loading...</p>
                  </div>
                ) : admirerList.length > 0 ? (
                  admirerList.map((admirer, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
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



      {/* Purchased Product Modal */}
      <AnimatePresence>
        {purchasedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-surface rounded-xl border border-border shadow-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Purchase Complete ✓</h2>
                <button onClick={() => setPurchasedProduct(null)} className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center text-muted transition-colors">✕</button>
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
              ) : purchasedProduct.type === 'recording' ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video
                      src={purchasedProduct.content}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <a
                    href={purchasedProduct.content}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Recording
                  </a>
                </div>
              ) : purchasedProduct.content && purchasedProduct.content.startsWith('http') ? (
                <a
                  href={purchasedProduct.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full py-3 text-sm"
                >
                  {purchasedProduct.type === 'digital' && <><Download className="w-4 h-4" /> Download File</>}
                  {purchasedProduct.type === 'link' && <><ExternalLink className="w-4 h-4" /> Open Link</>}
                  {!['digital', 'link', 'booking', 'recording'].includes(purchasedProduct.type) && <><Download className="w-4 h-4" /> Access Content</>}
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
