-- Eduquack: pastas (assuntos), tópicos da trilha com domínio/pontos fracos e fontes de estudo
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  goal text check (char_length(goal) <= 200),
  tone smallint not null default 0,
  created_at timestamptz not null default now()
);
create index subjects_user_idx on public.subjects (user_id, created_at desc);
alter table public.subjects enable row level security;
create policy "subjects_own" on public.subjects for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  position integer not null default 0,
  status text not null default 'open' check (status in ('open','done')),
  correct integer not null default 0,
  total integer not null default 0,
  weak jsonb not null default '[]'::jsonb,
  last_practiced timestamptz,
  created_at timestamptz not null default now()
);
create index topics_subject_idx on public.topics (subject_id, position);
create index topics_user_idx on public.topics (user_id);
alter table public.topics enable row level security;
create policy "topics_own" on public.topics for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  kind text not null check (kind in ('link','text','pdf')),
  title text not null check (char_length(title) <= 200),
  url text check (char_length(url) <= 1000),
  content text not null check (char_length(content) <= 60000),
  created_at timestamptz not null default now()
);
create index sources_subject_idx on public.sources (subject_id);
alter table public.sources enable row level security;
create policy "sources_own" on public.sources for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter table public.pages add column subject_id uuid references public.subjects(id) on delete set null;
alter table public.flashcard_decks add column subject_id uuid references public.subjects(id) on delete set null;
create index pages_subject_idx on public.pages (subject_id);
create index decks_subject_idx on public.flashcard_decks (subject_id);
