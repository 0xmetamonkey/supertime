import { NextRequest, NextResponse } from 'next/server';
import { resolveSTName } from '@/app/lib/protocol';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || searchParams.get('stName');
    const network = searchParams.get('network') || searchParams.get('chain');

    if (!name) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Query parameter "name" (e.g. "aman.st") is required.' },
        { status: 400 }
      );
    }
    if (!network) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Query parameter "network" (e.g. "base", "ethereum", "polygon") is required.' },
        { status: 400 }
      );
    }

    const result = await resolveSTName(name, network);

    if (!result.success) {
      const statusCode =
        result.error === 'INVALID_NAME' ? 400 :
        result.error === 'UNSUPPORTED_NETWORK' ? 400 :
        result.error === 'NAME_NOT_FOUND' ? 404 :
        result.error === 'NO_WALLET_FOR_NETWORK' ? 404 : 500;

      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
          supportedNetworks: result.supportedNetworks,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        resolution: result.resolution,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/st/resolve] Error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: error.message || 'Resolution failed' }, { status: 500 });
  }
}
