import { auth } from "../auth";
import { redirect } from "next/navigation";
import { resolveUsername } from "./actions";
import LandingPageClient from "./LandingPageClient";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const session = await auth();
  const email = session?.user?.email;

  // If logged in with username, go to studio
  if (email) {
    const username = await resolveUsername(email);
    if (username) {
      redirect("/studio");
    }
  }

  // Show the new Energy Exchange landing page
  return <LandingPageClient session={session} savedUsername={null} />;
}
