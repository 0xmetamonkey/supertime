import { auth } from "../../auth";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";
import StudioClient from "./StudioClient";

export default async function StudioPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return redirect("/");

  let username = null;
  if (process.env.KV_URL) {
    username = await kv.get<string>(`email:${email}:username`);
  }

  if (!username) return redirect("/"); // Artist needs to claim a username first

  return <StudioClient username={username} session={session} />;
}
