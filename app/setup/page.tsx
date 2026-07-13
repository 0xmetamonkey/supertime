import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "../components/OnboardingFlow";
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
    redirect("/dashboard");
  }

  return (
    <div className="bg-black min-h-screen">
      <OnboardingFlow initialEmail={email} />
    </div>
  );
}
