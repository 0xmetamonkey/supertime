import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Fallback for local dev without Vercel KV keys
declare global {
  var mockSignalStore: Map<string, any>;
}
if (!global.mockSignalStore) {
  global.mockSignalStore = new Map();
}

const hasKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const { action, from, to, type, callerName } = await req.json();

    if (action === 'call') {
      // Generate unique channel name
      const channelName = `supertime-${to}-${Date.now()}`;
      const safeCallerName = callerName || (from === 'guest' ? 'Guest' : 'Anonymous');
      console.log('[Signal API] Creating call signal:', { from, callerName: safeCallerName, to, type, channelName });

      const signalData = {
        from,
        callerName: safeCallerName,
        type,
        timestamp: Date.now(),
        channelName
      };

      if (hasKV) {
        await kv.set(`call_signal:${to}`, JSON.stringify(signalData), { ex: 60 });
      } else {
        console.log(`[MockKV] Setting signal for ${to}:`, signalData);
        global.mockSignalStore.set(`call_signal:${to}`, signalData);
        setTimeout(() => global.mockSignalStore.delete(`call_signal:${to}`), 60000);
      }

      console.log('[Signal API] Returning channelName to caller:', channelName);
      return NextResponse.json({ success: true, channelName });
    }

    if (action === 'reject') {
      const targetUser = from || to;
      const rejectData = { rejected: true, timestamp: Date.now() };

      if (hasKV) {
        await kv.set(`call_signal:${targetUser}`, JSON.stringify(rejectData), { ex: 10 });
      } else {
        global.mockSignalStore.set(`call_signal:${targetUser}`, rejectData);
        setTimeout(() => global.mockSignalStore.delete(`call_signal:${targetUser}`), 10000);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'answer' || action === 'end') {
      const targetUser = from || to;

      if (hasKV) {
        await kv.del(`call_signal:${targetUser}`);
        if (to) await kv.del(`call_signal:${to}`);
      } else {
        console.log(`[MockKV] Deleting signal for ${targetUser}`);
        global.mockSignalStore.delete(`call_signal:${targetUser}`);
        if (to) global.mockSignalStore.delete(`call_signal:${to}`);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error("Signal POST Error:", error);
    return NextResponse.json({ error: 'Signal failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

  try {
    let signal: any;

    if (hasKV) {
      const raw = await kv.get(`call_signal:${username}`);
      if (typeof raw === 'string') {
        try { signal = JSON.parse(raw); } catch (e) { signal = null; }
      } else {
        signal = raw;
      }
    } else {
      signal = global.mockSignalStore.get(`call_signal:${username}`);
    }

    if (signal && !signal.rejected) {
      console.log('[Signal API] Returning signal to creator:', {
        username,
        channelName: signal.channelName,
        from: signal.from,
        callerName: signal.callerName,
        type: signal.type
      });
      return NextResponse.json({
        incoming: {
          from: signal.from,
          callerName: signal.callerName,
          type: signal.type,
          channelName: signal.channelName
        }
      });
    }

    return NextResponse.json({ active: false });
  } catch (error) {
    console.error("Signal GET Error:", error);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}