import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.toLowerCase() || 'aman';

  try {
    const keys = await kv.keys('chat:dm:*');
    
    const results = [];
    for (const key of keys) {
      const parts = key.split(':');
      const dmIndex = parts.indexOf('dm');
      
      const u1 = parts[dmIndex + 1];
      const u2 = parts[dmIndex + 2];
      
      const matches = u1 === username || u2 === username;
      
      let msgs = null;
      if (matches) {
        msgs = await kv.get(key);
      }
      
      results.push({
        key,
        parts,
        dmIndex,
        u1,
        u2,
        matches,
        messageCount: msgs ? (Array.isArray(msgs) ? msgs.length : 'not an array') : 0
      });
    }

    return NextResponse.json({
      targetUsername: username,
      totalKeysFound: keys.length,
      keys: results
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
