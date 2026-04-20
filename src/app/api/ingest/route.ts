import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/audio/transcribe';
import { extractStructuredData } from '@/lib/ai/extractor';
import { generateTextEmbedding } from '@/lib/ai/embedder';
import { supabaseAdmin } from '@/lib/supabase'; // Using admin to bypass RLS for inserts if no auth token is passed, or standard supabase.

export async function POST(request: Request) {
  try {
    console.log("POST /api/ingest hit");
    // We expect multipart/form-data. It could have an 'audio' file or 'text' field.
    const formData = await request.formData();
    console.log("FormData received", Array.from(formData.keys()));
    
    // Simplification for prototype: Using a hardcoded user_id if auth is not yet set up
    // In production, we'd extract the user from the session token.
    const userId = formData.get('user_id') as string || null;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    let rawInputText = '';

    const audioFile = formData.get('audio') as File | null;
    const textInput = formData.get('text') as string | null;

    if (audioFile) {
      // Convert browser File to Buffer
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Step 1: Transcribe via Deepgram
      rawInputText = await transcribeAudio(buffer, audioFile.type);
    } else if (textInput) {
      rawInputText = textInput;
    } else {
      return NextResponse.json({ error: 'Either audio or text is required' }, { status: 400 });
    }

    if (!rawInputText.trim()) {
      return NextResponse.json({ error: 'Input was empty or could not be transcribed' }, { status: 400 });
    }

    // Step 2: Extract & Classify via LLM
    const structuredData = await extractStructuredData(rawInputText);

    // Step 3: Insert into the correct Supabase table based on classification
    let referenceId: string | null = null;
    let referenceType = structuredData.classification;

    if (structuredData.classification === 'idea' || structuredData.classification === 'note') {
      const { data, error } = await supabaseAdmin.from('ideas').insert({
        user_id: userId,
        content: structuredData.formatted_content,
        summary: structuredData.summary,
        tags: structuredData.tags,
      }).select('id').single();

      if (error) throw error;
      referenceId = data.id;
      referenceType = 'idea';
    } else if (structuredData.classification === 'task') {
      const { data, error } = await supabaseAdmin.from('tasks').insert({
        user_id: userId,
        title: structuredData.summary,
        status: 'pending'
      }).select('id').single();

      if (error) throw error;
      referenceId = data.id;
    } else if (structuredData.classification === 'project') {
      const { data, error } = await supabaseAdmin.from('projects').insert({
        user_id: userId,
        name: structuredData.summary,
        description: structuredData.formatted_content,
      }).select('id').single();

      if (error) throw error;
      referenceId = data.id;
    }

    // Step 4: Generate Embeddings and Save
    if (referenceId) {
      // A unified string containing all context for the vector
      const embedText = `Title: ${structuredData.summary}\nType: ${structuredData.classification}\nTags: ${structuredData.tags.join(', ')}\nContent: ${structuredData.formatted_content}`;
      
      const embedding = await generateTextEmbedding(embedText, 'retrieval_document');

      const { error: embedError } = await supabaseAdmin.from('embeddings').insert({
        user_id: userId,
        reference_id: referenceId,
        reference_type: referenceType,
        content: embedText,
        embedding: embedding
      });

      if (embedError) throw embedError;
    }

    return NextResponse.json({ 
      success: true, 
      classification: structuredData.classification,
      summary: structuredData.summary,
      raw_text: rawInputText
    });

  } catch (err: any) {
    console.error("Ingestion Pipeline Error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
