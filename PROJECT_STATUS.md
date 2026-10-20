# English Quest — status do projeto

> Documento gerado para dar contexto completo a outra IA (ou a outro desenvolvedor) sobre o estado real do código. A fonte de verdade das regras de negócio e do escopo do MVP é `CLAUDE.md` (não versionado no git de propósito) — este arquivo descreve **o que já foi construído**, não o que deveria ser construído.

## 1. O produto

Web app para brasileiros praticarem inglês conversando livremente com uma IA. Durante a conversa não há correções. Ao finalizar, um segundo agente de IA analisa a transcrição, destaca erros/sugestões, explica em português, e sugere flashcards. O mesmo erro gramatical em conversas diferentes atualiza o mesmo "ponto de aprendizado" em vez de gerar cartões duplicados. Repetição espaçada via FSRS (mesmo algoritmo do Anki moderno).

Ciclo central: **conversar → analisar → entender a correção → revisar flashcards → aplicar em novas conversas.**

- Interface e explicações: português do Brasil. Conversa: inglês.
- Plataforma: web (Next.js). Sem app mobile ainda.

## 2. Stack

| Camada | Tecnologia | Versão/observação |
|---|---|---|
| Linguagem | TypeScript | `strict: true` |
| Framework | Next.js | 16.4.2, App Router, Turbopack |
| UI | Tailwind CSS v4 + shadcn/ui | componentes em `src/components/ui`, construídos sobre `@base-ui/react` (não Radix) |
| Banco | Supabase (Postgres) | **local via Docker** (`supabase start`); nenhum projeto na nuvem configurado ainda |
| Auth | Supabase Auth | magic link (funcional); Google OAuth implementado no código mas **desabilitado** (sem credenciais) |
| Validação | Zod | em toda entrada externa (forms, respostas de IA) |
| LLM | OpenAI (`openai` SDK) | `gpt-4o-mini` para conversação e para análise (configurável via env) |
| Speech-to-Text | OpenAI Whisper (`whisper-1`) | sem `prompt`, de propósito (evita que o modelo "corrija" a gramática do usuário) |
| Repetição espaçada | `ts-fsrs` | `enable_short_term: false` (ver seção 7) |
| Testes unitários | Vitest | 78 testes, `tests/**/*.test.ts` |
| Testes e2e | Playwright | 2 testes, `e2e/**/*.spec.ts`, rodam contra build de produção (não `next dev` — ver seção 8) |
| Deploy | Vercel | projeto criado, **mas sem variáveis de ambiente configuradas** — o deploy publicado não funciona de verdade ainda |
| Pacotes | npm | |

## 3. Arquitetura

Clean Architecture pragmática, sem abstração além do necessário.

```
src/
  domain/
    entities/       Conversation, Message, Analysis, Finding, LearningPoint,
                     Flashcard, CardSchedule, ReviewLog, XpEvent, LlmUsageLog,
                     SpeechTranscription, Topic, UserProfile
    value-objects/   Difficulty, MessageRole, InputMode, ConversationStatus,
                     FindingKind, FindingCategory, Severity, AnalysisStatus,
                     CardType, FlashcardStatus, Rating, CardState,
                     XpSourceType, LlmUsageSource
    rules/           xp-rewards, calculate-streak, daily-limits,
                     validate-finding-offset
    ports/           13 interfaces (ver seção 5)
  application/
    use-cases/       13 casos de uso (ver seção 4)
  infrastructure/
    supabase/        13 repositórios + 3 clientes (browser/server/service-role)
    llm/             2 adaptadores OpenAI + prompts + schema Zod + mapper
    stt/             1 adaptador OpenAI Whisper
    scheduler/       1 adaptador ts-fsrs
  app/               rotas Next.js (páginas finas, só chamam casos de uso)
  components/        componentes de UI (shadcn + componentes próprios)
supabase/
  migrations/        3 migrações SQL
e2e/                 testes Playwright (fora de src/, não roda com Vitest)
tests/               testes Vitest
```

Regra de dependência mantida à risca: `domain` não importa nada de fora; `application` só depende de `domain`; `infrastructure` implementa os ports; `app` só monta dependências e chama casos de uso (nenhuma regra de negócio em página/rota).

### Padrão importante: dois clientes Supabase, por tabela

Isso **não** é óbvio só de olhar o schema, e já causou um bug real (corrigido):

- **Cliente da sessão** (`createSupabaseServerClient()`, respeita RLS): usado para tabelas onde o usuário é o autor direto da escrita — `conversations`, `messages`, `flashcards`, `card_schedules`, `review_logs`, `speech_transcriptions`, `user_profiles`. RLS é o mecanismo de segurança real aqui.
- **Cliente service role** (`createSupabaseServiceRoleClient()`, ignora RLS): usado para tabelas calculadas pelo backend a partir da IA — `analyses`, `findings`, `learning_points`, `xp_events`, `llm_usage_logs`. Essas tabelas só têm policy de **SELECT** para o dono; não existe policy de INSERT para o usuário autenticado, de propósito. A autorização acontece uma vez, na camada de `app/*/actions.ts` (confere que `conversation.userId === user.id` usando o cliente da sessão), e o processamento interno (`AnalyzeConversation`, `FinishConversation`, `AwardXp`) já roda confiando nesse contexto validado.

