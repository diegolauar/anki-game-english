-- Fase 3, item 7 da checklist de arquitetura: troca consultas em múltiplos
-- passos (buscar ids numa tabela, depois filtrar outra com `.in(...)`, depois
-- juntar em memória no TypeScript) por uma view com o join já feito, resolvida
-- numa única ida ao banco.
--
-- `security_invoker = true` (Postgres 15+): a view roda com o papel de quem
-- chamou, então as RLS policies das tabelas de baixo (conversations, messages,
-- flashcards, card_schedules) continuam valendo normalmente — a view não
-- contorna RLS, só evita o round-trip extra.

-- ============================================================
-- user_messages — mensagens do usuário já com o user_id da conversa e a
-- duração do áudio (quando houver), usada por SupabaseDailyUsageRepository
-- (contagem diária + minutos de voz) e SupabaseRateLimitRepository (limite
-- por minuto).
-- ============================================================

create view user_messages
with (security_invoker = true) as
select
  m.id,
  m.conversation_id,
  c.user_id,
  m.role,
  m.content,
  m.input_mode,
  m.sequence,
  m.created_at,
  st.audio_duration_ms
from messages m
join conversations c on c.id = m.conversation_id
left join speech_transcriptions st on st.message_id = m.id;

grant select on user_messages to authenticated;

-- ============================================================
-- flashcards_with_schedule — flashcards já com o estado do ts-fsrs, usada por
-- CardScheduleRepository.listDueForUser.
-- ============================================================

create view flashcards_with_schedule
with (security_invoker = true) as
select
  f.id,
  f.user_id,
  f.learning_point_id,
  f.source_finding_id,
  f.card_type,
  f.front,
  f.back,
  f.explanation,
  f.status,
  f.created_at,
  f.updated_at,
  cs.due_at,
  cs.stability,
  cs.difficulty,
  cs.reps,
  cs.lapses,
  cs.state,
  cs.last_reviewed_at
from flashcards f
join card_schedules cs on cs.flashcard_id = f.id;

grant select on flashcards_with_schedule to authenticated;
