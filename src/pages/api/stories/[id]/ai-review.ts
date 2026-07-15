import type { APIRoute } from "astro";
import { XAI_API_KEY } from "astro:env/server";
import { jsonError, parseSupabaseResult } from "@/lib/api-response";
import { mapStory } from "@/lib/backlog";
import { buildStoryReviewUserPrompt, mergeStoryAiReview } from "@/lib/ai/story-review";
import { createXaiClient } from "@/lib/ai/xai-client";
import { createClient } from "@/lib/supabase";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  const id = context.params.id;
  if (!supabase || !context.locals.user) return jsonError("Authentication is required.", 401);
  if (!id) return jsonError("Story id is required.", 400);

  const { data, error } = parseSupabaseResult(
    await supabase.from("backlog_stories").select("*").eq("id", id).maybeSingle(),
  );
  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Story not found.", 404);
  const story = mapStory(data);
  if (story.archivedAt) return jsonError("Story not found.", 404);

  const client = createXaiClient(typeof XAI_API_KEY === "string" ? XAI_API_KEY : undefined);
  if (!client) {
    return Response.json({
      review: mergeStoryAiReview(story, null),
      available: false,
      error: "AI review is not configured (missing XAI_API_KEY).",
    });
  }

  try {
    const modelPayload = await client.completeJson(buildStoryReviewUserPrompt(story));
    return Response.json({
      review: mergeStoryAiReview(story, modelPayload),
      available: true,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "AI review failed.";
    return Response.json({
      review: mergeStoryAiReview(story, null),
      available: false,
      error: message,
    });
  }
};
