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
    const { action, from, to, type } = await req.json();

    if (action === 'call') {
      // Guest is calling Creator (to)
      const signalData = { from, type, timestamp: Date.now() };

      if (hasKV) {
        await kv.set(`call_signal:${to}`, JSON.stringify(signalData), { ex: 60 });
      } else {
        console.log(`[MockKV] Setting signal for ${to}:`, signalData);
        global.mockSignalStore.set(`call_signal:${to}`, signalData);
        // Clean up mock after 60s
        setTimeout(() => global.mockSignalStore.delete(`call_signal:${to}`), 60000);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'reject') {
      const targetUser = from || to;
      const rejectData = { rejected: true, timestamp: Date.now() };

      if (hasKV) {
        await kv.set(`call_signal:${targetUser}`, JSON.stringify(rejectData), { ex: 10 }); // Keep for 10s
      } else {
        global.mockSignalStore.set(`call_signal:${targetUser}`, rejectData);
        setTimeout(() => global.mockSignalStore.delete(`call_signal:${targetUser}`), 10000);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'answer' || action === 'end') {
      // Clean up for either sender (from) or receiver (to)
      const targetUser = from || to;
      // ... delete logic ...
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

    if (signal) {
      return NextResponse.json({ active: true, ...signal });
    }
    return NextResponse.json({ active: false });
  } catch (error) {
    console.error("Signal GET Error:", error);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}
