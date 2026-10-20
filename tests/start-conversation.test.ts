import { describe, expect, it } from "vitest";
import { StartConversation } from "@/application/use-cases/start-conversation";
import { FakeConversationRepository } from "./fakes";

describe("StartConversation", () => {
  it("throws when neither topicId nor customTopic is provided", async () => {
    const useCase = new StartConversation(new FakeConversationRepository());

    await expect(
      useCase.execute({
        userId: "user-1",
        topicId: null,
        customTopic: null,
        difficulty: "beginner",
      }),
    ).rejects.toThrow();
  });

  it("creates a conversation with a predefined topic", async () => {
    const repository = new FakeConversationRepository();
    const useCase = new StartConversation(repository);

    const conversation = await useCase.execute({
      userId: "user-1",
      topicId: "topic-1",
      customTopic: null,
      difficulty: "intermediate",
    });

    expect(conversation.topicId).toBe("topic-1");
    expect(conversation.status).toBe("active");
    expect(repository.conversations.size).toBe(1);
  });

  it("creates a conversation with a custom topic", async () => {
    const repository = new FakeConversationRepository();
    const useCase = new StartConversation(repository);

    const conversation = await useCase.execute({
      userId: "user-1",
      topicId: null,
      customTopic: "My gym routine",
      difficulty: "beginner",
    });

    expect(conversation.customTopic).toBe("My gym routine");
  });
});
