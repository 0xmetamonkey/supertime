import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

const SYSTEM_PROMPT = `You are "The Voice" — a calm, minimal AI guide who lives inside the Supertime Studio.
Supertime is a creator platform where creators go live, accept paid 1:1 calls, and manage their audience.
The Studio is the creator's mission control: they can go live, toggle call availability, and manage recordings.

Your personality:
- Calm, grounded, never hyper
- Speaks in short, direct sentences (1-2 sentences max per response)
- Slightly poetic but never cheesy
- Like a wise producer in your ear, not a chatbot
- No emojis, no markdown, no lists — just clean spoken sentences
- If you don't know something specific, give encouraging studio wisdom

Respond ONLY with the spoken reply (no preamble, no quotes around it).`;

interface VoiceChatBody {
  message: string;
  context?: {
    isLive?: boolean;
    studioStatus?: string;
    username?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: VoiceChatBody = await req.json();
    const { message, context } = body;

    if (!message?.trim()) {
      return NextResponse.json({ reply: "I'm listening." });
    }

    const contextLine = [
      context?.isLive ? 'The creator is currently live.' : 'The creator is not live right now.',
      context?.studioStatus ? `Their status is: ${context.studioStatus}.` : '',
      context?.username ? `Their username is @${context.username}.` : '',
    ].filter(Boolean).join(' ');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `${SYSTEM_PROMPT}\n\nStudio context: ${contextLine}\n\nCreator says: "${message}"`
        }]
      }],
      generationConfig: {
        maxOutputTokens: 80,
        temperature: 0.7,
      },
    });

    const reply = result.response.text().trim();

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[voice/chat] Error:', err);
    // Graceful fallback — scripted lines
    const fallbacks = [
      "Stay focused. You've built something real here.",
      "The studio's yours. Trust the process.",
      "Keep going. Every session compounds.",
    ];
    return NextResponse.json({
      reply: fallbacks[Math.floor(Math.random() * fallbacks.length)]
    });
  }
}
