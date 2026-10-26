import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file, 'speech.webm');
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('temperature', '0.0');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: groqFormData as any,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[Groq STT Error]:', errText);
      return NextResponse.json({ error: 'Failed to transcribe' }, { status: 500 });
    }

    const data = await groqRes.json();
    return NextResponse.json({ transcript: data.text || '' });
  } catch (err: any) {
    console.error('[STT Route Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
