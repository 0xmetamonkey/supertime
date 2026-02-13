import { auth } from "@/auth";
import { resolveUsername } from "@/app/actions";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ username: null });
  }
  const username = await resolveUsername(session.user.email);
  return NextResponse.json({ username });
}
