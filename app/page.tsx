import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveUsername, getFeaturedCreators } from "./actions";
import LandingPageClient from "./LandingPageClient";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const { userId, sessionClaims } = await auth();
  let email = (sessionClaims as any)?.email;

  // Fallback in case Clerk claim is lagging
  if (userId && !email) {
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress;
    } catch (e) {
      console.error("[Landing Page] Clerk currentUser fallback failed:", e);
    }
  }

  // If logged in with username, go to studio
  if (email) {
    const username = await resolveUsername(email);
    if (username) {
      redirect("/studio");
    }
  }

  const realCreators = await getFeaturedCreators();

  // Show the new Energy Exchange landing page
  return <LandingPageClient session={userId ? { user: { id: userId, email: email } } : null} savedUsername={null} featuredCreators={realCreators} />;
}