Esse padrão só ficou 100% claro quando o primeiro teste e2e real (login real → conversa real → finalizar) bateu num erro `42501 new row violates row-level security policy` — todo teste manual anterior usava o service role direto num script Node, pulando esse caminho de código.

## 4. Casos de uso implementados (`src/application/use-cases/`)

| Caso de uso | Resumo |
|---|---|
| `StartConversation` | cria conversa (valida tema predefinido ou customizado) |
| `SendMessage` | idempotente por `client_message_id`; aplica limite diário de mensagens/voz; persiste `speech_transcriptions` quando a mensagem veio de voz; chama o agente de conversação |
| `FinishConversation` | marca conversa `finished`, cria `analyses` (pending), premia XP se ≥4 mensagens do usuário |
| `AnalyzeConversation` | chama o agente de análise; valida/relocaliza offsets; resolve recorrência via `learning_points`; cria `findings`; cria flashcard sugerido se ainda não houver um ativo para aquele `learning_point` |
| `SaveFlashcardSuggestion(s)` | ativa sugestão (com edição opcional), cria `card_schedules` inicial, premia XP |
| `DiscardFlashcardSuggestion` | marca sugestão como descartada |
| `CreateManualFlashcard` | cria cartão já ativo, premia XP |
| `EditFlashcard` / `ToggleFlashcardSuspension` | edição de conteúdo e suspensão/reativação |
| `ReviewFlashcard` | aplica o rating no `ts-fsrs`, grava `review_logs`, premia XP por revisão + bônus quando a fila do dia esvazia |
| `AwardXp` | idempotente via constraint `unique(user_id, source_type, source_id)` — reaproveitado pelos casos de uso acima |
| `GetDashboard` | agrega perfil, temas, nº de cartões pendentes, XP total, streak |

## 5. Ports (`src/domain/ports/`)

`ConversationAgent`, `AnalysisAgent`, `ConversationRepository`, `MessageRepository`, `TopicRepository`, `UserProfileRepository`, `AnalysisRepository`, `FindingRepository`, `LearningPointRepository`, `FlashcardRepository`, `CardScheduleRepository`, `ReviewLogRepository`, `ReviewScheduler`, `SpeechTranscriptionRepository`, `SpeechToText`, `XpEventRepository`, `DailyUsageRepository`, `LlmUsageRepository`.

Cada um tem exatamente uma implementação Supabase/OpenAI/ts-fsrs hoje — a interface existe para isolar regra de negócio de fornecedor, não porque haja múltiplas implementações reais.

## 6. Modelo de dados (Postgres/Supabase)

13 tabelas. Convenções: `snake_case`, `id uuid default gen_random_uuid()`, `created_at timestamptz default now()`, RLS em todas.

```
user_profiles, topics, conversations, messages*, speech_transcriptions,
analyses, learning_points, findings, flashcards, card_schedules,
review_logs*, xp_events*, llm_usage_logs*
```
`*` = append-only, reforçado por trigger (`reject_update_delete`) que bloqueia UPDATE/DELETE mesmo para o service role — não é só RLS, é uma trava no banco.

Pontos que fogem do que estaria "óbvio" num diagrama ER:
- `findings.start_offset`/`end_offset` são índices UTF-16 sobre `messages.content`; `AnalyzeConversation` valida `content.slice(start,end) === original_text` antes de salvar, tenta relocalizar via `indexOf` se não bater, e descarta (com log) se não achar.
- `learning_points` é por `(user_id, rule_key)` — é o que faz o mesmo erro em conversas diferentes incrementar `occurrence_count` em vez de duplicar.
- `flashcards.source_finding_id`/`learning_point_id` são nulos para cartões manuais.
- `card_schedules` não tem coluna para `learning_steps` do FSRS — por isso o adaptador roda com `enable_short_term: false` (ver seção 7).
- `analyses.summary` (jsonb) foi adicionado numa migração separada da inicial — não estava no desenho original do schema e teria se perdido sem essa coluna.
- `llm_usage_logs` também não estava no desenho original; foi adicionado agora para acompanhar custo de token por chamada real à OpenAI.

## 7. Decisões de design que vale saber antes de mexer

