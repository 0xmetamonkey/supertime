'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

// FAQ Accordion — purely presentational
function FAQSection({ faqs }: { faqs: { id: string; question: string; answer: string }[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <HelpCircle className="w-7 h-7" />
        <h3 className="text-3xl font-black uppercase tracking-tighter text-black">FAQ</h3>
      </div>
      <div className="space-y-0">
        {faqs.map((faq) => (
          <div key={faq.id} className="border-4 border-black border-b-0 last:border-b-4 bg-white">
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex justify-between items-center p-5 text-left group"
            >
              <span className="text-sm font-black uppercase tracking-tight pr-4">{faq.question}</span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${openId === faq.id ? 'rotate-180' : ''}`} />
            </button>
            {openId === faq.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 pb-5"
              >
                <p className="text-sm font-bold text-zinc-600 leading-relaxed">{faq.answer}</p>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const productTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  digital: { icon: Package, label: 'Digital Product', color: 'neo-green' },
  link: { icon: LinkIcon, label: 'Link / Course', color: 'neo-blue' },
  booking: { icon: Calendar, label: 'Booking / Call', color: 'neo-pink' },
};

export interface ProfileViewProps {
  username: string;
  profileImage?: string;
  isVerified?: boolean;
  socials?: { instagram?: string; x?: string; youtube?: string; website?: string };
  faqs?: { id: string; question: string; answer: string }[];
  templates?: any[];
  products?: any[];
  admirerCount?: number;
  isAdmiring?: boolean;
  isLive?: boolean;
  // When true, renders in a compact/preview mode (no interactions)
  isPreview?: boolean;
}

export default function ProfileView({
  username,
  profileImage = '',
  isVerified = false,
  socials = {},
  faqs = [],
  templates = [],
  products = [],
  admirerCount = 0,
  isAdmiring = false,
  isLive = false,
  isPreview = false,
}: ProfileViewProps) {
  const [profileTab, setProfileTab] = useState<'store' | 'courses' | 'about'>('store');

  return (
    <div className={`bg-white text-black font-sans ${isPreview ? '' : 'min-h-screen selection:bg-neo-pink selection:text-white pb-20'}`}>
      <main className={`mx-auto ${isPreview ? 'px-4 pt-4' : 'max-w-4xl px-4 md:px-6 pt-6 md:pt-10'} relative`}>
        {/* HEADER BAR — social links + call buttons */}
        <div className="flex justify-between items-center mb-6 md:mb-10">
          <div className="flex items-center gap-2 md:gap-3">
            {!isPreview && (
              <>
                <button className="tiny-call-btn" title="Video Call"><Video className="w-4 h-4 md:w-5 md:h-5" /></button>
                <button className="tiny-call-btn" title="Audio Call"><Mic className="w-4 h-4 md:w-5 md:h-5" /></button>
              </>
            )}
            {isPreview && (
              <>
                <div className="tiny-call-btn opacity-60 cursor-default"><Video className="w-4 h-4" /></div>
                <div className="tiny-call-btn opacity-60 cursor-default"><Mic className="w-4 h-4" /></div>
              </>
            )}
            {isLive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neo-green/10 border-2 border-neo-green rounded-full">
                <div className="w-2 h-2 rounded-full bg-neo-green animate-pulse" />
                <span className={`font-black uppercase text-neo-green ${isPreview ? 'text-[8px]' : 'text-[10px]'}`}>Live</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {socials?.instagram && (
              <a href={socials.instagram.startsWith('http') ? socials.instagram : `https://instagram.com/${socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="monochrome-social">
                <Instagram className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </a>
            )}
            {socials?.youtube && (
              <a href={socials.youtube.startsWith('http') ? socials.youtube : `https://youtube.com/${socials.youtube.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="monochrome-social">
                <Youtube className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </a>
            )}
            {socials?.x && (
              <a href={socials.x.startsWith('http') ? socials.x : `https://x.com/${socials.x.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="monochrome-social font-black text-xs">𝕏</a>
            )}
            {socials?.website && (
              <a href={socials.website.startsWith('http') ? socials.website : `https://${socials.website}`} target="_blank" rel="noopener noreferrer" className="monochrome-social text-xs">
                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </a>
            )}
            <span className="monochrome-social"><Send className="w-3.5 h-3.5 md:w-4 md:h-4" /></span>
          </div>
        </div>

        {/* PROFILE HERO */}
        <div className={`flex flex-col items-center text-center ${isPreview ? 'mb-6' : 'mb-12'}`}>
          <div className="relative mb-4 md:mb-6">
            <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] overflow-hidden ${isPreview ? 'w-20 h-20' : 'w-32 h-32 md:w-40 md:h-40'}`}>
              {profileImage ? (
                <img src={profileImage} alt={username} className="w-full h-full object-cover" />
              ) : (
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
              )}
            </div>
          </div>
          <h1 className={`font-black uppercase tracking-tighter leading-none mb-3 md:mb-4 ${isPreview ? 'text-2xl' : 'text-4xl md:text-6xl'}`}>
            {username}
            {isVerified && <Zap className={`text-neo-blue fill-neo-blue inline-block ml-1.5 ${isPreview ? 'w-5 h-5' : 'w-8 h-8 md:w-10 md:h-10'}`} />}
          </h1>
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <div className={`flex items-center gap-2 border-2 border-black px-3 py-1 font-black uppercase text-xs shadow-[2px_2px_0px_0px_black] ${isAdmiring ? 'bg-neo-pink text-white' : 'bg-white text-black'}`}>
              <Heart className={`w-4 h-4 ${isAdmiring ? 'fill-white' : ''}`} /> {admirerCount}
            </div>
          </div>
          <p className={`max-w-xl font-bold text-zinc-500 uppercase tracking-widest leading-relaxed ${isPreview ? 'text-[9px]' : 'text-sm'}`}>
            Scaling human connection through time-based digital assets and elite calls.
          </p>
        </div>

        {/* TAB SYSTEM */}
        <div className={`border-4 border-black bg-white shadow-[8px_8px_0px_0px_black] overflow-hidden flex flex-col ${isPreview ? 'min-h-[200px]' : 'min-h-[500px]'}`}>
          <div className="flex border-b-4 border-black">
            <button onClick={() => setProfileTab('store')} className={`flex-1 store-tab-btn ${profileTab === 'store' ? 'store-tab-active' : 'store-tab-inactive'}`}>Store</button>
            <button onClick={() => setProfileTab('courses')} className={`flex-1 store-tab-btn ${profileTab === 'courses' ? 'store-tab-active' : 'store-tab-inactive'}`}>Courses</button>
            <button onClick={() => setProfileTab('about')} className={`flex-1 store-tab-btn ${profileTab === 'about' ? 'store-tab-active' : 'store-tab-inactive'}`}>About</button>
          </div>

          <div className={`flex-1 ${isPreview ? 'p-4' : 'p-6 md:p-10'}`}>
            {profileTab === 'store' && (
              <div className="space-y-6 md:space-y-8">
                <div className={`grid gap-4 md:gap-6 ${isPreview ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                  {/* Real Products */}
                  {products && products.length > 0 && products.map((prod: any) => {
                    const typeConf = productTypeConfig[prod.type] || productTypeConfig.digital;
                    const TypeIcon = typeConf.icon;
                    return (
                      <div
                        key={prod.id}
                        className="neo-box bg-white border-4 border-black shadow-[6px_6px_0px_0px_black] group overflow-hidden"
                      >
                        {prod.thumbnail ? (
                          <div className={`bg-zinc-100 border-b-4 border-black overflow-hidden ${isPreview ? 'h-20' : 'h-40'}`}>
                            <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`bg-zinc-50 border-b-4 border-black flex items-center justify-center ${isPreview ? 'h-12' : 'h-20'}`}>
                            <TypeIcon className={`opacity-10 ${isPreview ? 'w-5 h-5' : 'w-8 h-8'}`} />
                          </div>
                        )}
                        <div className={isPreview ? 'p-3' : 'p-6'}>
                          <div className="flex justify-between items-start mb-2 md:mb-3">
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-black text-white">{typeConf.label}</span>
                            {prod.type === 'booking' && prod.duration && (
                              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {prod.duration}</span>
                            )}
                          </div>
                          <h4 className={`font-black uppercase tracking-tight leading-tight mb-1 ${isPreview ? 'text-sm' : 'text-lg'}`}>{prod.name}</h4>
                          {prod.description && (
                            <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed line-clamp-2">{prod.description}</p>
                          )}
                          <div className={`mt-3 pt-3 border-t-2 border-zinc-100 flex justify-between items-center ${isPreview ? 'md:mt-2 md:pt-2' : 'mt-4 pt-4'}`}>
                            <span className={`font-black text-neo-green ${isPreview ? 'text-sm' : 'text-xl'}`}>₹{prod.price}</span>
                            <span className="neo-btn bg-black text-white px-3 py-1.5 font-black uppercase text-[9px] flex items-center gap-1.5">
                              <ShoppingBag className="w-3 h-3" /> Buy Now
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Session Templates */}
                  {templates && templates.length > 0 && templates.map((tpl: any) => (
                    <div key={tpl.id} className="neo-box bg-white border-4 border-black shadow-[6px_6px_0px_0px_black] p-4 md:p-6">
                      <div className="flex justify-between items-start mb-3 md:mb-4">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 border-2 border-black ${tpl.type === 'video' ? 'bg-neo-pink text-white' : 'bg-neo-blue text-white'}`}>
                          {tpl.duration} Min {tpl.type}
                        </span>
                        <Zap className="w-4 h-4 text-zinc-300" />
                      </div>
                      <h4 className={`font-black uppercase tracking-tight mb-1 ${isPreview ? 'text-sm' : 'text-lg'}`}>{tpl.duration} Min Session</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase line-clamp-2">{tpl.description || 'Instant 1:1 access for high-value consulting.'}</p>
                      <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t-2 border-zinc-50 flex justify-between items-center">
                        <span className="font-black text-neo-green">{tpl.price} TKN</span>
                        <span className="text-[8px] font-black uppercase text-neo-pink">Call Now</span>
                      </div>
                    </div>
                  ))}

                  {(!products || products.length === 0) && (!templates || templates.length === 0) && (
                    <div className={`py-12 md:py-20 bg-zinc-50 border-4 border-black border-dashed flex flex-col items-center justify-center opacity-50 ${isPreview ? '' : 'col-span-2'}`}>
                      <Clock className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4" />
                      <p className="text-[10px] font-black uppercase">Store items arriving soon...</p>
                    </div>
                  )}
                </div>

                {/* Tip Jar */}
                {!isPreview && (
                  <div className="neo-box bg-zinc-50 p-8 border-4 border-black shadow-[6px_6px_0px_0px_black]">
                    <div className="flex items-center gap-3 mb-4">
                      <Coffee className="w-6 h-6" />
                      <h4 className="text-xl font-black uppercase tracking-tighter italic">Support {username}</h4>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">
                      Show your appreciation with a tip — 100% goes to the creator
                    </p>
                    <div className="flex gap-3">
                      {[49, 99, 199, 499].map(amt => (
                        <div key={amt} className="flex-1 py-3 border-4 border-black font-black text-sm bg-white shadow-[4px_4px_0px_0px_black] text-center">₹{amt}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {profileTab === 'courses' && (
              <div className={`flex flex-col items-center justify-center border-4 border-black border-dashed bg-zinc-50 opacity-50 ${isPreview ? 'h-32' : 'h-64'}`}>
                <Sparkles className={`mb-3 md:mb-4 text-neo-blue ${isPreview ? 'w-8 h-8' : 'w-12 h-12'}`} />
                <h3 className={`font-black uppercase italic ${isPreview ? 'text-sm' : 'text-xl'}`}>Workshops & Training</h3>
                <p className="text-[10px] font-bold uppercase mt-2">Curating high-performance curriculum...</p>
              </div>
            )}

            {profileTab === 'about' && (
              <div className="space-y-6 md:space-y-10">
                {faqs && faqs.length > 0 && <FAQSection faqs={faqs} />}
                <div className={`bg-zinc-50 border-4 border-black shadow-[4px_4px_0px_0px_black] ${isPreview ? 'p-4' : 'p-8'}`}>
                  <h4 className={`font-black uppercase italic mb-3 md:mb-4 ${isPreview ? 'text-lg' : 'text-2xl'}`}>The Vision</h4>
                  <p className={`font-bold text-zinc-600 uppercase leading-relaxed ${isPreview ? 'text-[10px]' : 'text-sm'}`}>
                    Maximizing human potential through synchronized time. Every minute spent here is an investment in your evolution.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer — only in full mode */}
      {!isPreview && (
        <footer className="mt-20 py-12 border-t-4 border-black bg-zinc-50 text-black">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 mb-6 opacity-30"><Zap className="w-5 h-5 fill-black" /><span className="font-black uppercase text-xs">Supertime</span></div>
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">Blissful Art</p>
          </div>
        </footer>
      )}
    </div>
  );
}
