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

export async function completeOnboarding(usernameRaw: string, role: 'creator' | 'fan') {
  const user = await currentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) throw new Error("Not logged in");

  const email = user.emailAddresses[0].emailAddress.toLowerCase().trim();
  const username = usernameRaw.toLowerCase().replace(/[^a-z0-9_]/g, ''); // Ensure safe URL characters

  if (!username) throw new Error("Invalid username");
  if (!process.env.KV_URL) throw new Error("Database not connected");

  // Prevent claiming reserved names
  const reservedUsernames = [
    'admin', 'supertime', 'api', 'help', 'support', 'billing', 'auth',
    'login', 'signup', 'dashboard', 'settings', 'null', 'undefined', 'studio', 'chat'
  ];
  if (reservedUsernames.includes(username)) {
    throw new Error("This username is reserved and cannot be claimed.");
  }

  // 1. Check if name is taken by someone else
  const owner = await kv.get(`owner:${username}`);
  if (owner && owner !== email) {
    throw new Error("Username already taken. Please choose another.");
  }

  // 2. Check if user already has a DIFFERENT name
  const existingName = await kv.get(`user:${email}:username`);
  if (existingName && existingName !== username) {
    // Release old name if they are changing it
    await kv.del(`owner:${existingName}`);
  }

  // 3. Claim the identity and assign the role
  await kv.set(`owner:${username}`, email);
  await kv.set(`user:${email}:username`, username);
  await kv.set(`user:${email}:role`, role);
  
  // Set default settings for creators
  if (role === 'creator') {
    const hasRate = await kv.get(`user:${email}:rate:video`);
    if (!hasRate) {
      await kv.set(`user:${email}:rate:video`, 100);
      await kv.set(`user:${email}:rate:audio`, 50);
      await kv.set(`user:${email}:isRoomFree`, true);
    }
  }

  return { success: true, username, role };
}

export async function getFeaturedCreators() {
  if (!process.env.KV_URL) return [];
  try {
    const keys = await kv.keys("owner:*");
    // Shuffle the keys array randomly
    const shuffledKeys = keys.sort(() => 0.5 - Math.random());
    // Slice up to 4 creators
    const usernames = shuffledKeys.slice(0, 4).map(k => k.replace("owner:", ""));

    // Fetch emails in parallel
    const emails = await Promise.all(usernames.map(username => kv.get<string>(`owner:${username}`)));

    const validPairs = usernames
      .map((username, i) => ({ username, email: emails[i] }))
      .filter(pair => !!pair.email) as { username: string, email: string }[];

    const featured = await Promise.all(validPairs.map(async ({ username, email }) => {
      // Execute all 5 property queries in parallel for this creator
      const [profileImage, vRate, bio, role, displayName] = await Promise.all([
        kv.get<string>(`user:${email}:profileImage`),
        kv.get<number>(`user:${email}:rate:video`),
        kv.get<string>(`user:${email}:bio`),
        kv.get<string>(`user:${email}:role`),
        kv.get<string>(`user:${email}:displayName`)
      ]);

      return {
        name: displayName || (username.charAt(0).toUpperCase() + username.slice(1)),
        username: username,
        role: role || "Creator",
        desc: bio || "Intentional human-first sessions",
        time: "30 min",
        price: `₹${vRate || 100}`,
        image: profileImage || "",
        isReal: true
      };
    }));

    return featured;
  } catch (err) {
    console.error("Failed to fetch featured creators:", err);
    return [];
  }
}

export async function getAllCreators() {
  if (!process.env.KV_URL) return [];
  try {
    const keys = await kv.keys("owner:*");
    const usernames = keys.map(k => k.replace("owner:", ""));

    // Fetch emails in parallel
    const emails = await Promise.all(usernames.map(username => kv.get<string>(`owner:${username}`)));

    const validPairs = usernames
      .map((username, i) => ({ username, email: emails[i] }))
      .filter(pair => !!pair.email) as { username: string, email: string }[];

    const creators = await Promise.all(validPairs.map(async ({ username, email }) => {
      // Execute all 5 property queries in parallel for this creator
      const [profileImage, vRate, bio, role, displayName] = await Promise.all([
        kv.get<string>(`user:${email}:profileImage`),
        kv.get<number>(`user:${email}:rate:video`),
        kv.get<string>(`user:${email}:bio`),
        kv.get<string>(`user:${email}:role`),
        kv.get<string>(`user:${email}:displayName`)
      ]);

      return {
        name: displayName || (username.charAt(0).toUpperCase() + username.slice(1)),
        username: username,
        role: role || "Creator",
        desc: bio || "Intentional human-first sessions",
        time: "30 min",
        price: `₹${vRate || 100}`,
        image: profileImage || "",
        isReal: true
      };
    }));

    return creators;
  } catch (err) {
    console.error("Failed to fetch all creators:", err);
    return [];
  }
}

