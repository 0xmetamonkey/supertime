import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

interface ProfileProgressWidgetProps {
  settings: {
    profileImage?: string;
    videoRate: number;
    audioRate: number;
    socials: Record<string, string>;
  };
}

export default function ProfileProgressWidget({ settings }: ProfileProgressWidgetProps) {
  const steps = [
    {
      id: 'avatar',
      label: 'Upload a Profile Picture',
      isComplete: !!settings.profileImage && settings.profileImage.length > 0,
    },
    {
      id: 'rates',
      label: 'Set Custom Rates',
      isComplete: settings.videoRate !== 100 || settings.audioRate !== 50,
    },
    {
      id: 'socials',
      label: 'Add at least one Social Link',
      isComplete: Object.values(settings.socials || {}).some(link => !!link),
    }
  ];

  const completedCount = steps.filter(s => s.isComplete).length;
  const totalCount = steps.length;
  const isFullyComplete = completedCount === totalCount;

  if (isFullyComplete) return null; // Hide if 100% complete

  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_theme(colors.neo-yellow)] p-6 mb-8 group transition-all">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Complete Your Profile</h3>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Get ready for your audience</p>
        </div>
        <div className="text-3xl font-black tracking-tighter">{Math.round(progressPercentage)}%</div>
      </div>

      {/* Progress Bar */}
      <div className="h-4 bg-zinc-100 border-4 border-black w-full mb-6">
        <div
          className="h-full bg-neo-yellow border-r-4 border-black transition-all duration-1000 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="space-y-3 mb-6">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3">
            {step.isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-neo-green fill-neo-green text-black" />
            ) : (
              <Circle className="w-5 h-5 text-zinc-300" />
            )}
            <span className={`font-bold text-sm ${step.isComplete ? 'text-zinc-500 line-through' : 'text-black'}`}>
              {step.label}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/studio/settings"
        className="block text-center w-full py-3 bg-black text-neo-yellow font-black uppercase tracking-widest text-sm hover:translate-x-1 hover:translate-y-1 transition-transform"
      >
        Go to Settings →
      </Link>
    </div>
  );
}
