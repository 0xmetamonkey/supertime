import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { kv } from '@vercel/kv';
import { resolveUsername } from '@/app/actions';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ isSignedIn: false, isCreator: false, role: null, username: null });
    }

    let email = (sessionClaims as { email?: string } | undefined)?.email?.toLowerCase();
    if (!email) {
      try {
        const user = await currentUser();
        email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
      } catch (e) {
        console.error('[api/user/me] Clerk currentUser fallback failed:', e);
      }
    }

    if (!email) {
      return NextResponse.json({ isSignedIn: true, isCreator: false, role: null, username: null });
    }

    const username = await resolveUsername(email);
    let role: string | null = null;

    if (process.env.KV_URL) {
      role = await kv.get<string>(`user:${email}:role`);
      // If legacy user with claimed username but no role, default to creator
      if (username && !role) {
        role = 'creator';
      }
    } else {
      role = username ? 'creator' : 'fan';
    }

    const isCreator = role === 'creator' || role === 'artist';

    return NextResponse.json({
      isSignedIn: true,
      isCreator,
      role,
      username,
    });
  } catch (error) {
    console.error('[api/user/me] error:', error);
    return NextResponse.json({ isSignedIn: false, isCreator: false, role: null, username: null }, { status: 500 });
  }
}
