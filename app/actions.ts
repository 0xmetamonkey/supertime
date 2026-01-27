'use server';

import { kv } from "@vercel/kv";
import { signIn, signOut, auth } from "../auth";

// Helper to handle key migration (New vs Old)
export async function resolveUsername(email: string): Promise<string | null> {
  if (!process.env.KV_URL) return null;

  // 1. Try NEW key
  let username = await kv.get<string>(`user:${email}:username`);

  // 2. If not found, try OLD key
  if (!username) {
    username = await kv.get<string>(`email:${email}:username`);

    // 3. If found in old key, MIGRATE to new key for future
    if (username) {
      console.log(`[MIGRATION] Migrating ${email} to new key format.`);
      await kv.set(`user:${email}:username`, username);
    }
  }

  return username;
}

export async function checkAvailability(username: string) {
  if (!process.env.KV_URL) return true; // Fail open if no KV
  const owner = await kv.get(`owner:${username}`);
  return !owner;
}

export async function claimUsername(username: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not logged in");

  const email = session.user.email;

  if (!process.env.KV_URL) throw new Error("Database not connected");

  // 1. Check if name is taken
  const owner = await kv.get(`owner:${username}`);
  if (owner && owner !== email) {
    throw new Error("Username already taken");
  }

  // 2. Check if user already has a name
  const existingName = await kv.get(`user:${email}:username`);
  if (existingName && existingName !== username) {
    throw new Error(`You already have a username: ${existingName}`);
  }

  // 3. Claim it
  await kv.set(`owner:${username}`, email);
  await kv.set(`user:${email}:username`, username);

  return { success: true };
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
