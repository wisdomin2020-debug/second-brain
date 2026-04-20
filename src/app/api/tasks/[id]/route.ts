import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const taskId = params.id;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, task: data });
  } catch (err: any) {
    console.error('Task Update Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
