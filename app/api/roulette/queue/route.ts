import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

export const dynamic = 'force-dynamic';

interface WaitingPeer {
  peerId: string;
  joinedAt: number;
  recentPeers: string[];
}

interface ActiveSession {
  sessionId: string;
  peerA: string;
  peerB: string;
  createdAt: number;
}

// In-memory fallback for local dev when Vercel KV is not configured
declare global {
  // eslint-disable-next-line no-var
  var __rouletteMemoryQueue: Map<string, WaitingPeer> | undefined;
  // eslint-disable-next-line no-var
  var __rouletteSessions: Map<string, ActiveSession> | undefined;
  // eslint-disable-next-line no-var
  var __roulettePeerToSession: Map<string, { sessionId: string; partnerId: string; role: 'initiator' | 'receiver' }> | undefined;
}

if (!globalThis.__rouletteMemoryQueue) {
  globalThis.__rouletteMemoryQueue = new Map();
}
if (!globalThis.__rouletteSessions) {
  globalThis.__rouletteSessions = new Map();
}
if (!globalThis.__roulettePeerToSession) {
  globalThis.__roulettePeerToSession = new Map();
}

async function notifyViaAbly(channelName: string, eventName: string, data: unknown) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return;
  try {
    const ably = new Ably.Rest(apiKey);
    const channel = ably.channels.get(channelName);
    await channel.publish(eventName, data);
  } catch (err) {
    console.error('[Roulette Queue] Ably notification error:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, peerId, recentPeers = [] } = body;

    if (!peerId) {
      return NextResponse.json({ error: 'Missing peerId' }, { status: 400 });
    }

    const now = Date.now();
    const memQueue = globalThis.__rouletteMemoryQueue!;
    const memSessions = globalThis.__rouletteSessions!;
    const memPeerToSession = globalThis.__roulettePeerToSession!;

    // Clean up expired waiting peers (> 20 seconds without heartbeat)
    for (const [id, peer] of memQueue.entries()) {
      if (now - peer.joinedAt > 20000) {
        memQueue.delete(id);
      }
    }

    // 1. LEAVE / CANCEL
    if (action === 'leave') {
      memQueue.delete(peerId);
      memPeerToSession.delete(peerId);
      return NextResponse.json({ status: 'left' });
    }

    // 2. HEARTBEAT / POLL
    if (action === 'heartbeat') {
      // Check if another peer matched with us
      const assignedSession = memPeerToSession.get(peerId);
      if (assignedSession) {
        memPeerToSession.delete(peerId);
        return NextResponse.json({
          status: 'matched',
          sessionId: assignedSession.sessionId,
          partnerId: assignedSession.partnerId,
          role: assignedSession.role,
        });
      }

      // If still in waiting queue, refresh timestamp
      if (memQueue.has(peerId)) {
        const peer = memQueue.get(peerId)!;
        peer.joinedAt = now;
        memQueue.set(peerId, peer);
      }
      return NextResponse.json({ status: 'waiting' });
    }

    // 3. JOIN / FIND MATCH
    if (action === 'join' || action === 'skip') {
      // Remove any lingering assignment for this peer
      memPeerToSession.delete(peerId);

      // Search for candidate: someone waiting who is NOT self and NOT in recentPeers
      let candidate: WaitingPeer | null = null;
      for (const [id, peer] of memQueue.entries()) {
        if (id !== peerId && !recentPeers.includes(id) && !peer.recentPeers.includes(peerId)) {
          candidate = peer;
          memQueue.delete(id);
          break;
        }
      }

      // Candidate found! Match them up.
      if (candidate) {
        const sessionId = `roulette_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const session: ActiveSession = {
          sessionId,
          peerA: peerId,
          peerB: candidate.peerId,
          createdAt: now,
        };
        memSessions.set(sessionId, session);

        // peerId = initiator (creates offer)
        // candidate = receiver (creates answer)
        const candidateAssignment = {
          sessionId,
          partnerId: peerId,
          role: 'receiver' as const,
        };
        memPeerToSession.set(candidate.peerId, candidateAssignment);

        // Notify candidate immediately via Ably so they don't have to wait for next heartbeat
        await notifyViaAbly(`roulette:peer:${candidate.peerId}`, 'match_found', candidateAssignment);

        return NextResponse.json({
          status: 'matched',
          sessionId,
          partnerId: candidate.peerId,
          role: 'initiator',
        });
      }

      // No candidate found: add to waiting pool
      memQueue.set(peerId, {
        peerId,
        joinedAt: now,
        recentPeers,
      });

      return NextResponse.json({
        status: 'waiting',
        peerId,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Roulette Queue] Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
