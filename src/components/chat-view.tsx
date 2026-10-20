"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AudioLines,
  Flag,
  Mic,
  Send,
  Square,
} from "lucide-react";
import { finishConversationAction, sendMessageAction } from "@/app/conversations/actions";
import { TopicIcon } from "@/components/topic-icon";
import { useVoiceRecorder } from "@/components/use-voice-recorder";
import type { Message } from "@/domain/entities/message";
import { MIN_USER_MESSAGES_FOR_CONVERSATION_XP } from "@/domain/rules/xp-rewards";
import type { InputMode } from "@/domain/value-objects/input-mode";

const MESSAGES_FOR_XP = MIN_USER_MESSAGES_FOR_CONVERSATION_XP;

interface ChatViewProps {
  conversationId: string;
  initialMessages: Message[];
  topicTitle: string;
  topicSlug: string | null;
  difficultyLabel: string;
  startedAt: string;
  initialMode: InputMode;
}

export function ChatView({
  conversationId,
  initialMessages,
  topicTitle,
  topicSlug,
  difficultyLabel,
  startedAt,
  initialMode,
}: ChatViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composerFieldRef = useRef<HTMLTextAreaElement>(null);

  const userMessageCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages],
  );
  const xpSecured = userMessageCount >= MESSAGES_FOR_XP;
  const [minutesElapsed, setMinutesElapsed] = useState(0);

  useEffect(() => {
    function updateElapsed() {
      setMinutesElapsed(Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)));
    }
    updateElapsed();
    const interval = setInterval(updateElapsed, 30_000);
    return () => clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(params: {
    content: string;
    inputMode: InputMode;
    voiceTranscription?: { rawText: string; provider: string; audioDurationMs: number | null };
  }) {
    setIsSending(true);
    setError(null);

    const clientMessageId = crypto.randomUUID();
    const optimisticId = `optimistic-${clientMessageId}`;
    const optimisticUserMessage: Message = {
      id: optimisticId,
      conversationId,
      role: "user",
      content: params.content,
      inputMode: params.inputMode,
      sequence: messages.length + 1,
      clientMessageId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const result = await sendMessageAction({
        conversationId,
        content: params.content,
        clientMessageId,
        inputMode: params.inputMode,
        voiceTranscription: params.voiceTranscription,
      });
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== optimisticId),
        result.userMessage,
        result.assistantMessage,
      ]);
    } catch {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setError("Não foi possível enviar sua mensagem. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  }

  const voice = useVoiceRecorder({
    onSubmit: (result) =>
      sendMessage({
        content: result.text,
        inputMode: "voice",
        voiceTranscription: {
          rawText: result.rawText,
          provider: result.provider,
          audioDurationMs: result.audioDurationMs,
        },
      }),
  });

  const composerValue = voice.state === "review" ? voice.transcript : input;

  // Cresce a altura do campo com o conteúdo (reseta pra 1 linha antes de medir,
  // senão scrollHeight nunca encolhe quando o texto diminui).
  useEffect(() => {
    const field = composerFieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [composerValue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (voice.state === "review") {
      await voice.send();
      return;
    }
    const content = input.trim();
    if (!content || isSending) return;
    setInput("");
    await sendMessage({ content, inputMode: "text" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handleFinishSubmit(event: FormEvent<HTMLFormElement>) {
    if (
      userMessageCount < MESSAGES_FOR_XP &&
      !window.confirm("Com menos de 4 mensagens você não ganha XP. Finalizar mesmo assim?")
    ) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface2"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <TopicIcon slug={topicSlug} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-[17px] font-bold">{topicTitle}</h1>
            <p className="text-xs text-muted-foreground">
              {difficultyLabel} · {initialMode === "voice" ? "Voz" : "Texto"} · {minutesElapsed} min
            </p>
          </div>
        </div>

        <div className="hidden flex-col items-end gap-1 sm:flex">
          <span className="text-xs font-semibold text-muted-foreground">
            {xpSecured ? "+20 XP garantido" : `${userMessageCount}/${MESSAGES_FOR_XP} mensagens para +20 XP`}
          </span>
          <div className="h-1.5 w-35 overflow-hidden rounded-full bg-surface2">
            <div
              className={`h-full transition-all ${xpSecured ? "bg-ok" : "bg-acc"}`}
              style={{ width: `${Math.min(100, (userMessageCount / MESSAGES_FOR_XP) * 100)}%` }}
            />
          </div>
        </div>

        <form action={finishConversationAction} onSubmit={handleFinishSubmit}>
          <input type="hidden" name="conversationId" value={conversationId} />
          <button
            type="submit"
            className="flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold transition-colors hover:border-acc hover:text-acc-strong"
          >
            <Flag className="size-4" />
            <span className="hidden sm:inline">Finalizar conversa</span>
          </button>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-3.5 px-4 py-6">
          <p className="mx-auto rounded-full bg-acc-soft px-3.5 py-1.5 text-xs font-semibold text-acc-strong">
            Sem correções agora. Foque em se comunicar.
          </p>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <span className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-acc text-sm font-bold text-acc-ink">
                  Q
                </span>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 text-[16px] whitespace-pre-wrap ${
                  message.role === "user"
                    ? "rounded-[20px_20px_6px_20px] bg-acc text-acc-ink"
                    : "rounded-[20px_20px_20px_6px] border border-line bg-surface"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-end justify-start gap-2">
              <span className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-acc text-sm font-bold text-acc-ink">
                Q
              </span>
              <div className="flex items-center gap-1 rounded-[20px_20px_20px_6px] border border-line bg-surface px-4 py-3">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                <span
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground/30"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-line bg-surface px-6 py-5">
        <div className="mx-auto max-w-[760px]">
          {error && <p className="mb-2 text-sm text-err">{error}</p>}

          {voice.state === "denied" && (
            <p className="mb-2 rounded-control bg-err-soft px-3 py-2 text-[13px] text-err">
              Sem acesso ao microfone. Você pode continuar digitando.
            </p>
          )}

          {voice.state === "review" && (
            <div className="mb-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <AudioLines className="size-4 text-acc" />
              Transcrição da sua voz — revise antes de enviar.
              <button
                type="button"
                onClick={voice.start}
                className="font-semibold text-acc-strong underline-offset-2 hover:underline"
              >
                Regravar
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {voice.state === "recording" ? (
              <div className="flex h-[60px] items-center gap-3 rounded-full border border-err bg-err-soft px-3">
                <span className="size-3 shrink-0 animate-pulse rounded-full bg-err" />
                <span className="text-sm font-semibold text-err">Gravando</span>
                <div className="flex flex-1 items-center justify-center gap-0.5">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <span
                      key={index}
                      className="w-[3px] rounded-full bg-err/75"
                      style={{
                        height: `${8 + ((index * 37) % 16)}px`,
                        animation: "pulse 1s ease-in-out infinite",
                        animationDelay: `${index * 0.04}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs text-err">
                  0:{String(voice.elapsedSeconds).padStart(2, "0")} / 1:00
                </span>
                <button
                  type="button"
                  onClick={voice.cancel}
                  className="shrink-0 text-xs font-semibold text-err/80 hover:text-err"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={voice.stopRecording}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-err text-white"
                  aria-label="Parar gravação"
                >
                  <Square className="size-4 fill-current" />
                </button>
              </div>
            ) : voice.state === "processing" ? (
              <div className="flex h-[60px] items-center gap-3 rounded-full border border-line bg-bg px-5">
                <span className="size-4 animate-spin rounded-full border-2 border-acc border-t-transparent" />
                <span className="text-sm text-muted-foreground">Transcrevendo…</span>
              </div>
            ) : (
              <div className="flex min-h-[60px] items-end gap-2 rounded-[28px] border border-line bg-bg px-2.5 py-2 pl-5 focus-within:border-acc">
                <textarea
                  ref={composerFieldRef}
                  value={composerValue}
                  onChange={(event) =>
                    voice.state === "review"
                      ? voice.setTranscript(event.target.value)
                      : setInput(event.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva em inglês…"
                  disabled={isSending}
                  rows={1}
                  className="max-h-40 flex-1 resize-none self-center overflow-y-auto bg-transparent py-1.5 text-[16px] leading-6 outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  disabled={isSending || voice.state === "denied"}
                  onClick={voice.start}
                  aria-label="Gravar áudio"
                  className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-surface2 text-ink transition-colors hover:bg-acc-soft hover:text-acc-strong disabled:opacity-40"
                >
                  <Mic className="size-[18px]" />
                </button>
                <button
                  type="submit"
                  disabled={
                    isSending ||
                    (voice.state === "review" ? voice.transcript.trim().length === 0 : input.trim().length === 0)
                  }
                  aria-label="Enviar"
                  className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-acc text-acc-ink disabled:opacity-40"
                >
                  <Send className="size-[18px]" />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
