import { Metadata } from 'next';
import { kv } from "@vercel/kv";
import CallRoomClient from './CallRoomClient';

type Props = {
  params: Promise<{ roomId: string }>
}

export const revalidate = 0; // Dynamic route

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { roomId } = await params;

  return {
    title: `Supertime Call | ${roomId}`,
    description: `Join your 1:1 Supertime video call.`,
  };
}

export default async function LiveCallPage({ params }: Props) {
  const { roomId } = await params;

  // Verify this room actually exists in KV to prevent arbitrary room creation
  // If we wanted strictly secured 1:1, we would check the user's session email against the booking owner
  // For now, anyone with the link can join the video room (standard Google Meet behavior)
  const roomLink = await kv.get(`meeting:${roomId}`);

  if (!roomLink && process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black uppercase mb-4">Room Not Found</h1>
        <p className="text-xl font-bold text-zinc-600">This call link is invalid or has expired.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white relative">
      <CallRoomClient roomId={roomId} />
    </div>
  );
}
