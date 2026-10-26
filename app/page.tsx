import { auth, currentUser } from "@clerk/nextjs/server";
import { resolveUsername } from "./actions";
import LandingPageClient from "./LandingPageClient";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const { userId, sessionClaims } = await auth();
  let email = (sessionClaims as { email?: string } | undefined)?.email;

  // Fallback in case Clerk claim is lagging
  if (userId && !email) {
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress;
    } catch (e) {
      console.error("[Landing Page] Clerk currentUser fallback failed:", e);
    }
  }

  let username: string | null = null;
  if (email) {
    username = await resolveUsername(email);
  }

  return (
    <LandingPageClient
      session={userId ? { user: { id: userId, email: email } } : null}
      savedUsername={username}
    />
  );
}
