import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ADMIN_EMAILS } from "../config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (!email) {
    console.log("[Admin] No user email found - Redirecting to /");
    redirect("/");
  }

  const normalizedEmail = email.toLowerCase();

  if (!ADMIN_EMAILS.includes(normalizedEmail)) {
    console.log(`[Admin] Unauthorized access attempt by ${normalizedEmail}`);
    redirect("/");
  }

  return <>{children}</>;
}
