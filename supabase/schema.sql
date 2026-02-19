-- ============================================================
-- Channel Agent – Supabase Schema
-- Run this in the Supabase SQL editor to set up your database
-- ============================================================

-- Enable pgvector extension for semantic search (optional, for later)
create extension if not exists vector;

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with app-specific data
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  persona_id text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  persona_id text not null,
  title text not null default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at on message insert
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute procedure update_conversation_timestamp();

-- ============================================================
-- DOCUMENTS (Knowledge Base)
-- ============================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  chunk_count integer default 0,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- DOCUMENT CHUNKS (RAG knowledge base)
-- ============================================================
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  content text not null,
  source text,
  chunk_index integer,
  -- Vector embedding column (1536 dims for OpenAI, 1024 for Voyage/Cohere)
  -- Set to null initially; populate later when embeddings are configured
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Full-text search index on content
create index if not exists document_chunks_content_fts
  on public.document_chunks
  using gin(to_tsvector('english', content));

-- Vector similarity search index (hnsw works on empty tables, unlike ivfflat)
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- VECTOR SIMILARITY SEARCH FUNCTION
-- Called from the RAG retrieval code
-- ============================================================
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  source text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.content,
    dc.source,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.embedding is not null
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Conversations: users see only their own
create policy "Users can manage own conversations" on public.conversations
  for all using (auth.uid() = user_id);

-- Messages: users see messages in their conversations
create policy "Users can view messages in own conversations" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
create policy "Users can insert messages in own conversations" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Documents: all authenticated users can read; only admins can insert
create policy "Authenticated users can view documents" on public.documents
  for select using (auth.role() = 'authenticated');

-- Document chunks: all authenticated users can read
create policy "Authenticated users can view chunks" on public.document_chunks
  for select using (auth.role() = 'authenticated');

-- Note: inserts to documents/chunks use the service role key (admin client)
-- so no insert policy needed for authenticated users
