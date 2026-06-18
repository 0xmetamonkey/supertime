import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { resolveUsername } from "../actions";
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

  const resolvedUsername = email ? await resolveUsername(email) : null;
  const username = resolvedUsername || (email ? email.split('@')[0] : '');

  return <GlobalChatListener username={username} />;
}
