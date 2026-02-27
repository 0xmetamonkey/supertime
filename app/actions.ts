'use server';

import { kv } from "@vercel/kv";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Helper to handle key migration (New vs Old)
export async function resolveUsername(emailRaw: string): Promise<string | null> {
  if (!process.env.KV_URL) return null;

  const email = emailRaw.toLowerCase().trim();

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

export async function checkAvailability(usernameRaw: string) {
  if (!process.env.KV_URL) return true; // Fail open if no KV
  const username = usernameRaw.toLowerCase();
  const owner = await kv.get(`owner:${username}`);
  return !owner;
}

export async function claimUsername(usernameRaw: string) {
  const user = await currentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) throw new Error("Not logged in");

  const email = user.emailAddresses[0].emailAddress.toLowerCase().trim();
  const username = usernameRaw.toLowerCase();

  if (!process.env.KV_URL) throw new Error("Database not connected");

  // Prevent claiming reserved names
  const reservedUsernames = [
    'admin', 'supertime', 'api', 'help', 'support', 'billing', 'auth',
    'login', 'signup', 'dashboard', 'settings', 'null', 'undefined'
  ];
  if (reservedUsernames.includes(username)) {
    throw new Error("This username is reserved and cannot be claimed.");
  }

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

// Auth actions (loginWithGoogle, logout) have been migrated to Clerk client-side components.
