import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";
import { resolveUsername } from '@/app/actions';
import { revalidateTag } from 'next/cache';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  // If username is provided, it's a public request for artist profile/storefront
  if (username) {
    const cleanUsername = username.toLowerCase().trim();
    if (process.env.KV_URL) {
      const publicMenu = await kv.get(`user_menu:${cleanUsername}`);
      if (publicMenu) {
        return NextResponse.json({ menuCategories: publicMenu });
      }
      // Fallback: check owner's email
      const ownerEmail = await kv.get<string>(`owner:${cleanUsername}`);
      if (ownerEmail) {
        const ownerMenu = await kv.get(`user:${ownerEmail}:menuCategories`);
        return NextResponse.json({ menuCategories: ownerMenu || [] });
      }
    }
    return NextResponse.json({ menuCategories: [] });
  }

  // Otherwise, it's a dashboard request for the currently logged-in user
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email) {
    return NextResponse.json({ menuCategories: [] });
  }

  if (process.env.KV_URL) {
    const categories = await kv.get(`user:${email}:menuCategories`);
    return NextResponse.json({ menuCategories: categories || [] });
  }

  return NextResponse.json({ menuCategories: [] });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'No email found' }, { status: 400 });
  }

  try {
    const { menuCategories } = await req.json();

    if (process.env.KV_URL) {
      await kv.set(`user:${email}:menuCategories`, menuCategories);

      // Also persist to public key by resolved username
      const username = await resolveUsername(email);
      if (username) {
        await kv.set(`user_menu:${username.toLowerCase()}`, menuCategories);
      }

      // Revalidate creator profile cache
      revalidateTag(`creator-profile-${email}`, "max");
      revalidateTag('featured-creators', "max");
      revalidateTag('all-creators', "max");
    }

    return NextResponse.json({ success: true, menuCategories });
  } catch (error) {
    console.error('[api/user/menu] Error saving menu:', error);
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 });
  }
}

