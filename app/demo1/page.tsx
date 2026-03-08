import { currentUser } from "@clerk/nextjs/server";
import LandingPageClient from "./LandingPageClientV1";

export default async function Demo1Page() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  return <LandingPageClient session={user ? { user: { id: user.id, email } } : null} savedUsername={null} />;
}
