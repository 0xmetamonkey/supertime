import { Metadata } from 'next';
import TalkTimeClient from './TalkTimeClient';

interface Props {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ host?: string; u?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `TalkTime Session — Supertime`,
    description: `Join a live TalkTime session on Supertime — shared podcast with a real-time writing pad.`,
  };
}

async function getSession(roomId: string) {
  try {
    const { kv } = await import('@vercel/kv');
    const session = await kv.get(`meeting:${roomId}`);
    return session as any;
  } catch {
    // KV unavailable (local dev without env) — render client anyway
    return null;
  }
}

export default async function TalkTimePage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const { host, u } = await searchParams;

  const session = await getSession(roomId);

  // If KV confirmed this is NOT a talktime session (it exists but wrong type), show expired
  // If KV returned null (either expired or local dev without KV), still render client
  if (session !== null && session?.type !== 'talktime') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <p className="text-5xl">⏳</p>
          <h1 className="text-2xl font-bold tracking-tight">This TalkTime has ended</h1>
          <p className="text-muted text-sm">The session either expired or the link is invalid.</p>
          <a href="/" className="inline-block mt-4 px-6 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Back to Supertime
          </a>
        </div>
      </div>
    );
  }

  const creatorUsername = session?.creatorUsername || u || 'host';
  const sessionTitle = session?.title || 'TalkTime';

  return (
    <TalkTimeClient
      roomId={roomId}
      isHost={host === 'true'}
      hostUsername={u || creatorUsername}
      sessionTitle={sessionTitle}
      creatorUsername={creatorUsername}
    />
  );
}
