import { NextResponse } from 'next/server';
import { generateOutput } from '@/lib/ai/generator';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { memoryId, type, content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Generate the polished draft
    const draft = await generateOutput(content, type || 'social_post');

    // Save it to the documents table
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        title: `Draft for: ${content.substring(0, 30)}...`,
        content: draft,
        type: type || 'other',
        user_id: '00000000-0000-0000-0000-000000000000', // Hardcoded for prototype
      })
      .select()
      .single();

    if (docError) throw docError;

    return NextResponse.json({ success: true, draft, documentId: doc.id });
  } catch (err: any) {
    console.error('Generation Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
