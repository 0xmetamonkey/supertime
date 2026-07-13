import { kv } from '@vercel/kv';
import { Metadata } from 'next';
import FundraiserClient from './FundraiserClient';

interface FundraiserData {
  title: string;
  story: string;
  videoUrl?: string;
  imageUrl?: string;
  goal: number;
  raised: number;
  isActive: boolean;
}

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const fundraiser = (process.env.KV_URL ? await kv.get(`fundraise:${username.toLowerCase()}`) : null) as FundraiserData | null;
  const title = fundraiser?.title || `Support ${username}`;
  const desc = fundraiser?.story?.slice(0, 160) || `Help ${username} — donate on Supertime`;

  return {
    title: `${title} | Supertime`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: fundraiser?.imageUrl ? [fundraiser.imageUrl] : [],
    },
  };
}

export default async function FundraisePage({ params }: Props) {
  const { username } = await params;
  const lowerUsername = username.toLowerCase();

  let fundraiser: FundraiserData | null = null;
  let supporters: Array<Record<string, unknown>> = [];
  let profileImage = '';

  if (process.env.KV_URL) {
    fundraiser = await kv.get(`fundraise:${lowerUsername}`) as FundraiserData | null;
    supporters = (await kv.get(`fundraise:${lowerUsername}:supporters`)) as Array<Record<string, unknown>> || [];
    const ownerEmail: string | null = await kv.get(`owner:${lowerUsername}`);
    if (ownerEmail) {
      profileImage = (await kv.get(`user:${ownerEmail}:profileImage`)) as string || '';
    }
  }

  if (!fundraiser || !fundraiser.isActive) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-neo-yellow border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-8 rotate-3">
            <span className="text-4xl">💛</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">No Active Fundraiser</h1>
          <p className="text-lg font-bold text-zinc-500 uppercase mb-8">
            <span className="text-neo-pink italic">@{username}</span> hasn&apos;t started a fundraiser yet.
          </p>
          <a href={`/${username}`} className="neo-btn bg-black text-white px-10 py-5 text-lg inline-block">
            Visit Profile →
          </a>
        </div>
      </div>
    );
  }

  return (
    <FundraiserClient
      username={lowerUsername}
      fundraiser={fundraiser}
      supporters={supporters}
      profileImage={profileImage}
    />
  );
}
