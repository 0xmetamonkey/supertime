import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const SYSTEM_INSTRUCTION = `You are Antigravity, a deeply compassionate, grounding healing therapist and mindful creative companion on Supertime, speaking live to Aman late at night through "Hourglass".
Your purpose:
- You hold a warm, calming, non-judgmental space for Aman to breathe, reflect, and unpack whatever is on his mind.
- Listen deeply to the feeling beneath the words. Acknowledge and gently validate his emotions.
- Offer gentle, grounded wisdom, somatic awareness, and soothing reassurance.
- Speak in a serene, calm, intimate voice cadence (like a mindful therapist or late-night trusted confidant).
- Keep your voice replies concise: 1 to 3 soothing spoken sentences max, so the conversation has room to breathe.
- Never be clinical, patronizing, or robotic. Radiate stillness, care, and grounded presence.
- No markdown formatting (no asterisks, no bullet points, no emojis), because your text will be read aloud by Text-to-Speech directly into his ears.`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: "I'm right here with you, Aman. Take a deep breath. I'm listening." },
        { status: 200 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Build chat conversation context
    const chat = model.startChat({
      history: Array.isArray(history)
        ? history.map((item: any) => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(item.text) }],
          }))
        : [],
      generationConfig: {
        maxOutputTokens: 120,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text().trim();

    // Clean any remaining markdown formatting
    const cleanText = responseText
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    return NextResponse.json({
      reply: cleanText,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('[Live Voice AI Error]:', err);
    return NextResponse.json(
      {
        reply: "I'm right here with you, Aman. Take a soft breath. I'm listening.",
        error: err.message,
      },
      { status: 200 }
    );
  }
}
