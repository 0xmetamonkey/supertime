import { auth } from "../auth";
import { kv } from "@vercel/kv";
import LandingPageClient from "./LandingPageClient";
import { redirect } from "next/navigation";
import { resolveUsername } from "./actions";

export default async function LandingPage() {
  const session = await auth();
  let username: string | null = null;
  const email = session?.user?.email;

  console.log(`[LandingPage] Processing request for email: ${email || 'NONE'}`);

  if (email) {
    username = await resolveUsername(email);
    console.log(`[LandingPage] Resolved username: ${username || 'NULL'}`);
  }

  // Redirect all logged-in users to studio
  if (email) {
    console.log(`[LandingPage] Redirecting to /studio`);
    redirect("/studio");
  }

  return <LandingPageClient session={session} savedUsername={username} />;
}