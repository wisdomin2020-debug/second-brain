import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * Generates a specialized output (blog post, ebook outline, etc.) 
 * based on a captured memory and a specific goal.
 */
export async function generateOutput(
  content: string, 
  type: 'blog' | 'ebook' | 'social_post' | 'outline'
): Promise<string> {
  const systemPrompt = `You are a high-end content strategist and ghostwriter. 
Your goal is to take a raw idea or task from a "Second Brain" and turn it into a polished, professional piece of content.

Style Guidelines:
- Clean, modern, and engaging.
- No fluff.
- Use Markdown for formatting.

Output Type: ${type.toUpperCase()}`;

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    prompt: `Transform the following idea/task into a ${type}:\n\n"${content}"`,
  });

  return text;
}
