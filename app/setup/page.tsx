import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { kv } from "@vercel/kv";
import { resolveUsername } from "../actions";

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const { userId, sessionClaims } = await auth();
  let email = (sessionClaims as { email?: string } | undefined)?.email?.toLowerCase();

  // Fallback in case Clerk claim is lagging
  if (userId && !email) {
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    } catch (e) {
      console.error("[Setup Page] Clerk currentUser fallback failed:", e);
    }
  }

  if (!userId || !email) {
    redirect("/");
  }

  const username = await resolveUsername(email);
  if (username) {
    let role: string | null = null;
    if (process.env.KV_URL) {
      role = await kv.get<string>(`user:${email}:role`);
    }
    if (role === 'fan') {
      redirect("/");
    }
    redirect("/dashboard");
  }

  // Redirect to dashboard onboarding gate where user chooses between Creator and Fan
  redirect("/dashboard");
}
