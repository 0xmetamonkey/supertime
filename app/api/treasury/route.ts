import { NextResponse } from 'next/server';
import { getTreasurySnapshot } from '../../lib/treasury';

export const runtime = 'nodejs';
export const revalidate = 120;

export async function GET() {
  try {
    const snapshot = await getTreasurySnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control':
          'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[treasury] snapshot failed', error);

    return NextResponse.json(
      { error: 'treasury_unavailable' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
