import { auth } from "../auth";
import { kv } from "@vercel/kv";
import LandingPageClient from "./LandingPageClient";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  let username: string | null = null;

  // Use EMAIL as the key (stable identifier)
  const email = session?.user?.email;

  if (email && process.env.KV_URL) {
    try {
      // Check if this email has a username
      username = await kv.get<string>(`email:${email}:username`);
    } catch (error) {
      console.error("KV Error:", error);
    }
  }

  // If logged in AND has username -> go straight to studio
  if (email && username) {
    redirect("/studio");
  }

  return <LandingPageClient session={session} savedUsername={username} />;
}