- **FSRS com `enable_short_term: false`**: faz o algoritmo ir direto para o estado `review` em toda avaliação (sem sub-passos de minutos/horas), porque o schema não persiste `learning_steps`. Isso é intencional, não uma limitação esquecida.
- **Retry de análise em duas camadas**: o adaptador OpenAI tenta a chamada 2x se o JSON não passar no Zod (`MAX_ATTEMPTS = 2` em `openai-analysis-agent.ts`); separadamente, o usuário pode clicar "tentar novamente" na tela de resultados, o que roda `AnalyzeConversation` do zero (incrementando `analyses.attempts`).
- **`FinishConversation` dispara `AnalyzeConversation` de forma síncrona** dentro do mesmo request (não há fila/worker). O usuário só é redirecionado para `/results` depois que a análise termina (ou falha) — por isso o clique em "Finish conversation" demora alguns segundos.
- **Idempotência de XP**: não é checada em código antes de inserir — o INSERT é tentado direto e o erro de unique constraint (`23505`) é capturado e tratado como "já foi pago", retornando `null`. Mais simples e sem race condition do tipo check-then-insert.
- **Sem persistência de áudio**: o buffer de voz é processado em memória na rota `/api/transcribe` e descartado; nunca é salvo em disco ou storage.
- **Whisper sem `prompt`**: de propósito, para não enviesar o modelo a "limpar" o erro gramatical que a Fase 3 precisa detectar.

## 8. Testes

- **Unitários (Vitest, `npm run test`)**: 78 testes. Cobrem todos os casos de uso com repositórios/agentes falsos (`tests/fakes.ts`), regras puras (offset, streak, XP), e o parsing/mapeamento da resposta do LLM de análise.
- **E2E (Playwright, `npm run test:e2e`)**: 2 testes, rodando contra `next build && next start` (não `next dev`) — descobrimos que o WebSocket de HMR do Turbopack falha o handshake contra o Chromium do Playwright e entra num loop de reload que corrompe o teste no meio do login. Login é feito de verdade (magic link lido direto da API do Mailpit, `http://127.0.0.1:54324`), e os dois testes fazem chamadas reais à OpenAI.
  1. `conversation-flow.spec.ts`: login → nova conversa → 4 mensagens reais com a IA → finalizar → resultados → XP atualizado.
  2. `flashcard-review-flow.spec.ts`: semeia um flashcard direto no banco (service role) → login → revisar → bônus diário → XP atualizado.

## 9. O que falta / limitações conhecidas

- **Google OAuth**: código pronto (`signInWithOAuth`), mas o provedor está desabilitado no Supabase (sem Client ID/Secret). Retorna `{"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` se clicado.
- **Nenhum projeto Supabase na nuvem**: tudo roda contra o Supabase local (Docker). O e-mail de magic link só chega no Mailpit, nunca numa caixa real.
- **Deploy na Vercel sem variáveis de ambiente**: o site publicado existe mas não funciona (não tem `NEXT_PUBLIC_SUPABASE_URL` nem as outras envs configuradas lá).
- **GitHub não conectado à Vercel**: o App do GitHub da Vercel nunca autorizou o repositório; deploys não acontecem automaticamente a cada push.
- **Fora do escopo do MVP** (por decisão do `CLAUDE.md`, não esquecimento): análise de pronúncia, app mobile, pagamentos, RPG visual/gamificação além de XP simples, conversa por voz em tempo real.
- **Tela "Flashcards" com filtros** existe (`pendentes/novos/revisados/suspensos`) mas não foi testada manualmente de ponta a ponta pelo usuário ainda.
- **Sem rate limiting próprio** além do limite diário de mensagens/voz — nada impede picos de custo dentro do limite diário configurado (padrão: 50 mensagens, 15 min de voz por dia).

## 10. Como rodar localmente

```bash
# 1. Docker Desktop precisa estar rodando
npx supabase start          # sobe Postgres local, Auth, Mailpit etc.
npm install
npm run dev                 # http://localhost:3000 (ou outra porta livre)

# e-mail de magic link aparece em http://127.0.0.1:54324
# painel do banco em http://127.0.0.1:54323

npm run lint
npm run typecheck
npm run test                # unitários, não precisa do Supabase local
npm run test:e2e            # precisa do Supabase local rodando + créditos OpenAI reais
```

Variáveis de ambiente em `.env.local` (não versionado): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_API_KEY`, `LLM_CONVERSATION_MODEL`, `LLM_ANALYSIS_MODEL`, `STT_API_KEY`, `STT_PROVIDER`.

## 11. Ideias em aberto para melhorar (ponto de partida pra discussão)

Não são decisões tomadas, só candidatos a conversar:

- Configurar um projeto Supabase real na nuvem + SMTP real, pra sair do modo "só funciona local".
- Conectar o deploy da Vercel (env vars + GitHub App) pra ter um ambiente de verdade pra mostrar.
- Credenciais reais do Google OAuth.
- UI ainda é bem mínima (shadcn padrão, sem polimento visual) — pode valer a pena revisar o design antes de mostrar pra alguém de fora.
- Testar a tela de Flashcards (filtros, suspender) manualmente, já que só foi validada via teste automatizado isolado.
- Pensar em um mecanismo de fila/background job pra análise, se o tempo de resposta síncrono do "Finish conversation" incomodar em produção.
