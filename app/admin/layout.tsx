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

  if (!email || !ADMIN_EMAILS.includes(email)) {
    redirect("/");
  }

  return <>{children}</>;
}
