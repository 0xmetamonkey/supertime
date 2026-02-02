import { auth } from "../auth";
import { redirect } from "next/navigation";
import { resolveUsername } from "./actions";
import WaitlistPage from "./waitlist/page";

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

  // Everyone else sees the waitlist
  return <WaitlistPage />;
}
