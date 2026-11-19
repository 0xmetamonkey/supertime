import { NextResponse } from 'next/server';
import { getSupportedSTNetworks } from '@/app/lib/protocol';

export async function GET() {
  const networks = getSupportedSTNetworks();
  return NextResponse.json(
    {
      success: true,
      networks,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
