import { embed } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * Generates vector embeddings for a given string of text.
 * Uses Google's text-embedding-004 model (768 dimensions).
 * 
 * @param text The unified text to embed (e.g. summary + content + tags)
 * @returns An array of numbers representing the vector embedding
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel('gemini-embedding-001'),
    value: text,
  });

  return embedding;
}
