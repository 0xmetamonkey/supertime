import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveUsername } from "./actions";
import LandingPageClient from "./LandingPageClient";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  // If logged in with username, go to studio
  if (email) {
    const username = await resolveUsername(email);
    if (username) {
      redirect("/studio");
    }
  }

  // Show the new Energy Exchange landing page
  return <LandingPageClient session={user ? { user: { id: user.id, email: email } } : null} savedUsername={null} />;
}
