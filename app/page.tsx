import { auth } from "../auth";
import { kv } from "@vercel/kv";
import LandingPageClient from "./LandingPageClient";
import { redirect } from "next/navigation";
import { resolveUsername } from "./actions";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const session = await auth();
  let username: string | null = null;
  const email = session?.user?.email;

  console.log(`[LandingPage] Processing request for: ${email || 'Anonymous'}`);

  if (email) {
    username = await resolveUsername(email);
    console.log(`[LandingPage] Resolved username: ${username || 'NULL'}`);
  }

  // Redirect if logged in AND has username
  if (email && username) {
    console.log(`[LandingPage] Redirecting to /studio`);
    redirect("/studio");
  }

  return <LandingPageClient session={session} savedUsername={username} />;
}