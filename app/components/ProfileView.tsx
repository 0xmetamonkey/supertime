'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Globe,
  Heart,
  Clock,
  Sparkles,
  Mic,
  Video,
  Instagram,
  Send,
  HelpCircle,
  ChevronDown,
  ShoppingBag,
  Package,
  Calendar,
  Coffee,
  Youtube,
  Link as LinkIcon,
  QrCode,
  X,
} from 'lucide-react';
import ProfileQRModal from './ProfileQRModal';
import CreatorLinksSheet from './CreatorLinksSheet';

// FAQ Accordion — purely presentational
function FAQSection({ faqs }: { faqs: { id: string; question: string; answer: string }[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <HelpCircle className="w-5 h-5 text-[#6B6B6B]" />
        <h3 className="text-lg font-semibold text-[#111111]">FAQ</h3>
      </div>
      <div className="border border-[#E8E8E8] rounded-2xl bg-white overflow-hidden shadow-sm">
        {faqs.map((faq, index) => (
          <div key={faq.id} className={`border-b border-[#E8E8E8] last:border-b-0`}>
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex justify-between items-center p-5 text-left group"
            >
              <span className="text-sm font-medium text-[#111111] pr-4">{faq.question}</span>
              <ChevronDown className={`w-4 h-4 text-[#6B6B6B] shrink-0 transition-transform duration-200 ${openId === faq.id ? 'rotate-180' : ''}`} />
            </button>
            {openId === faq.id && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 pb-5"
              >
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{faq.answer}</p>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const productTypeConfig: Record<string, { icon: any; label: string }> = {
  digital: { icon: Package, label: 'Digital Product' },
  link: { icon: LinkIcon, label: 'Link / Course' },
  booking: { icon: Calendar, label: 'Booking / Call' },
};

export interface ProfileViewProps {
  username: string;
  profileImage?: string;
  coverImage?: string;
  isVerified?: boolean;
  socials?: { instagram?: string; x?: string; youtube?: string; website?: string };
  faqs?: { id: string; question: string; answer: string }[];
  templates?: any[];
  products?: any[];
  admirerCount?: number;
  isAdmiring?: boolean;
  isLive?: boolean;
  isPreview?: boolean;
  bio?: string;
}

export default function ProfileView({
  username,
  profileImage = '',
  coverImage = '',
  isVerified = false,
  socials = {},
  faqs = [],
  templates = [],
  products = [],
  admirerCount = 0,
  isAdmiring = false,
  isLive = false,
  isPreview = false,
  bio = '',
}: ProfileViewProps) {
  const [profileTab, setProfileTab] = useState<'store' | 'courses' | 'about'>('store');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showLinksSheet, setShowLinksSheet] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [previewTipAmount, setPreviewTipAmount] = useState('99');

  const tabClass = (tab: 'store' | 'courses' | 'about') => 
    profileTab === tab 
      ? 'flex-1 py-4 text-sm font-semibold text-[#111111] border-b-2 border-[#111111] transition-all text-center' 
      : 'flex-1 py-4 text-sm font-medium text-[#6B6B6B] hover:text-[#111111] transition-all text-center';

  return (
    <div className={`bg-[#F8F8F6] text-[#111111] font-sans ${isPreview ? '' : 'min-h-screen selection:bg-[#111111] selection:text-white pb-20'}`}>
      <main className={`mx-auto ${isPreview ? 'px-4 pt-4' : 'max-w-4xl px-6 pt-10 md:pt-16'} relative`}>
        {coverImage && (
          <div className={`w-full bg-zinc-200 overflow-hidden rounded-2xl border border-[#E8E8E8] shadow-sm mb-6 ${isPreview ? 'h-24' : 'h-40 md:h-48'}`}>
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        {/* HEADER BAR — social links + call buttons */}
        <div className="flex justify-between items-center mb-8 md:mb-12">
          <div className="flex items-center gap-2 md:gap-3">
            {!isPreview && (
              <>
                <button className="p-2.5 bg-white border border-[#E8E8E8] text-[#111111] hover:border-[#111111] rounded-full transition-all shadow-sm" title="Video Call">
                  <Video className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button className="p-2.5 bg-white border border-[#E8E8E8] text-[#111111] hover:border-[#111111] rounded-full transition-all shadow-sm" title="Audio Call">
                  <Mic className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </>
            )}
            {isPreview && (
              <>
                <div className="p-2 bg-white border border-[#E8E8E8] text-[#6B6B6B] opacity-60 rounded-full"><Video className="w-4 h-4" /></div>
                <div className="p-2 bg-white border border-[#E8E8E8] text-[#6B6B6B] opacity-60 rounded-full"><Mic className="w-4 h-4" /></div>
              </>
            )}
            {isLive && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`font-semibold text-emerald-600 ${isPreview ? 'text-[8px]' : 'text-[10px]'}`}>Live</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span
              onClick={() => setShowQRModal(true)}
              className="w-8 h-8 rounded-full border border-[#E8E8E8] bg-white flex items-center justify-center text-[#6B6B6B] hover:text-[#111111] hover:border-[#111111] transition-all shadow-sm cursor-pointer"
              title="QR Code & Share"
            >
              <QrCode className="w-4 h-4" />
            </span>
            <span
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: username, url: window.location.href }).catch(() => {});
                } else {
                  setShowQRModal(true);
                }
              }}
              className="w-8 h-8 rounded-full border border-[#E8E8E8] bg-white flex items-center justify-center text-[#6B6B6B] hover:text-[#111111] hover:border-[#111111] transition-all shadow-sm cursor-pointer"
              title="Share"
            >
              <Send className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* PROFILE HERO */}
        <div className={`flex flex-col items-center text-center ${isPreview ? 'mb-6' : 'mb-14'}`}>
          <div className="relative mb-5 md:mb-6">
            <div className={`bg-white border border-[#E8E8E8] rounded-full overflow-hidden ${isPreview ? 'w-20 h-20 shadow-sm' : 'w-28 h-28 md:w-36 md:h-36 shadow-md'}`}>
              {profileImage ? (
                <img src={profileImage} alt={username} className="w-full h-full object-cover" />
              ) : (
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
              )}
            </div>
          </div>
          <h1 className={`font-semibold tracking-tight text-[#111111] leading-none mb-3 md:mb-4 flex items-center justify-center gap-2 ${isPreview ? 'text-2xl' : 'text-3xl md:text-5xl'}`}>
            <span>{username}</span>
            {isVerified && <Zap className={`text-[#111111] fill-[#111111] shrink-0 ${isPreview ? 'w-4 h-4' : 'w-6 h-6 md:w-7 md:h-7'}`} />}
            <button
              onClick={() => setShowLinksSheet(true)}
              className="inline-flex items-center justify-center text-[#6B6B6B] hover:text-[#111111] p-1 rounded-md hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
              title="All artist links"
              aria-label={`Open all links for ${username}`}
            >
              <LinkIcon className={`text-[#6B6B6B] hover:text-[#111111] transition-colors ${isPreview ? 'w-3.5 h-3.5' : 'w-4 h-4 md:w-5 md:h-5'}`} />
              <span className="sr-only">All artist links</span>
            </button>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <button className={`flex items-center gap-1.5 border rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all duration-200 ${isAdmiring ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white border-[#E8E8E8] text-[#111111] hover:border-[#111111]'}`}>
              <Heart className={`w-3.5 h-3.5 ${isAdmiring ? 'fill-rose-500 text-rose-500' : 'text-[#6B6B6B]'}`} /> {isAdmiring ? 'Believing' : 'Believe'}
            </button>
            <span className="text-xs text-[#6B6B6B] px-2 py-1">
              <strong className="text-[#111111]">{admirerCount}</strong> {admirerCount === 1 ? 'believer' : 'believers'}
            </span>
          </div>
          <div className="flex justify-center mb-4 md:mb-6">
            <button
              onClick={() => setShowTipModal(true)}
              className="flex items-center gap-1.5 border border-[#E8E8E8] rounded-full px-3.5 py-1.5 text-xs font-medium bg-white text-[#111111] hover:border-[#111111] shadow-2xs transition-all cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-500" /> Tip
            </button>
          </div>
          <p className={`max-w-xl text-[#6B6B6B] leading-relaxed ${isPreview ? 'text-[10px]' : 'text-sm font-medium'}`}>
            {bio || "Scaling human connection through time-based digital assets and elegant, meaningful conversation."}
          </p>
        </div>

        {/* TAB SYSTEM */}
        <div className={`bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden flex flex-col shadow-sm ${isPreview ? 'min-h-[200px]' : 'min-h-[500px]'}`}>
          <div className="flex border-b border-[#E8E8E8] bg-white">
            <button onClick={() => setProfileTab('store')} className={tabClass('store')}>Store</button>
            <button onClick={() => setProfileTab('courses')} className={tabClass('courses')}>Courses</button>
            <button onClick={() => setProfileTab('about')} className={tabClass('about')}>About</button>
          </div>

          <div className={`flex-1 ${isPreview ? 'p-4' : 'p-6 md:p-10'}`}>
            {profileTab === 'store' && (
              <div className="space-y-6 md:space-y-8">
                <div className={`grid gap-6 ${isPreview ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                  {/* Real Products */}
                  {products && products.length > 0 && products.map((prod: any) => {
                    const typeConf = productTypeConfig[prod.type] || productTypeConfig.digital;
                    const TypeIcon = typeConf.icon;
                    return (
                      <div
                        key={prod.id}
                        className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden shadow-sm hover:border-[#111111] hover:shadow-md transition-all duration-300 flex flex-col"
                      >
                        {prod.thumbnail ? (
                          <div className={`bg-[#F8F8F6] border-b border-[#E8E8E8] overflow-hidden ${isPreview ? 'h-24' : 'h-44'}`}>
                            <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`bg-[#F8F8F6] border-b border-[#E8E8E8] flex items-center justify-center ${isPreview ? 'h-16' : 'h-24'}`}>
                            <TypeIcon className={`text-[#6B6B6B] opacity-30 ${isPreview ? 'w-5 h-5' : 'w-7 h-7'}`} />
                          </div>
                        )}
                        <div className={`flex-1 flex flex-col justify-between ${isPreview ? 'p-4' : 'p-6'}`}>
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F8F8F6] text-[#6B6B6B]">{typeConf.label}</span>
                              {prod.type === 'booking' && prod.duration && (
                                <span className="text-[10px] font-medium text-[#6B6B6B] flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {prod.duration}</span>
                              )}
                            </div>
                            <h4 className={`font-semibold text-[#111111] tracking-tight leading-snug mb-1.5 ${isPreview ? 'text-sm' : 'text-lg'}`}>{prod.name}</h4>
                            {prod.description && (
                              <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2">{prod.description}</p>
                            )}
                          </div>
                          <div className={`mt-5 pt-4 border-t border-[#F1F1F1] flex justify-between items-center`}>
                            <span className={`font-semibold text-[#111111] ${isPreview ? 'text-sm' : 'text-lg'}`}>₹{prod.price}</span>
                            <button className="bg-[#111111] text-white px-4 py-2 rounded-full font-medium text-[11px] hover:bg-zinc-800 transition-colors flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5" /> Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Session Templates */}
                  {templates && templates.length > 0 && templates.map((tpl: any) => (
                    <div key={tpl.id} className="bg-white border border-[#E8E8E8] rounded-2xl p-5 md:p-6 shadow-sm hover:border-[#111111] hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600`}>
                            {tpl.duration} Min {tpl.type}
                          </span>
                          <Sparkles className="w-4 h-4 text-zinc-300" />
                        </div>
                        <h4 className={`font-semibold text-[#111111] tracking-tight mb-2 ${isPreview ? 'text-sm' : 'text-lg'}`}>{tpl.duration} Min Session</h4>
                        <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2">{tpl.description || 'Instant 1:1 access for high-value consulting.'}</p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-[#F1F1F1] flex justify-between items-center">
                        <span className="font-semibold text-[#111111]">{tpl.price} TKN</span>
                        <span className="text-xs font-semibold text-[#111111] underline underline-offset-4 cursor-pointer">Call Now</span>
                      </div>
                    </div>
                  ))}

                  {(!products || products.length === 0) && (!templates || templates.length === 0) && (
                    <div className={`py-16 bg-[#F8F8F6]/50 border border-dashed border-[#E8E8E8] rounded-2xl flex flex-col items-center justify-center opacity-70 ${isPreview ? '' : 'col-span-2'}`}>
                      <Clock className="w-8 h-8 text-[#6B6B6B] opacity-40 mb-3" />
                      <p className="text-xs font-semibold text-[#6B6B6B]">Store items arriving soon...</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {profileTab === 'courses' && (
              <div className={`flex flex-col items-center justify-center border border-dashed border-[#E8E8E8] bg-[#F8F8F6]/50 rounded-2xl ${isPreview ? 'h-32' : 'h-64'}`}>
                <Sparkles className="mb-3 text-[#6B6B6B] opacity-40 w-8 h-8" />
                <h3 className="font-semibold text-base text-[#111111]">Workshops & Training</h3>
                <p className="text-xs text-[#6B6B6B] mt-1.5">Curating high-performance curriculum...</p>
              </div>
            )}

            {profileTab === 'about' && (
              <div className="space-y-8 md:space-y-12">
                {faqs && faqs.length > 0 && <FAQSection faqs={faqs} />}
                <div className="bg-[#F8F8F6]/50 border border-[#E8E8E8] rounded-2xl p-6 md:p-8 shadow-sm">
                  <h4 className="font-semibold text-lg text-[#111111] mb-3">The Vision</h4>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">
                    Maximizing human potential through synchronized time. Every minute spent here is an intentional investment in your creative growth.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer — only in full mode */}
      {!isPreview && (
        <footer className="mt-24 py-12 border-t border-[#E8E8E8] bg-[#F8F8F6] text-[#6B6B6B]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-1.5 mb-4 opacity-50">
              <Zap className="w-4 h-4 fill-[#6B6B6B]" />
              <span className="font-semibold text-xs tracking-tight">Supertime</span>
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">A Calm Sanctuary</p>
          </div>
        </footer>
      )}

      <ProfileQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        username={username}
        profileImage={profileImage}
        bio={bio}
      />

      <CreatorLinksSheet
        isOpen={showLinksSheet}
        onClose={() => setShowLinksSheet(false)}
        username={username}
        profileImage={profileImage}
        isVerified={isVerified}
        socials={socials}
        bio={bio}
      />

      {/* Tip Modal Preview */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowTipModal(false);
            }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white border border-[#E8E8E8] rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E8E8E8] bg-[#F8F8F6] shrink-0">
                    {profileImage ? (
                      <img src={profileImage} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`}
                        alt={username}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#111111] flex items-center gap-1.5">
                      <span>Tip @{username}</span>
                      <Coffee className="w-4 h-4 text-amber-500" />
                    </h3>
                    <p className="text-xs text-[#6B6B6B]">Support their craft · 100% goes to the artist</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTipModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6B6B6B] hover:text-[#111111] transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preset Amounts */}
              <div className="mb-4">
                <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-2">
                  Select an amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[49, 99, 199, 499].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPreviewTipAmount(String(amt))}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                        previewTipAmount === String(amt)
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                          : 'bg-[#F8F8F6] border-[#E8E8E8] hover:border-[#111111] text-[#111111]'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="mb-5">
                <label className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-2">
                  Or enter custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6B6B6B]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={previewTipAmount}
                    onChange={e => setPreviewTipAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    className="w-full bg-[#F8F8F6] text-[#111111] border border-[#E8E8E8] rounded-xl pl-8 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setShowTipModal(false)}
                className="w-full bg-[#111111] text-white font-semibold py-3 rounded-xl text-sm hover:bg-zinc-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Send ₹{previewTipAmount || '99'} Tip</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
