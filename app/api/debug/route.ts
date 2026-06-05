import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    const keys = await kv.keys('chat:dm:*');
    const data: any = {};
    for (const k of keys) {
      data[k] = await kv.get(k);
    }
    return NextResponse.json({ keys, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
