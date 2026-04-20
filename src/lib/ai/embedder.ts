import { embed } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * Generates vector embeddings for a given string of text.
 * Uses Google's gemini-embedding-001 model (768 dimensions).
 * 
 * @param text The unified text to embed (e.g. summary + content + tags)
 * @param taskType Optional task type ('retrieval_query' or 'retrieval_document')
 * @returns An array of numbers representing the vector embedding
 */
export async function generateTextEmbedding(
  text: string, 
  taskType: 'retrieval_query' | 'retrieval_document' = 'retrieval_query'
): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel('gemini-embedding-001'),
    value: text,
    // @ts-ignore - The AI SDK types might not have caught up to 2026 models yet
    taskType: taskType,
  });

  return embedding;
}
