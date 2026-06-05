import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file, 'audio.webm'); 
    groqFormData.append('model', 'whisper-large-v3');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData as any,
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    const rawTranscript = data.text;

    // AI Smart Wrapping using Gemini
    let title = 'Studio Recording';
    let summary = rawTranscript ? rawTranscript.slice(0, 100) + '...' : 'No transcription available.';

    if (rawTranscript && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are an AI assistant helping a creator. Here is a transcript of their recent voice note:
"${rawTranscript}"
Please return a JSON object with two keys:
- "title": A short, punchy 3-6 word title.
- "summary": A concise 1-2 sentence summary of the key points.
Return ONLY valid JSON format, nothing else.`;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title) title = parsed.title;
          if (parsed.summary) summary = parsed.summary;
        }
      } catch (geminiError) {
        console.error("Gemini smart wrapping failed:", geminiError);
      }
    }

    return NextResponse.json({ 
      transcript: rawTranscript,
      title,
      summary 
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
