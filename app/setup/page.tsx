import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "../components/OnboardingFlow";
import { resolveUsername } from "../actions";

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const user = await currentUser();

  if (!user || !user.emailAddresses?.[0]?.emailAddress) {
    redirect("/");
  }

  const email = user.emailAddresses[0].emailAddress.toLowerCase();

  if (!email) {
    return redirect("/");
  }

  const username = await resolveUsername(email);
  if (username) {
    redirect("/studio");
  }

  return (
    <div className="bg-black min-h-screen">
      <OnboardingFlow initialEmail={email} />
    </div>
  );
}
