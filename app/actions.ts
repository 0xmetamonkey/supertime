'use server';

import { kv } from "@vercel/kv";
import { signIn, signOut, auth } from "../auth";

export async function checkAvailability(username: string) {
  if (!process.env.KV_URL) return true; // Fail open if no KV
  const owner = await kv.get(`owner:${username}`);
  return !owner;
}

export async function loginWithGoogle(usernameOrRedirect?: string) {
  const session = await auth();

  // If user is trying to claim a username (not redirecting where param starts with /)
  if (usernameOrRedirect && !usernameOrRedirect.startsWith('/') && usernameOrRedirect !== 'dashboard') {
    // Check if they already have one
    if (session?.user?.email && process.env.KV_URL) {
      const existing = await kv.get(`user:${session.user.email}:username`);
      if (existing && existing !== usernameOrRedirect) {
        // They have 'aman' but trying to claim 'funny' -> STOP THEM
        throw new Error(`You already have a username: ${existing}`);
      }
    }
  }

  let redirectTo = "/dashboard";

  if (usernameOrRedirect) {
    if (usernameOrRedirect.startsWith("/")) {
      redirectTo = usernameOrRedirect;
    } else if (usernameOrRedirect !== 'dashboard') {
      redirectTo = `/${usernameOrRedirect}`;
    }
  }

  await signIn("google", { redirectTo });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
