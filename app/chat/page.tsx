import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { kv } from "@vercel/kv";
import ChatClient from "./ChatClient";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const sp = await searchParams;
  const { userId, sessionClaims } = await auth();
  let email = (sessionClaims as any)?.email || '';

  // Fallback in case Clerk claim is lagging
  if (userId && !email) {
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress || '';
    } catch (e) {
      console.error("[Chat Page] Clerk currentUser fallback failed:", e);
    }
  }

  if (!userId) {
    redirect(`/sign-in?forceRedirectUrl=/chat${sp.to ? `?to=${sp.to}` : ''}`);
  }

  const recipient = sp.to;

  // Resolve username from KV
  let username = '';
  try {
    const userData = await kv.hgetall(`user:${email}`);
    username = (userData as any)?.username || email.split('@')[0];
  } catch {
    username = email.split('@')[0];
  }

  return (
    <ChatClient
      user={{
        id: userId,
        username,
        email,
      }}
      recipient={recipient && recipient.toLowerCase() !== username.toLowerCase() ? recipient : undefined}
    />
  );
}
