-- Krisis: fundação do workspace (perfis/planos, páginas, tarefas, flashcards, editais salvos, cota de IA)
-- Todas as tabelas com RLS. Escritas sensíveis (plano, cota) só via service_role.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ========== PERFIS E PLANO ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  plan text not null default 'free' check (plan in ('free','plus')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- o usuário só pode editar o nome; plano é controlado pelo servidor/gateway
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1) from auth.users on conflict (id) do nothing;

-- ========== COTA DE IA (atômica, por plano) ==========
create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  feature text not null,
  used integer not null default 0,
  primary key (user_id, usage_date, feature)
);
alter table public.ai_usage enable row level security;
create policy "ai_usage_select_own" on public.ai_usage for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.consume_ai_quota(p_user_id uuid, p_feature text, p_free_limit integer, p_plus_limit integer)
returns table(allowed boolean, remaining integer, plan text)
language plpgsql security definer set search_path = '' as $$
declare v_plan text; v_limit integer; v_used integer;
begin
  select case when p.plan = 'plus' and (p.plan_expires_at is null or p.plan_expires_at > now()) then 'plus' else 'free' end
    into v_plan from public.profiles p where p.id = p_user_id;
  v_plan := coalesce(v_plan, 'free');
  v_limit := case when v_plan = 'plus' then p_plus_limit else p_free_limit end;
  if v_limit <= 0 then return query select false, 0, v_plan; return; end if;
  insert into public.ai_usage as u (user_id, usage_date, feature, used)
  values (p_user_id, current_date, p_feature, 1)
  on conflict (user_id, usage_date, feature)
  do update set used = u.used + 1 where u.used < v_limit
  returning u.used into v_used;
  if v_used is null then return query select false, 0, v_plan; return; end if;
  return query select true, v_limit - v_used, v_plan;
end $$;
revoke all on function public.consume_ai_quota(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, text, integer, integer) to service_role;

-- ========== PÁGINAS (estilo Notion) ==========
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id uuid references public.pages(id) on delete cascade,
  kind text not null default 'page' check (kind in ('page','edital','plano','caderno','simulado')),
  title text not null default 'Sem título' check (char_length(title) <= 200),
  icon text,
  content jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pages_user_parent_idx on public.pages (user_id, parent_id, position);
alter table public.pages enable row level security;
create policy "pages_own" on public.pages for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create trigger pages_updated before update on public.pages for each row execute function public.set_updated_at();

-- ========== TAREFAS ==========
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  page_id uuid references public.pages(id) on delete set null,
  title text not null check (char_length(title) <= 300),
  due_at timestamptz,
  priority smallint not null default 1 check (priority between 0 and 2),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index tasks_user_due_idx on public.tasks (user_id, done, due_at);
alter table public.tasks enable row level security;
create policy "tasks_own" on public.tasks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ========== FLASHCARDS (repetição espaçada) ==========
create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 200),
  created_at timestamptz not null default now()
);
alter table public.flashcard_decks enable row level security;
create policy "decks_own" on public.flashcard_decks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null check (char_length(front) <= 2000),
  back text not null check (char_length(back) <= 4000),
  ease real not null default 2.5,
  interval_days integer not null default 0,
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index flashcards_due_idx on public.flashcards (user_id, due_at);
alter table public.flashcards enable row level security;
create policy "cards_own" on public.flashcards for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ========== EDITAIS SALVOS ==========
create table public.editais_salvos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null check (char_length(titulo) <= 300),
  banca_orgao text,
  status text,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);
create index editais_user_idx on public.editais_salvos (user_id, created_at desc);
alter table public.editais_salvos enable row level security;
create policy "editais_own" on public.editais_salvos for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ========== EXCLUSÃO DE CONTA ==========
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
