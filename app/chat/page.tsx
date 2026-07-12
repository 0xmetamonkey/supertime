import { redirect } from "next/navigation";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const sp = await searchParams;
  const recipient = sp.to;
  if (recipient) {
    redirect(`/dashboard?tab=inbox&to=${encodeURIComponent(recipient)}`);
  } else {
    redirect(`/dashboard?tab=inbox`);
  }
}
