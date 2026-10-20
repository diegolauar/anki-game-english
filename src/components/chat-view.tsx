"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { sendMessageAction } from "@/app/conversations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceRecorder, type VoiceRecorderResult } from "@/components/voice-recorder";
import type { Message } from "@/domain/entities/message";
import type { InputMode } from "@/domain/value-objects/input-mode";

interface ChatViewProps {
  conversationId: string;
  initialMessages: Message[];
}

export function ChatView({ conversationId, initialMessages }: ChatViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setInput("");
    await sendMessage({ content, inputMode: "text" });
  }

  async function handleVoiceSubmit(result: VoiceRecorderResult) {
    await sendMessage({
      content: result.text,
      inputMode: "voice",
      voiceTranscription: {
        rawText: result.rawText,
        provider: result.provider,
        audioDurationMs: result.audioDurationMs,
      },
    });
    setIsRecording(false);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            {message.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="pb-2 text-sm text-destructive">{error}</p>}

      {isRecording ? (
        <VoiceRecorder
          disabled={isSending}
          onCancel={() => setIsRecording(false)}
          onSubmit={handleVoiceSubmit}
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-3">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escreva em inglês..."
            disabled={isSending}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isSending}
            onClick={() => setIsRecording(true)}
          >
            Gravar
          </Button>
          <Button type="submit" disabled={isSending || input.trim().length === 0}>
            {isSending ? "..." : "Enviar"}
          </Button>
        </form>
      )}
    </div>
  );
}
