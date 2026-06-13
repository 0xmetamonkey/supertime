import fs from 'fs';
import path from 'path';
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
    try {
      // Note: In a real production app, we'd store task state in KV/DB. 
      // For this agentic workflow, reading the task.md is the most accurate source of truth.
      const brainDir = 'C:/Users/journ/.gemini/antigravity/brain/a768be75-8456-4f9b-834a-383cdf6502d2';
      const taskPath = path.join(brainDir, 'task.md');

      if (!fs.existsSync(taskPath)) {
        return "I'm having trouble finding the project roadmap right now, but I know we're working hard on the Chat and AI features! 🛠️";
      }

      const content = fs.readFileSync(taskPath, 'utf8');
      const lines = content.split('\n');

      const completedCount = lines.filter(l => l.trim().startsWith('- [x]')).length;
      const totalCount = lines.filter(l => l.trim().match(/- \[[ x/]\]/)).length;
      const inProgress = lines
        .filter(l => l.trim().startsWith('- [/]'))
        .map(l => l.replace(/- \[\/\]/g, '').trim());

      const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      let response = `✨ **Supertime Status Report**:\n`;
      response += `We are **${percent}%** through the current roadmap (${completedCount}/${totalCount} milestones reached).\n\n`;

      if (inProgress.length > 0) {
        response += `🛠️ **Active Work**:\n${inProgress.map(task => `- ${task}`).join('\n')}\n\n`;
      }

      response += "LFG! 🚀";
      return response;
    } catch (error) {
      console.error('[Bot Logic] Error reading task.md:', error);
      return "I encountered an error sync-ing with the roadmap, but I'm still here to help! 🤖";
    }
  }

  // 3. Team Info
  if (lowercaseQuery.includes('team') || lowercaseQuery.includes('who is')) {
    return "Our core team consists of 0xmetamonkey, extsystudios, lifeofaman01, and ayinlong. I'm the latest mechanical addition! 🤖";
  }

  // 4. LLM Fallback (Gemini)
  try {
    const brainDir = 'C:/Users/journ/.gemini/antigravity/brain/a768be75-8456-4f9b-834a-383cdf6502d2';
    const taskPath = path.join(brainDir, 'task.md');
    let context = "Project roadmap (task.md) not available.";
    if (fs.existsSync(taskPath)) {
      context = fs.readFileSync(taskPath, 'utf8');
    }

    const systemInstruction = `
      You are Supertime AI, a helpful team assistant for the Supertime project. 
      You are part of the team and you help track progress and answer questions about the development.
      The current codebase is a Next.js app with Ably, Agora, Clerk, and Vercel KV.
      
      You have access to the current project roadmap below. 
      Use it to answer questions about what's done, what's next, and current status.
      Keep responses concise, friendly, and use emojis like 🤖, 🚀, ✨ where appropriate.
      
      Current Project Roadmap (task.md):
      ${context}
    `;

    return await askGemini(query, systemInstruction);
  } catch (error) {
    console.error('[Bot Logic] Gemini fallback failed:', error);
    return "I heard my name! 🤖 Right now I'm having a bit of a brain freeze, but I can usually give you a 'status' update or tell you about the 'team'. What would you like to know?";
  }
}
