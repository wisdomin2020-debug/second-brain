import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { generateTextEmbedding } from '@/lib/ai/embedder';
import { supabaseAdmin } from '@/lib/supabase';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, user_id } = await req.json();

    // Fall back to the prototype user ID if none provided
    const userId = user_id || '00000000-0000-0000-0000-000000000000';

    // Get the user's latest query
    const latestMessage = messages[messages.length - 1];
    
    // In newer AI SDK versions, content might be in 'parts'
    let userQuery = latestMessage.content || '';
    if (!userQuery && latestMessage.parts) {
      userQuery = latestMessage.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n');
    }

    // Step 1: Generate an embedding for the user's query
    const queryEmbedding = await generateTextEmbedding(userQuery);

    // Step 2: Semantic Search (RAG) against Supabase
    // match_threshold: 0.5 (adjustable depending on how strict you want matches to be)
    // match_count: 5 (limit context to top 5 most relevant items)
    const { data: documents, error } = await supabaseAdmin.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
      p_user_id: userId,
    });

    if (error) {
      console.error("Vector search error:", error);
      throw error;
    }

    // Step 3: Format the context for the LLM
    let contextString = '';
    if (documents && documents.length > 0) {
      contextString = "Here is some context from the user's Second Brain memory:\n\n";
      documents.forEach((doc: any, index: number) => {
        contextString += `[Memory ${index + 1}] (Type: ${doc.reference_type}):\n${doc.content}\n\n`;
      });
    }

    // Wrap the context in a system message
    const systemPrompt = `You are an AI "Second Brain" and execution partner. 
You help the user recall their ideas, organize projects, and generate new content based on their past thoughts.
Always use the provided context from their memory to give accurate, personalized answers.
If they ask you to write something (like a blog or ebook) based on a project, use the memory context to outline and draft it.
If no context is relevant, just act as a helpful thinking partner.

${contextString}`;

    // Step 4: Stream the LLM Output
    // Safety: Transform messages to ensure they match the CoreMessage format expected by streamText
    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || (m.parts ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n') : '')
    }));

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: formattedMessages,
    });

    // Using toTextStreamResponse for maximum compatibility with Next.js 16 build worker
    return result.toTextStreamResponse();
  } catch (err: any) {
    console.error("Chat API Error:", err);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
