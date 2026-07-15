import { STORY_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/story-review";

export interface XaiChatClient {
  completeJson(userContent: string): Promise<unknown>;
}

export function createXaiClient(apiKey: string | undefined): XaiChatClient | null {
  if (!apiKey?.trim()) return null;

  return {
    async completeJson(userContent: string): Promise<unknown> {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: STORY_REVIEW_SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`xAI request failed (${String(response.status)}): ${text.slice(0, 200)}`);
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("xAI response missing content.");
      return JSON.parse(content) as unknown;
    },
  };
}
