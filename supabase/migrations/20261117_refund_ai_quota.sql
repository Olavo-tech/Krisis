-- Devolve 1 uso de IA quando a análise falha por problema do serviço (não do usuário)
create or replace function public.refund_ai_quota(p_user_id uuid, p_feature text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.ai_usage
     set used = greatest(used - 1, 0)
   where user_id = p_user_id and usage_date = current_date and feature = p_feature;
end $$;
revoke all on function public.refund_ai_quota(uuid, text) from public, anon, authenticated;
grant execute on function public.refund_ai_quota(uuid, text) to service_role;
