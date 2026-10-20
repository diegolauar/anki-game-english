import type { Conversation } from "@/domain/entities/conversation";
import type { Message } from "@/domain/entities/message";
import type { Topic } from "@/domain/entities/topic";
import type { ConversationAgent, ConversationReplyInput } from "@/domain/ports/conversation-agent";
import type {
  ConversationRepository,
  CreateConversationInput,
} from "@/domain/ports/conversation-repository";
import type { CreateMessageInput, MessageRepository } from "@/domain/ports/message-repository";
import type { TopicRepository } from "@/domain/ports/topic-repository";

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export class FakeConversationRepository implements ConversationRepository {
  conversations = new Map<string, Conversation>();

  async create(input: CreateConversationInput): Promise<Conversation> {
    const conversation: Conversation = {
      id: nextId("conversation"),
      userId: input.userId,
      topicId: input.topicId,
      customTopic: input.customTopic,
      difficulty: input.difficulty,
      status: "active",
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) ?? null;
  }

  seed(conversation: Conversation) {
    this.conversations.set(conversation.id, conversation);
  }
}

export class FakeMessageRepository implements MessageRepository {
  messages: Message[] = [];

  async listByConversation(conversationId: string): Promise<Message[]> {
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async findByClientMessageId(
    conversationId: string,
    clientMessageId: string,
  ): Promise<Message | null> {
    return (
      this.messages.find(
        (message) =>
          message.conversationId === conversationId &&
          message.clientMessageId === clientMessageId,
      ) ?? null
    );
  }

  async create(input: CreateMessageInput): Promise<Message> {
    const existingForConversation = this.messages.filter(
      (message) => message.conversationId === input.conversationId,
    );
    const sequence = existingForConversation.length
      ? Math.max(...existingForConversation.map((message) => message.sequence)) + 1
      : 1;

    const message: Message = {
      id: nextId("message"),
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      inputMode: input.inputMode,
      sequence,
      clientMessageId: input.clientMessageId,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(message);
    return message;
  }
}

export class FakeTopicRepository implements TopicRepository {
  topics: Topic[] = [];

  async listActive(): Promise<Topic[]> {
    return this.topics;
  }

  async findById(id: string): Promise<Topic | null> {
    return this.topics.find((topic) => topic.id === id) ?? null;
  }
}

export class FakeConversationAgent implements ConversationAgent {
  calls: ConversationReplyInput[] = [];
  nextReply = "Sure, tell me more about that.";

  async reply(input: ConversationReplyInput): Promise<string> {
    this.calls.push(input);
    return this.nextReply;
  }
}
