import OpenAI from "openai";
import type { AnalysisAgent, AnalysisAgentInput, AnalysisAgentResult } from "@/domain/ports/analysis-agent";
import { analysisResponseSchema } from "@/infrastructure/llm/analysis-schema";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "@/infrastructure/llm/analysis-prompt";
import { toAnalysisAgentResult } from "@/infrastructure/llm/analysis-response-mapper";

const MAX_ATTEMPTS = 2;

export class OpenAiAnalysisAgent implements AnalysisAgent {
  private readonly client: OpenAI;
  readonly modelId: string;

  constructor() {
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_ANALYSIS_MODEL;

    if (!apiKey) throw new Error("LLM_API_KEY is not set.");
    if (!model) throw new Error("LLM_ANALYSIS_MODEL is not set.");

    this.client = new OpenAI({ apiKey });
    this.modelId = model;
  }

  async analyze(input: AnalysisAgentInput): Promise<AnalysisAgentResult> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.requestAndParse(input);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("The analysis agent failed.");
  }

  private async requestAndParse(input: AnalysisAgentInput): Promise<AnalysisAgentResult> {
    const completion = await this.client.chat.completions.create({
      model: this.modelId,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildAnalysisSystemPrompt(input.existingRuleKeys) },
        { role: "user", content: buildAnalysisUserPrompt(input.messages) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("The analysis agent returned an empty response.");

    const parsed = analysisResponseSchema.parse(JSON.parse(content));
    return toAnalysisAgentResult(parsed);
  }
}
