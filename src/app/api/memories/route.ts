import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    // Fetch recent items from all three tables concurrently
    const [ideasRes, tasksRes, projectsRes] = await Promise.all([
      supabaseAdmin
        .from('ideas')
        .select('id, content, summary, tags, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('tasks')
        .select('id, title, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('projects')
        .select('id, name, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (ideasRes.error) throw ideasRes.error;
    if (tasksRes.error) throw tasksRes.error;
    if (projectsRes.error) throw projectsRes.error;

    // Normalise into a unified shape and sort by recency
    const memories = [
      ...(ideasRes.data || []).map((i) => ({
        id: i.id,
        text: i.summary || i.content,
        type: 'idea',
        created_at: i.created_at,
      })),
      ...(tasksRes.data || []).map((t) => ({
        id: t.id,
        text: t.title,
        type: 'task',
        created_at: t.created_at,
      })),
      ...(projectsRes.data || []).map((p) => ({
        id: p.id,
        text: p.name,
        type: 'project',
        created_at: p.created_at,
      })),
    ].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const counts = {
      ideas: ideasRes.data?.length ?? 0,
      tasks: tasksRes.data?.length ?? 0,
      projects: projectsRes.data?.length ?? 0,
    };

    return NextResponse.json({ memories: memories.slice(0, 15), counts });
  } catch (err: any) {
    console.error('Memories API Error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
