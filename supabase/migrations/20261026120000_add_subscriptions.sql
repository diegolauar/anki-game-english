-- Fluency Mind — assinatura (Fase 7, CLAUDE.md seção 10).
--
-- `subscriptions`: 1:1 com o usuário, espelha o estado da assinatura no Stripe.
-- `stripe_webhook_events`: log append-only só para deduplicar reentregas de
-- webhook (o Stripe pode enviar o mesmo evento mais de uma vez).
--
-- Escrita em ambas é feita só pela service_role (checkout e webhook handler em
-- src/infrastructure/stripe), nunca pelo cliente autenticado — por isso só há
-- policy de SELECT em subscriptions, e nenhuma em stripe_webhook_events.

-- ============================================================
-- subscriptions
-- ============================================================

create table subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'incomplete'
    check (status in ('incomplete', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

alter table subscriptions enable row level security;

create policy "subscriptions_select_own" on subscriptions
  for select using (user_id = auth.uid());

-- ============================================================
-- stripe_webhook_events (append-only)
-- ============================================================

create table stripe_webhook_events (
  id text primary key, -- event id do Stripe (evt_...)
  type text not null,
  processed_at timestamptz not null default now()
);

create trigger stripe_webhook_events_append_only
  before update or delete on stripe_webhook_events
  for each row execute function reject_update_delete();

alter table stripe_webhook_events enable row level security;
