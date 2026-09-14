/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  Copy,
  Check,
  ExternalLink,
  PhoneCall,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface Booking {
  id: string;
  visitorEmail: string;
  creatorUsername: string;
  date: string;
  time: string;
  type: string;
  duration: number;
  price: number;
  netPrice?: number;
  status: string;
  meetingUrl: string;
  meetingMethodUsed?: string;
  timestamp: number;
}

export default function BookingsTab({ username }: { username: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/call/book?mode=received');
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
      }
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/${username}` : `https://supertime.wtf/${username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isUpcoming = (b: Booking) => {
    try {
      const bookingDateTime = new Date(`${b.date}T${b.time}`);
      return bookingDateTime.getTime() + (b.duration || 30) * 60 * 1000 > Date.now();
    } catch {
      return true;
    }
  };

  const filteredBookings = filter === 'upcoming' 
    ? bookings.filter(isUpcoming)
    : bookings;

  return (
    <div className="space-y-8">
      {/* HEADER WITH STATS & ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-medium text-foreground flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-neo-green" /> 1:1 Sessions with Believers
          </h2>
          <p className="text-sm text-muted mt-1">
            Manage your booked calls and join active meeting rooms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground hover:bg-surface transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
            {copiedLink ? 'Copied Link' : 'Copy Booking Link'}
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === 'upcoming'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            Upcoming ({bookings.filter(isUpcoming).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            All Sessions ({bookings.length})
          </button>
        </div>

        <button
          onClick={fetchBookings}
          className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          {isLoading && <Loader2 className="w-3 h-3 animate-spin" />} Refresh
        </button>
      </div>

      {/* BOOKINGS LIST */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted mb-4" />
          <p className="text-sm text-muted">Loading your sessions...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-surface/50">
          <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center mx-auto mb-4 text-muted">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">
            {filter === 'upcoming' ? 'No upcoming calls scheduled' : 'No calls booked yet'}
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto mb-6">
            Share your Supertime link on Instagram, Twitter, or YouTube. When your Believers book a slot, it will appear right here.
          </p>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {copiedLink ? 'Link Copied!' : `Copy supertime.wtf/${username}`}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => {
            const clientName = booking.visitorEmail.split('@')[0];
            const upcoming = isUpcoming(booking);

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-foreground/20 transition-all shadow-sm"
              >
                {/* Client & Date Info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 text-foreground font-semibold text-sm uppercase">
                    {clientName.slice(0, 2)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground text-sm">
                        {clientName}
                      </h4>
                      <span className="text-[10px] text-muted bg-background px-2 py-0.5 rounded-full border border-border">
                        {booking.visitorEmail}
                      </span>
                      {upcoming && (
                        <span className="text-[10px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {booking.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {booking.time} ({booking.duration || 30}m)
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-gray-400" />
                        {booking.meetingMethodUsed || 'Supercalls'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Join Action */}
                <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-muted block">Session Value</span>
                    <span className="text-sm font-semibold text-foreground">
                      ₹{booking.price || 0}
                    </span>
                  </div>

                  {booking.meetingUrl && (
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Join Room <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
