import { currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import { resolveUsername } from "../actions";
import { getDetailedWallet } from "../lib/economics";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user || !user.emailAddresses?.[0]?.emailAddress) {
    redirect("/"); // Not logged in? Go home.
  }

  const email = user.emailAddresses[0].emailAddress.toLowerCase();

  // 1. Resolve Username
  const username = await resolveUsername(email);

  // 2. Fetch Wallet Stats
  const { balance, withdrawable } = await getDetailedWallet(email);

  return (
    <DashboardClient
      session={user ? { user: { id: user.id, email: email } } : null}
      username={username}
      initialBalance={balance}
      initialWithdrawable={withdrawable}
    />
  );
}
