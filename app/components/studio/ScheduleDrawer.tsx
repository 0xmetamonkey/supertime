'use client';

import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Calendar, Clock, Check } from 'lucide-react';
import { RoomMode } from './RoomModeCards';

interface ScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSchedule?: (scheduleData: any) => void;
}

export default function ScheduleDrawer({
  isOpen,
  onClose,
  onSaveSchedule,
}: ScheduleDrawerProps) {
  const [selectedMode, setSelectedMode] = useState<RoomMode>('1v1');
  const [selectedDay, setSelectedDay] = useState<number>(8);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const slots = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'];

  const handleSave = () => {
    setSavedSuccess(true);
    if (onSaveSchedule) {
      onSaveSchedule({
        mode: selectedMode,
        day: selectedDay,
        slot: selectedSlot,
      });
    }
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 sm:rounded-3xl rounded-t-3xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h3 className="font-semibold text-base">Schedule</h3>

          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Type Selector Tabs */}
        <div className="flex items-center gap-2 px-5 py-2">
          {[
            { id: '1v1', label: '1 : 1' },
            { id: 'circle', label: 'Many : Many' },
            { id: 'stage', label: '1 : Many' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMode(tab.id as RoomMode)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                selectedMode === tab.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Calendar View */}
          <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-3xl p-4 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4 px-1">
              <button className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold">September 2026</span>
              <button className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 text-center text-[10px] font-medium text-neutral-400 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Blank pad */}
              <span />
              <span />
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`h-9 w-9 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                    selectedDay === d
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 block">
              Available slots
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-3 rounded-2xl border text-xs font-semibold transition-all ${
                    selectedSlot === slot
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-950 font-semibold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
