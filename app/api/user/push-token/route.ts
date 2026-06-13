import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const email = user.emailAddresses[0]?.emailAddress?.toLowerCase();

    // 1. Store under Clerk ID (for internal routing)
    await kv.set(`user:${user.id.toLowerCase()}:fcm_token`, token);

    // 2. Store under Email (for email-based lookup)
    if (email) {
      await kv.set(`user:${email}:fcm_token`, token);

      // 3. Store under Username (for public link targeting)
      // We use the same key format as actions.ts:claimUsername
      const username = await kv.get<string>(`user:${email}:username`);
      if (username) {
        await kv.set(`user:${username.toLowerCase()}:fcm_token`, token);
        console.log(`[Token] Saved FCM token for user ${username}`);
      } else {
        // Fallback to searching the old key if migration hasn't happened
        const oldUsername = await kv.get<string>(`email:${email}:username`);
        if (oldUsername) {
          await kv.set(`user:${oldUsername.toLowerCase()}:fcm_token`, token);
          console.log(`[Token] Saved FCM token for user ${oldUsername} (legacy key)`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
