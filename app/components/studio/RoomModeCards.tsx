'use client';

import React from 'react';
import { User, Users, BarChart2 } from 'lucide-react';

export type RoomMode = '1v1' | 'circle' | 'stage';

interface RoomModeCardsProps {
  selectedMode: RoomMode;
  onSelectMode: (mode: RoomMode) => void;
}

export const ROOM_MODES_CONFIG = {
  '1v1': {
    id: '1v1' as RoomMode,
    title: '1 : 1',
    subtitle: 'One person\nat a time',
    description: 'A focused space for meaningful conversations.',
    icon: User,
    badge: 'Private room',
    defaultDuration: 30,
    defaultCapacity: 1,
  },
  circle: {
    id: 'circle' as RoomMode,
    title: 'Many : Many',
    subtitle: 'Open\nconversation',
    description: 'A space for open conversations. Everyone can speak.',
    icon: Users,
    badge: 'Circle room',
    defaultDuration: 45,
    defaultCapacity: 8,
  },
  stage: {
    id: 'stage' as RoomMode,
    title: '1 : Many',
    subtitle: 'You speak,\nthey listen',
    description: 'You speak. They listen.',
    icon: BarChart2,
    badge: 'Stage room',
    defaultDuration: 60,
    defaultCapacity: 50,
  },
};

export default function RoomModeCards({ selectedMode, onSelectMode }: RoomModeCardsProps) {
  const modes: RoomMode[] = ['1v1', 'circle', 'stage'];

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {modes.map((modeKey) => {
        const config = ROOM_MODES_CONFIG[modeKey];
        const Icon = config.icon;
        const isSelected = selectedMode === modeKey;

        return (
          <button
            key={modeKey}
            type="button"
            onClick={() => onSelectMode(modeKey)}
            className={`flex flex-col items-center justify-between p-4 rounded-3xl border transition-all duration-200 text-center select-none cursor-pointer min-h-[140px] ${
              isSelected
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg dark:bg-white dark:text-neutral-900 dark:border-white scale-[1.02]'
                : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400 dark:bg-neutral-900 dark:text-white dark:border-neutral-800 dark:hover:border-neutral-700'
            }`}
          >
            <div className="pt-2">
              <Icon className={`w-7 h-7 stroke-[1.75] mx-auto ${isSelected ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white'}`} />
            </div>

            <div className="my-auto">
              <h3 className="font-semibold text-sm tracking-tight">{config.title}</h3>
            </div>

            <div className="pb-1">
              <p className={`text-[11px] leading-tight font-normal whitespace-pre-line ${
                isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'
              }`}>
                {config.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
