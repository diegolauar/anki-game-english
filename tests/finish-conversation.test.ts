import { describe, expect, it } from "vitest";
import { FinishConversation } from "@/application/use-cases/finish-conversation";
import type { Conversation } from "@/domain/entities/conversation";
import {
  FakeAnalysisRepository,
  FakeConversationRepository,
  FakeMessageRepository,
  FakeXpEventRepository,
} from "./fakes";

function buildConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conversation-1",
    userId: "user-1",
    topicId: null,
    customTopic: "Daily routine",
    difficulty: "beginner",
    status: "active",
    startedAt: new Date().toISOString(),
    endedAt: null,
    ...overrides,
  };
}

function buildUseCase() {
  const conversationRepository = new FakeConversationRepository();
  const analysisRepository = new FakeAnalysisRepository();
  const messageRepository = new FakeMessageRepository();
  const xpEventRepository = new FakeXpEventRepository();
  const useCase = new FinishConversation(
    conversationRepository,
    analysisRepository,
    messageRepository,
    xpEventRepository,
  );
  return { useCase, conversationRepository, analysisRepository, messageRepository, xpEventRepository };
}

async function seedUserMessages(
  messageRepository: FakeMessageRepository,
  conversationId: string,
  count: number,
) {
  for (let index = 0; index < count; index += 1) {
    await messageRepository.create({
      conversationId,
      role: "user",
      content: `message ${index}`,
      inputMode: "text",
      clientMessageId: `client-${index}`,
    });
  }
}

describe("FinishConversation", () => {
  it("throws when the conversation does not exist", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({ conversationId: "missing", userId: "user-1" }),
    ).rejects.toThrow();
  });

  it("throws when the conversation belongs to another user", async () => {
    const { useCase, conversationRepository } = buildUseCase();
    conversationRepository.seed(buildConversation());

    await expect(
      useCase.execute({ conversationId: "conversation-1", userId: "someone-else" }),
    ).rejects.toThrow();
  });

  it("throws when the conversation is already finished", async () => {
    const { useCase, conversationRepository } = buildUseCase();
    conversationRepository.seed(buildConversation({ status: "finished" }));

    await expect(
      useCase.execute({ conversationId: "conversation-1", userId: "user-1" }),
    ).rejects.toThrow();
  });

  it("marks the conversation as finished and creates a pending analysis", async () => {
    const { useCase, conversationRepository, analysisRepository } = buildUseCase();
    conversationRepository.seed(buildConversation());

    const { analysisId } = await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
    });

    const conversation = await conversationRepository.findById("conversation-1");
    expect(conversation?.status).toBe("finished");
    expect(conversation?.endedAt).not.toBeNull();

    const analysis = await analysisRepository.findById(analysisId);
    expect(analysis?.status).toBe("pending");
    expect(analysis?.conversationId).toBe("conversation-1");
  });

  it("awards conversation_finished XP when there are at least 4 user messages", async () => {
    const { useCase, conversationRepository, messageRepository, xpEventRepository } =
      buildUseCase();
    conversationRepository.seed(buildConversation());
    await seedUserMessages(messageRepository, "conversation-1", 4);

    await useCase.execute({ conversationId: "conversation-1", userId: "user-1" });

    expect(xpEventRepository.events).toHaveLength(1);
    expect(xpEventRepository.events[0]).toMatchObject({
      userId: "user-1",
      sourceType: "conversation_finished",
      sourceId: "conversation-1",
      amount: 20,
    });
  });

  it("does not award XP when there are fewer than 4 user messages", async () => {
    const { useCase, conversationRepository, messageRepository, xpEventRepository } =
      buildUseCase();
    conversationRepository.seed(buildConversation());
    await seedUserMessages(messageRepository, "conversation-1", 3);

    await useCase.execute({ conversationId: "conversation-1", userId: "user-1" });

    expect(xpEventRepository.events).toHaveLength(0);
  });
});
