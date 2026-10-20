-- Log de consumo de tokens das chamadas reais à API de LLM (conversação e
-- análise), para acompanhar custo/uso. Append-only, como review_logs e
-- xp_events; escrita feita pelo service role (ver comentário no topo da
-- migração inicial sobre o padrão de clientes), leitura liberada ao dono.

create table llm_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('conversation', 'analysis')),
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index llm_usage_logs_user_id_idx on llm_usage_logs (user_id);
create index llm_usage_logs_created_at_idx on llm_usage_logs (created_at);

create trigger llm_usage_logs_append_only
  before update or delete on llm_usage_logs
  for each row execute function reject_update_delete();

alter table llm_usage_logs enable row level security;

create policy "llm_usage_logs_select_own" on llm_usage_logs
  for select using (user_id = auth.uid());
