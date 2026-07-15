import type { APIRoute } from "astro";
import { jsonError, parseSupabaseResult } from "@/lib/api-response";
import { mapStory } from "@/lib/backlog";
import { readinessForStory } from "@/lib/readiness";
import { createClient } from "@/lib/supabase";

export const prerender = false;

/**
 * Machine-readable readiness for IDE agents and other non-browser clients.
 * Uses the same pure evaluator as the UI (`assessStoryReadiness` via `readinessForStory`).
 */
export const GET: APIRoute = async (context) => {
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

  return Response.json({
    storyId: story.id,
    readiness: readinessForStory(story),
  });
};
