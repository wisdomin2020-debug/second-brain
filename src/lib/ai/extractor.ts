import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// We define the schema for classifying incoming unstructured thoughts
const extractionSchema = z.object({
  classification: z.enum(['idea', 'project', 'task', 'note']).describe('Classify the input into one of our core types.'),
  summary: z.string().describe('A concise summary or title for the input (max 10 words).'),
  tags: z.array(z.string()).describe('An array of relevant tags or keywords (e.g., ["design", "marketing"]).'),
  project_name_reference: z.string().optional().describe('If the input strongly refers to a specific project by name, extract it. Otherwise leave null.'),
  actionable_items: z.array(z.string()).optional().describe('Any distinct actionable items found in the input.'),
  formatted_content: z.string().describe('The user input cleaned up into readable markdown formatting, fixing any obvious voice transcription errors, but keeping the original meaning and tone.')
});

export type ExtractedData = z.infer<typeof extractionSchema>;

/**
 * Extracts structured data from raw unstructured text/voice transcripts.
 * @param rawText The raw input from the user
 */
export async function extractStructuredData(rawText: string): Promise<ExtractedData> {
  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: extractionSchema,
    system: `You are the core intelligence of a "Second Brain" AI Agent for a creative professional. 
Your job is to receive unstructured thoughts, voice transcripts, or raw ideas from the user and format them into structured data.
You must classify the input as:
- 'idea': A general thought, philosophy, or potential future project.
- 'project': A larger endeavor with multiple steps.
- 'task': A specific, actionable item that needs to be done.
- 'note': Random thoughts or facts that don't fit the others.

Fix any obvious speech-to-text typos in the formatted_content, but DO NOT change the user's intended vibe or tone.`,
    prompt: `Here is the user's input:\n\n"""\n${rawText}\n"""\n\nPlease structure this information.`,
  });

  return object;
}
