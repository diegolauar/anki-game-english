"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Keyboard, Mic, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { TopicIcon } from "@/components/topic-icon";
import { startConversationAction } from "@/app/conversations/actions";
import { buildDifficultyDescriptions, buildDifficultyLabels } from "@/lib/difficulty-labels";
import type { Topic } from "@/domain/entities/topic";
import type { Difficulty } from "@/domain/value-objects/difficulty";
import { DIFFICULTIES } from "@/domain/value-objects/difficulty";
import type { InputMode } from "@/domain/value-objects/input-mode";

function SelectableCard({
  selected,
  onClick,
  icon,
  title,
  description,
  align = "items-start",
  padding = "p-3.5",
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string | null;
  align?: "items-start" | "items-center";
  padding?: "p-3" | "p-3.5";
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex ${align} gap-2.5 rounded-control border ${padding} text-left text-sm transition-colors ${
        selected
          ? "border-acc bg-acc-soft shadow-[0_0_0_3px_var(--acc-soft)]"
          : "border-line hover:border-acc"
      }`}
    >
      {icon}
      <span className="min-w-0" style={{ overflowWrap: "anywhere" }}>
        <span className="block font-bold">{title}</span>
        {description && (
          <span className="mt-0.5 block text-[12.5px] text-muted-foreground">{description}</span>
        )}
      </span>
    </button>
  );
}

export function NewConversationForm({
  topics,
  defaultDifficulty,
  preselectedTopicId,
}: {
  topics: Topic[];
  defaultDifficulty: Difficulty;
  preselectedTopicId: string | null;
}) {
  const t = useTranslations("conversation.new");
  const tDifficulty = useTranslations("difficulty");
  const difficultyLabels = buildDifficultyLabels(tDifficulty);
  const difficultyDescriptions = buildDifficultyDescriptions(tDifficulty);

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
            <span className="text-acc">1</span>&nbsp;&nbsp;{t("topicStep")}
          </legend>
          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
          >
            {topics.map((topic) => {
              const selected = !hasCustomTopic && topic.id === topicId;
              return (
                <SelectableCard
                  key={topic.id}
                  selected={selected}
                  onClick={() => {
                    setTopicId(topic.id);
                    setCustomTopic("");
                  }}
                  icon={<TopicIcon slug={topic.slug} />}
                  title={topic.title}
                  description={topic.description}
                  padding="p-3"
                />
              );
            })}
          </div>

          <label className="mt-1 flex items-center gap-2 rounded-control border border-dashed border-line px-4 py-3 text-sm focus-within:border-acc">
            <Pencil className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={customTopic}
              onChange={(event) => setCustomTopic(event.target.value)}
              placeholder={t("customTopicPlaceholder")}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="font-display text-lg font-bold">
            <span className="text-acc">2</span>&nbsp;&nbsp;{t("levelStep")}
          </legend>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {DIFFICULTIES.map((level) => (
              <SelectableCard
                key={level}
                selected={difficulty === level}
                onClick={() => setDifficulty(level)}
                title={difficultyLabels[level]}
                description={difficultyDescriptions[level]}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="font-display text-lg font-bold">
            <span className="text-acc">3</span>&nbsp;&nbsp;{t("modeStep")}
          </legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <SelectableCard
              selected={mode === "text"}
              onClick={() => setMode("text")}
              icon={<Keyboard className="size-5 shrink-0" />}
              title={t("textMode")}
              description={t("textModeDescription")}
              align="items-center"
            />
            <SelectableCard
              selected={mode === "voice"}
              onClick={() => setMode("voice")}
              icon={<Mic className="size-5 shrink-0" />}
              title={t("voiceMode")}
              description={t("voiceModeDescription")}
              align="items-center"
            />
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-card border border-line bg-surface p-6" style={{ position: "sticky", top: "1.5rem" }}>
        <p className="text-xs font-bold tracking-[.06em] text-muted-foreground uppercase">
          {t("summary")}
        </p>
        <div className="mt-3 flex items-center gap-2.5">
          {selectedTopic && !hasCustomTopic && <TopicIcon slug={selectedTopic.slug} size="md" />}
          <p className="text-xl font-bold">{summaryTitle ?? t("chooseTopicPlaceholder")}</p>
        </div>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("levelLabel")}</dt>
            <dd className="font-semibold">{difficultyLabels[difficulty]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("modeLabel")}</dt>
            <dd className="font-semibold">{mode === "text" ? t("textMode") : t("voiceMode")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("rewardLabel")}</dt>
            <dd className="font-semibold text-xp">+20 XP</dd>
          </div>
        </dl>
        <p className="mt-4 rounded-control bg-acc-soft p-3 text-[13px] text-acc-strong">
          {t("noCorrectionNotice")}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-acc text-sm font-bold text-acc-ink disabled:opacity-50"
        >
          {t("startButton")} <ArrowRight className="size-4" />
        </button>
      </aside>
    </form>
  );
}
