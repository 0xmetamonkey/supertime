import { auth } from "../auth";
import LandingPageClient from "./LandingPageClient";
import { redirect } from "next/navigation";
import { resolveUsername } from "./actions";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Supertime | World's First Energy Exchange Platform",
  description: "Turn your time into pure art. A mission to make each moment a beautiful asset. High-end video & audio energy exchanges for creators.",
  openGraph: {
    title: "Supertime - The Energy Exchange Platform",
    description: "Exchange your presence for value. Turn your time into art.",
    images: ['/og-image.png'],
  }
};

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const session = await auth();
  let username: string | null = null;
  const email = session?.user?.email;

  if (email) {
    username = await resolveUsername(email);
  }

  // Redirect if logged in AND has username
  if (email && username) {
    redirect("/studio");
  }

  return <LandingPageClient session={session} savedUsername={username} />;
}