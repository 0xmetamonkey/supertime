import { askGemini } from './gemini';

/**
 * Supertime AI Bot Logic
 * Analyzes incoming queries and generates responses based on local project context.
 */
export async function getBotResponse(query: string): Promise<string> {
  const lowercaseQuery = query.toLowerCase();

  // 1. Initial Greetings
  if (lowercaseQuery.includes('hello') || lowercaseQuery.match(/\bhi\b/)) {
    return "🤖 Beep boop! Hello! I'm the Supertime AI. I'm here to track our milestones and keep the team synchronized. Ask me about our 'status' or 'progress'!";
  }

  // 2. Status & Progress (Powered by task.md)
  if (lowercaseQuery.includes('status') || lowercaseQuery.includes('progress') || lowercaseQuery.includes('todo') || lowercaseQuery.includes('roadmap')) {
    return "I'm working on syncing with the latest roadmap! For now, ask me anything about Supertime and I'll do my best to help. 🛠️";
  }

  // 3. Team Info
  if (lowercaseQuery.includes('team') || lowercaseQuery.includes('who is')) {
    return "Our core team consists of 0xmetamonkey, extsystudios, lifeofaman01, and ayinlong. I'm the latest mechanical addition! 🤖";
  }

  // 4. LLM Fallback (Gemini)
  try {
    const systemInstruction = `
      You are Supertime AI, a helpful team assistant for the Supertime project.
      You are part of the team and you help track progress and answer questions about the development.
      The current codebase is a Next.js app with Ably, Agora, Clerk, and Vercel KV.
      Keep responses concise, friendly, and use emojis like 🤖, 🚀, ✨ where appropriate.
    `;

    return await askGemini(query, systemInstruction);
  } catch (error) {
    console.error('[Bot Logic] Gemini fallback failed:', error);
    return "I heard my name! 🤖 Right now I'm having a bit of a brain freeze, but I can usually give you a 'status' update or tell you about the 'team'. What would you like to know?";
  }
}
