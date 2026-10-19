-- English Quest — initial schema (CLAUDE.md seção 4)
--
-- Convenção para RLS: tabelas que o usuário escreve diretamente (user_profiles,
-- conversations, messages, flashcards, card_schedules, review_logs) têm policies
-- de insert/update para o próprio dono. Tabelas calculadas pelo backend a partir
-- de IA (analyses, findings, learning_points, xp_events, speech_transcriptions)
-- só têm policy de select para o dono; escrita é feita pelo service role nos
-- casos de uso (src/infrastructure/supabase/service-role-client.ts), que ignora RLS.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function reject_update_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only: % not allowed', tg_table_name, tg_op;
end;
$$;

-- ============================================================
-- user_profiles
-- ============================================================

create table user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  target_level text not null default 'beginner'
    check (target_level in ('beginner', 'intermediate', 'advanced')),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_user_profiles_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();

alter table user_profiles enable row level security;

create policy "user_profiles_select_own" on user_profiles
  for select using (id = auth.uid());

create policy "user_profiles_insert_own" on user_profiles
  for insert with check (id = auth.uid());

create policy "user_profiles_update_own" on user_profiles
  for update using (id = auth.uid());

-- Cria o perfil automaticamente quando um usuário se cadastra (e-mail ou Google).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- topics
-- ============================================================

create table topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category text,
  difficulty text not null
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table topics enable row level security;

create policy "topics_select_active" on topics
  for select to authenticated, anon using (is_active = true);

-- ============================================================
-- conversations
-- ============================================================

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid references topics (id),
  custom_topic text,
  difficulty text not null
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  status text not null default 'active'
    check (status in ('active', 'finished', 'abandoned')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint conversations_topic_or_custom check (
    topic_id is not null or custom_topic is not null
  )
);

create index conversations_user_id_idx on conversations (user_id);

alter table conversations enable row level security;

create policy "conversations_select_own" on conversations
  for select using (user_id = auth.uid());

create policy "conversations_insert_own" on conversations
  for insert with check (user_id = auth.uid());

create policy "conversations_update_own" on conversations
  for update using (user_id = auth.uid());

-- ============================================================
-- messages (append-only)
-- ============================================================

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  input_mode text not null check (input_mode in ('text', 'voice')),
  sequence integer not null,
  client_message_id text not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, sequence),
  unique (conversation_id, client_message_id)
);

create index messages_conversation_id_idx on messages (conversation_id);

create trigger messages_append_only
  before update or delete on messages
  for each row execute function reject_update_delete();

alter table messages enable row level security;

create policy "messages_select_own" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

create policy "messages_insert_own" on messages
  for insert with check (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- speech_transcriptions
-- ============================================================

create table speech_transcriptions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null unique references messages (id) on delete cascade,
  raw_text text not null,
  provider text not null,
  audio_duration_ms integer,
  created_at timestamptz not null default now()
);

alter table speech_transcriptions enable row level security;

create policy "speech_transcriptions_select_own" on speech_transcriptions
  for select using (
    exists (
      select 1 from messages m
      join conversations c on c.id = m.conversation_id
      where m.id = speech_transcriptions.message_id and c.user_id = auth.uid()
    )
  );

