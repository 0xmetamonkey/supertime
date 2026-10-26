import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');

  if (!text) {
    return NextResponse.json({ error: 'Text query parameter is required' }, { status: 400 });
  }

  // Clean text and truncate if too long
  const clean = text.replace(/[*_#`~[\]]/g, '').slice(0, 320);

  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      clean
    )}&tl=en&client=tw-ob`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`TTS upstream error: ${res.status}`);
    }

    const audioBuffer = await res.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (err: any) {
    console.error('[TTS Route Error]:', err);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
