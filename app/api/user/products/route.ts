import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";
import { resolveUsername } from '@/app/actions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  // If username is provided, it's a public request for storefront
  if (username) {
    const products = await kv.get(`user_products:${username.toLowerCase()}`);
    return NextResponse.json({ products: products || [] });
  }

  // Otherwise, it's a dashboard request for the current user
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve username via KV to find products
  const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (email) {
    const resolvedUsername = await resolveUsername(email);
    if (resolvedUsername) {
      const products = await kv.get(`user_products:${resolvedUsername}`);
      return NextResponse.json({ products: products || [] });
    }
  }

  return NextResponse.json({ products: [] });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { products } = await req.json();
  const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'No email found' }, { status: 400 });
  }

  // Resolve username via KV (same as rest of the app)
  const username = await resolveUsername(email);
  if (username) {
    await kv.set(`user_products:${username}`, products);
  }

  return NextResponse.json({ success: true });
}
