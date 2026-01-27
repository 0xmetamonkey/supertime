import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { ADMIN_EMAILS } from "../config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const email = session?.user?.email;

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
