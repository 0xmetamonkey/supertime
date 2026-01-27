import { auth } from "../auth";
import { kv } from "@vercel/kv";
import LandingPageClient from "./LandingPageClient";
import { redirect } from "next/navigation";
import { resolveUsername } from "./actions";

export default async function LandingPage() {
  const session = await auth();
  let username: string | null = null;
  const email = session?.user?.email;

  if (email) {
    username = await resolveUsername(email);
  }

  // If logged in AND has username -> go straight to studio
  if (email && username) {
    redirect("/studio");
  }

  return <LandingPageClient session={session} savedUsername={username} />;
}