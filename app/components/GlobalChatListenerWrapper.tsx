import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import GlobalChatListener from "./GlobalChatListener";

export default async function GlobalChatListenerWrapper() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  let email = (sessionClaims as any)?.email || '';
  if (!email) {
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress || '';
    } catch { }
  }
  
  if (!email) return null;

  let username = '';
  try {
    const userData = await kv.hgetall(`user:${email}`);
    username = (userData as any)?.username || email.split('@')[0];
  } catch {
    username = email.split('@')[0];
  }

  return <GlobalChatListener username={username} />;
}
