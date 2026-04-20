-- Enable the pgvector extension for similarity search
create extension if not exists vector;

-- Users table (optional, but good for extending later. Often maps directly to auth.users in Supabase)
create table if not exists users (
  id uuid not null primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ideas table (for unstructured thoughts)
create table ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  content text not null,
  summary text,
  tags text[],
  project_id uuid references projects on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  project_id uuid references projects on delete cascade,
  title text not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents table (Outputs: Blogs, Ebooks, etc.)
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  project_id uuid references projects on delete set null,
  title text not null,
  content text not null,
  type text check (type in ('ebook', 'blog', 'notes', 'other')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Embeddings table (Stores all our semantic memory)
create table embeddings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  reference_id uuid not null, -- Can point to an idea, project, or document
  reference_type text not null check (reference_type in ('idea', 'project', 'document')),
  content text not null, -- The original text that was embedded (useful for RAG injection)
  embedding vector(3072), -- 768 is standard for Google text-embedding-004
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Match Embeddings Database Function (RAG Similarity Search)
create or replace function match_embeddings (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  reference_id uuid,
  reference_type text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    embeddings.id,
    embeddings.reference_id,
    embeddings.reference_type,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where embeddings.user_id = p_user_id
  and 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by embeddings.embedding <=> query_embedding
  limit match_count;
$$;

-- RLS (Row Level Security) Configuration
alter table users enable row level security;
alter table projects enable row level security;
alter table ideas enable row level security;
alter table tasks enable row level security;
alter table documents enable row level security;
alter table embeddings enable row level security;

-- Policies (Ensure users can only see their own data)
create policy "Users can view their own profile" on users for select using (auth.uid() = id);
create policy "Users can update their own profile" on users for update using (auth.uid() = id);

create policy "Users can manage their projects" on projects for all using (auth.uid() = user_id);
create policy "Users can manage their ideas" on ideas for all using (auth.uid() = user_id);
create policy "Users can manage their tasks" on tasks for all using (auth.uid() = user_id);
create policy "Users can manage their documents" on documents for all using (auth.uid() = user_id);
create policy "Users can manage their embeddings" on embeddings for all using (auth.uid() = user_id);
