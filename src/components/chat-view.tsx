"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Message } from "@/domain/entities/message";
import { sendMessageAction } from "@/app/conversations/actions";

interface ChatViewProps {
  conversationId: string;
  initialMessages: Message[];
}

export function ChatView({ conversationId, initialMessages }: ChatViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setError(null);
    setInput("");

    const clientMessageId = crypto.randomUUID();
    const optimisticId = `optimistic-${clientMessageId}`;
    const optimisticUserMessage: Message = {
      id: optimisticId,
      conversationId,
      role: "user",
      content,
      inputMode: "text",
      sequence: messages.length + 1,
      clientMessageId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const result = await sendMessageAction({ conversationId, content, clientMessageId });
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== optimisticId),
        result.userMessage,
        result.assistantMessage,
      ]);
    } catch {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setError("Não foi possível enviar sua mensagem. Tente novamente.");
      setInput(content);
    } finally {
      setIsSending(false);
    }
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

      <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-3">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escreva em inglês..."
          disabled={isSending}
        />
        <Button type="submit" disabled={isSending || input.trim().length === 0}>
          {isSending ? "..." : "Enviar"}
        </Button>
      </form>
    </div>
  );
}
