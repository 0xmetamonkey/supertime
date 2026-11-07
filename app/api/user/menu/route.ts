import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from '@clerk/nextjs/server';

/**
 * GET /api/user/menu?username=xxx
 * Returns the public menu categories for a given creator username.
 */
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }

  try {
    if (!process.env.KV_URL) {
      return NextResponse.json({ categories: [] });
    }

    const ownerEmail = await kv.get(`owner:${username.toLowerCase()}`);
    if (!ownerEmail) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const categories = (await kv.get(`user:${ownerEmail}:menuCategories`)) || [];
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[Menu API GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

/**
 * POST /api/user/menu
 * Saves the authenticated creator's menu categories.
 * Body: { categories: MenuCategory[] }
 */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  const emailAddr = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !emailAddr) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = emailAddr.toLowerCase();

  try {
    const { categories } = await req.json();

    if (!process.env.KV_URL) {
      // Local dev — just acknowledge
      return NextResponse.json({ ok: true, categories });
    }

    await kv.set(`user:${email}:menuCategories`, categories);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Menu API POST] Error:', error);
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 });
  }
}
