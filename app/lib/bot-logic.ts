import { askGemini } from './gemini';

/**
 * Supertime AI Bot Logic
 * Analyzes incoming queries and generates responses via Gemini.
 * NOTE: No filesystem access — bot-logic runs on Vercel (Linux).
 */
export async function getBotResponse(query: string): Promise<string> {
  const lowercaseQuery = query.toLowerCase();

  // 1. Initial Greetings
  if (lowercaseQuery.includes('hello') || lowercaseQuery.match(/\bhi\b/)) {
    return "🤖 Beep boop! Hello! I'm the Supertime AI. I'm here to help creators and fans connect. Ask me about how Supertime works, or just say what's on your mind!";
  }

  // 2. Status & Progress
  if (lowercaseQuery.includes('status') || lowercaseQuery.includes('progress') || lowercaseQuery.includes('todo') || lowercaseQuery.includes('roadmap')) {
    return "🚀 Supertime is actively being developed! We're constantly shipping new features for creators — 1:1 calls, live broadcasts, subscriptions, and more. Stay tuned!";
  }

  // 3. Team Info
  if (lowercaseQuery.includes('team') || lowercaseQuery.includes('who is')) {
    return "Our core team is a small, passionate group of builders working to make creator monetization effortless. 🤖";
  }

  // 4. LLM Fallback (Gemini)
  try {
    const systemInstruction = `
      You are Supertime AI, a helpful assistant embedded in the Supertime creator platform.
      Supertime is a Next.js app that lets creators monetize their time through 1:1 video/audio calls,
      live broadcasts, subscriptions, a storefront, and fundraising. Payments are in INR via Razorpay.
      Real-time features are powered by Ably and Agora. Authentication is handled by Clerk.

      You help users understand how the platform works, answer questions about bookings and payments,
      and assist creators with setting up their profiles.
      Keep responses concise, friendly, and use emojis like 🤖, 🚀, ✨ where appropriate.
    `;

    return await askGemini(query, systemInstruction);
  } catch (error) {
    console.error('[Bot Logic] Gemini fallback failed:', error);
    return "I heard my name! 🤖 I'm having a brief brain freeze — try asking me again in a moment, or check out our docs for help!";
  }
}
