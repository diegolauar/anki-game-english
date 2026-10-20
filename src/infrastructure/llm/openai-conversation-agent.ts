import OpenAI from "openai";
import type { ConversationAgent, ConversationReplyInput } from "@/domain/ports/conversation-agent";
import { buildConversationSystemPrompt } from "@/infrastructure/llm/conversation-prompt";

export class OpenAiConversationAgent implements ConversationAgent {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_CONVERSATION_MODEL;

    if (!apiKey) throw new Error("LLM_API_KEY is not set.");
    if (!model) throw new Error("LLM_CONVERSATION_MODEL is not set.");

    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async reply(input: ConversationReplyInput): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: buildConversationSystemPrompt(input) },
        ...input.history.map((turn) =>
          turn.role === "user"
            ? ({ role: "user" as const, content: turn.content })
            : ({ role: "assistant" as const, content: turn.content }),
        ),
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("The LLM returned an empty reply.");

    return content.trim();
  }
}