create policy "speech_transcriptions_insert_own" on speech_transcriptions
  for insert with check (
    exists (
      select 1 from messages m
      join conversations c on c.id = m.conversation_id
      where m.id = speech_transcriptions.message_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- analyses
-- ============================================================

create table analyses (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0,
  model text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index analyses_conversation_id_idx on analyses (conversation_id);

alter table analyses enable row level security;

create policy "analyses_select_own" on analyses
  for select using (
    exists (
      select 1 from conversations c
      where c.id = analyses.conversation_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- learning_points
-- ============================================================

create table learning_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('error', 'suggestion')),
  category text not null check (category in (
    'grammar.verb_tense', 'grammar.agreement', 'grammar.articles',
    'grammar.prepositions', 'grammar.word_order', 'grammar.sentence_structure',
    'vocabulary.word_choice', 'vocabulary.out_of_context', 'vocabulary.precision',
    'naturalness.unnatural_expression', 'naturalness.literal_translation',
    'naturalness.collocation', 'communication.incomplete', 'communication.ambiguous'
  )),
  rule_key text not null,
  canonical_correction text,
  explanation text,
  occurrence_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, rule_key)
);

alter table learning_points enable row level security;

create policy "learning_points_select_own" on learning_points
  for select using (user_id = auth.uid());

-- ============================================================
-- findings
-- ============================================================

create table findings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses (id) on delete cascade,
  message_id uuid not null references messages (id) on delete cascade,
  learning_point_id uuid references learning_points (id),
  kind text not null check (kind in ('error', 'suggestion')),
  severity text not null check (severity in ('low', 'medium', 'high')),
  category text not null check (category in (
    'grammar.verb_tense', 'grammar.agreement', 'grammar.articles',
    'grammar.prepositions', 'grammar.word_order', 'grammar.sentence_structure',
    'vocabulary.word_choice', 'vocabulary.out_of_context', 'vocabulary.precision',
    'naturalness.unnatural_expression', 'naturalness.literal_translation',
    'naturalness.collocation', 'communication.incomplete', 'communication.ambiguous'
  )),
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  original_text text not null,
  correction text,
  explanation text,
  example text,
  created_at timestamptz not null default now()
);

create index findings_analysis_id_idx on findings (analysis_id);

alter table findings enable row level security;

create policy "findings_select_own" on findings
  for select using (
    exists (
      select 1 from analyses a
      join conversations c on c.id = a.conversation_id
      where a.id = findings.analysis_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- flashcards
-- ============================================================

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  learning_point_id uuid references learning_points (id),
  source_finding_id uuid references findings (id),
  card_type text not null check (card_type in ('production', 'cloze', 'manual')),
  front text not null,
  back text not null,
  explanation text,
  status text not null default 'suggested'
    check (status in ('suggested', 'active', 'suspended', 'discarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index flashcards_user_id_idx on flashcards (user_id);

create trigger set_flashcards_updated_at
  before update on flashcards
  for each row execute function set_updated_at();

alter table flashcards enable row level security;

create policy "flashcards_select_own" on flashcards
  for select using (user_id = auth.uid());

create policy "flashcards_insert_own" on flashcards
  for insert with check (user_id = auth.uid());

create policy "flashcards_update_own" on flashcards
  for update using (user_id = auth.uid());

-- ============================================================
-- card_schedules (1:1 com flashcards; estado do ts-fsrs)
-- ============================================================

create table card_schedules (
  flashcard_id uuid primary key references flashcards (id) on delete cascade,
  due_at timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state text not null default 'new'
    check (state in ('new', 'learning', 'review', 'relearning')),
  last_reviewed_at timestamptz
);

create index card_schedules_due_at_idx on card_schedules (due_at);

alter table card_schedules enable row level security;

create policy "card_schedules_select_own" on card_schedules
  for select using (
    exists (
      select 1 from flashcards f
      where f.id = card_schedules.flashcard_id and f.user_id = auth.uid()
    )
  );

create policy "card_schedules_insert_own" on card_schedules
  for insert with check (
    exists (
      select 1 from flashcards f
      where f.id = card_schedules.flashcard_id and f.user_id = auth.uid()
    )
  );

create policy "card_schedules_update_own" on card_schedules
  for update using (
    exists (
      select 1 from flashcards f
      where f.id = card_schedules.flashcard_id and f.user_id = auth.uid()
    )
  );

-- ============================================================
-- review_logs (append-only)
-- ============================================================

create table review_logs (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references flashcards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  state_before text not null check (state_before in ('new', 'learning', 'review', 'relearning')),
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  reviewed_at timestamptz not null default now()
);

create index review_logs_flashcard_id_idx on review_logs (flashcard_id);

create trigger review_logs_append_only
  before update or delete on review_logs
  for each row execute function reject_update_delete();

alter table review_logs enable row level security;

create policy "review_logs_select_own" on review_logs
  for select using (user_id = auth.uid());

create policy "review_logs_insert_own" on review_logs
  for insert with check (user_id = auth.uid());

-- ============================================================
-- xp_events (append-only)
-- ============================================================

create table xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null check (source_type in (
    'conversation_finished', 'flashcard_saved', 'flashcard_reviewed', 'daily_reviews_completed'
  )),
  source_id text not null,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);

create index xp_events_user_id_idx on xp_events (user_id);

create trigger xp_events_append_only
  before update or delete on xp_events
  for each row execute function reject_update_delete();

alter table xp_events enable row level security;

create policy "xp_events_select_own" on xp_events
  for select using (user_id = auth.uid());
