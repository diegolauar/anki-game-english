import { describe, expect, it } from "vitest";
import { FinishConversation } from "@/application/use-cases/finish-conversation";
import type { Conversation } from "@/domain/entities/conversation";
import { FakeAnalysisRepository, FakeConversationRepository } from "./fakes";

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

describe("FinishConversation", () => {
  it("throws when the conversation does not exist", async () => {
    const useCase = new FinishConversation(
      new FakeConversationRepository(),
      new FakeAnalysisRepository(),
    );

    await expect(
      useCase.execute({ conversationId: "missing", userId: "user-1" }),
    ).rejects.toThrow();
  });

  it("throws when the conversation belongs to another user", async () => {
    const conversationRepository = new FakeConversationRepository();
    conversationRepository.seed(buildConversation());
    const useCase = new FinishConversation(conversationRepository, new FakeAnalysisRepository());

    await expect(
      useCase.execute({ conversationId: "conversation-1", userId: "someone-else" }),
    ).rejects.toThrow();
  });

  it("throws when the conversation is already finished", async () => {
    const conversationRepository = new FakeConversationRepository();
    conversationRepository.seed(buildConversation({ status: "finished" }));
    const useCase = new FinishConversation(conversationRepository, new FakeAnalysisRepository());

    await expect(
      useCase.execute({ conversationId: "conversation-1", userId: "user-1" }),
    ).rejects.toThrow();
  });

  it("marks the conversation as finished and creates a pending analysis", async () => {
    const conversationRepository = new FakeConversationRepository();
    conversationRepository.seed(buildConversation());
    const analysisRepository = new FakeAnalysisRepository();
    const useCase = new FinishConversation(conversationRepository, analysisRepository);

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
});
