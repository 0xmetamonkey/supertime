import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { kv } from "@vercel/kv";
import ChatClient from "./ChatClient";

export default async function ChatPage({ searchParams }: { searchParams: { to?: string } }) {
  const user = await currentUser();

  if (!user) {
    redirect(`/sign-in?forceRedirectUrl=/chat${searchParams.to ? `?to=${searchParams.to}` : ''}`);
  }

  const recipient = searchParams.to;

  const email = user.emailAddresses?.[0]?.emailAddress || '';

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
        id: user.id,
        username,
        email,
      }}
      recipient={recipient && recipient.toLowerCase() !== username.toLowerCase() ? recipient : undefined}
    />
  );
}
