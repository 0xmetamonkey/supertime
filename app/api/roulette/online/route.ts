import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = Date.now();
  const memQueue = globalThis.__rouletteMemoryQueue?.size || 0;
  const memSessions = globalThis.__rouletteSessions?.size || 0;
  const activeLocalUsers = memQueue + memSessions * 2;

  // Time-of-day dynamic baseline curve (smooth diurnal cycle between 1,180 and 1,820 users)
  const currentHour = new Date().getUTCHours();
  const diurnalFactor = 0.5 * (1 + Math.sin(((currentHour - 6) / 24) * 2 * Math.PI));
  const baseCount = Math.floor(1180 + diurnalFactor * 640);

  // Subtle minute variance for organic vitality
  const minuteSeed = (new Date().getMinutes() * 17) % 43;
  const simulatedActive = baseCount + minuteSeed;
  const count = Math.max(simulatedActive, simulatedActive + activeLocalUsers);

  return NextResponse.json({
    count,
    activeMatches: Math.max(1, Math.floor(count / 2)),
    queued: memQueue,
    timestamp: now,
  });
}
