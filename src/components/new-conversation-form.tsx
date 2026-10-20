"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Keyboard, Mic, Pencil } from "lucide-react";
import { TopicIcon } from "@/components/topic-icon";
import { startConversationAction } from "@/app/conversations/actions";
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS } from "@/lib/difficulty-labels";
import type { Topic } from "@/domain/entities/topic";
import type { Difficulty } from "@/domain/value-objects/difficulty";
import { DIFFICULTIES } from "@/domain/value-objects/difficulty";

type InputMode = "text" | "voice";

export function NewConversationForm({
  topics,
  defaultDifficulty,
  preselectedTopicId,
}: {
  topics: Topic[];
  defaultDifficulty: Difficulty;
  preselectedTopicId: string | null;
}) {
  const [topicId, setTopicId] = useState<string | null>(
    preselectedTopicId ?? topics[0]?.id ?? null,
  );
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [mode, setMode] = useState<InputMode>("text");

  const hasCustomTopic = customTopic.trim().length > 0;
  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === topicId) ?? null,
    [topics, topicId],
  );
  const summaryTitle = hasCustomTopic ? customTopic.trim() : (selectedTopic?.title ?? null);
  const canSubmit = hasCustomTopic || Boolean(topicId);

  return (
    <form
      action={startConversationAction}
      className="mt-6 grid gap-7"
      style={{ gridTemplateColumns: "minmax(0,1fr) minmax(260px,320px)" }}
    >
      <input type="hidden" name="topicId" value={hasCustomTopic ? "" : (topicId ?? "")} />
      <input type="hidden" name="customTopic" value={hasCustomTopic ? customTopic.trim() : ""} />
      <input type="hidden" name="difficulty" value={difficulty} />
      <input type="hidden" name="mode" value={mode} />

      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-3">
          <legend className="font-display text-lg font-bold">
            <span className="text-acc">1</span>&nbsp;&nbsp;Escolha um tema
          </legend>
          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
          >
            {topics.map((topic) => {
              const selected = !hasCustomTopic && topic.id === topicId;
              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setTopicId(topic.id);
                    setCustomTopic("");
                  }}
                  className={`flex items-start gap-2.5 rounded-control border p-3 text-left text-sm transition-colors ${
                    selected
                      ? "border-acc bg-acc-soft shadow-[0_0_0_3px_var(--acc-soft)]"
                      : "border-line hover:border-acc"
                  }`}
                >
                  <TopicIcon slug={topic.slug} />
                  <span className="min-w-0" style={{ overflowWrap: "anywhere" }}>
                    <span className="block font-bold">{topic.title}</span>
                    {topic.description && (
                      <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                        {topic.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="mt-1 flex items-center gap-2 rounded-control border border-dashed border-line px-4 py-3 text-sm focus-within:border-acc">
            <Pencil className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={customTopic}
              onChange={(event) => setCustomTopic(event.target.value)}
              placeholder="Ou descreva seu próprio tema — ex.: minha rotina de treino"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="font-display text-lg font-bold">
            <span className="text-acc">2</span>&nbsp;&nbsp;Nível
          </legend>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {DIFFICULTIES.map((level) => {
              const selected = difficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setDifficulty(level)}
                  className={`rounded-control border p-3.5 text-left text-sm transition-colors ${
                    selected
                      ? "border-acc bg-acc-soft shadow-[0_0_0_3px_var(--acc-soft)]"
                      : "border-line hover:border-acc"
                  }`}
                >
                  <span className="block font-bold">{DIFFICULTY_LABELS[level]}</span>
                  <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                    {DIFFICULTY_DESCRIPTIONS[level]}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="font-display text-lg font-bold">
            <span className="text-acc">3</span>&nbsp;&nbsp;Como você quer responder?
          </legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={mode === "text"}
              onClick={() => setMode("text")}
              className={`flex items-center gap-2.5 rounded-control border p-3.5 text-left text-sm transition-colors ${
                mode === "text"
                  ? "border-acc bg-acc-soft shadow-[0_0_0_3px_var(--acc-soft)]"
                  : "border-line hover:border-acc"
              }`}
            >
              <Keyboard className="size-5 shrink-0" />
              <span>
                <span className="block font-bold">Texto</span>
                <span className="block text-[12.5px] text-muted-foreground">
                  Digite suas respostas.
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={mode === "voice"}
              onClick={() => setMode("voice")}
              className={`flex items-center gap-2.5 rounded-control border p-3.5 text-left text-sm transition-colors ${
                mode === "voice"
                  ? "border-acc bg-acc-soft shadow-[0_0_0_3px_var(--acc-soft)]"
                  : "border-line hover:border-acc"
              }`}
            >
              <Mic className="size-5 shrink-0" />
              <span>
                <span className="block font-bold">Voz</span>
                <span className="block text-[12.5px] text-muted-foreground">
                  Fale e revise a transcrição.
                </span>
              </span>
            </button>
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-card border border-line bg-surface p-6" style={{ position: "sticky", top: "1.5rem" }}>
        <p className="text-xs font-bold tracking-[.06em] text-muted-foreground uppercase">Resumo</p>
        <div className="mt-3 flex items-center gap-2.5">
          {selectedTopic && !hasCustomTopic && <TopicIcon slug={selectedTopic.slug} size="md" />}
          <p className="text-xl font-bold">{summaryTitle ?? "Escolha um tema"}</p>
        </div>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Nível</dt>
            <dd className="font-semibold">{DIFFICULTY_LABELS[difficulty]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Modo</dt>
            <dd className="font-semibold">{mode === "text" ? "Texto" : "Voz"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Recompensa</dt>
            <dd className="font-semibold text-xp">+20 XP</dd>
          </div>
        </dl>
        <p className="mt-4 rounded-control bg-acc-soft p-3 text-[13px] text-acc-strong">
          A IA não corrige durante a conversa. Fale à vontade — a análise completa vem no final.
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-acc text-sm font-bold text-acc-ink disabled:opacity-50"
        >
          Iniciar conversa <ArrowRight className="size-4" />
        </button>
      </aside>
    </form>
  );
}
