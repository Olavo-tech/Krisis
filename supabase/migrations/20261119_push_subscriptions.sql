-- Lembretes por notificação (Web Push): inscrições e resumo diário por usuário
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  last_sent timestamptz,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy "push_select_own" on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy "push_delete_own" on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.reminder_summary()
returns table(user_id uuid, tasks_due integer, cards_due integer)
language sql security definer set search_path = '' as $$
  select s.user_id,
    (select count(*)::int from public.tasks t where t.user_id = s.user_id and not t.done and t.due_at is not null and t.due_at < now() + interval '36 hours'),
    (select count(*)::int from public.flashcards f where f.user_id = s.user_id and f.due_at <= now())
  from (select distinct p.user_id from public.push_subscriptions p where p.last_sent is null or p.last_sent < now() - interval '20 hours') s;
$$;
revoke all on function public.reminder_summary() from public, anon, authenticated;
grant execute on function public.reminder_summary() to service_role;
