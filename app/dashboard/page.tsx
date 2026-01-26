import { auth } from "../../auth";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/"); // Not logged in? Go home.
  }

  // Lookup username
  const uid = session.user.id;
  let username: string | null = null;

  if (process.env.KV_URL) {
    username = await kv.get(`user:${uid}:username`);
  }

  if (username) {
    redirect("/studio");
  } else {
    // Logged in but no username? 
    // This happens if they logged in but the "Claim" process failed or wasn't completed.
    // Send them to setup page to claim one.
    redirect("/setup");
  }

  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="animate-pulse">Redirecting to your studio...</div>
    </div>
  );
}
