import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { jsonError, parseJson, parseSupabaseResult, zodMessage } from "@/lib/api-response";
import { mapStory } from "@/lib/backlog";
import { assessStoryReadiness } from "@/lib/readiness";
import { toDatabaseUpdate, updateStorySchema } from "@/lib/story-schema";
import { createClient } from "@/lib/supabase";

export const prerender = false;

function storyId(context: Parameters<APIRoute>[0]) {
  return context.params.id;
}

export const GET: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  const id = storyId(context);
  if (!supabase || !context.locals.user) return jsonError("Authentication is required.", 401);
  if (!id) return jsonError("Story id is required.", 400);

  const { data, error } = parseSupabaseResult(
    await supabase.from("backlog_stories").select("*").eq("id", id).maybeSingle(),
  );
  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Story not found.", 404);
  const story = mapStory(data);
  if (story.archivedAt) return jsonError("Story not found.", 404);
  return Response.json({ story });
};

export const PATCH: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  const id = storyId(context);
  if (!supabase || !context.locals.user) return jsonError("Authentication is required.", 401);
  if (!id) return jsonError("Story id is required.", 400);

  try {
    const input = updateStorySchema.parse(await parseJson(context.request));
    const existingResult = parseSupabaseResult(
      await supabase.from("backlog_stories").select("*").eq("id", id).is("archived_at", null).maybeSingle(),
    );
    if (existingResult.error) return jsonError(existingResult.error.message, 500);
    if (!existingResult.data) return jsonError("Story not found.", 404);

    const existingStory = mapStory(existingResult.data);
    const readiness = assessStoryReadiness({
      goal: input.goal !== undefined ? input.goal : existingStory.goal,
      recipientOrArea: input.recipientOrArea !== undefined ? input.recipientOrArea : existingStory.recipientOrArea,
      description: input.description !== undefined ? input.description : existingStory.description,
      implementationSteps: input.implementationSteps ?? existingStory.implementationSteps,
      definitionOfDone: input.definitionOfDone !== undefined ? input.definitionOfDone : existingStory.definitionOfDone,
      definitionOfDoneChecklist:
        input.definitionOfDoneChecklist?.map((item) => item.label) ??
        existingStory.definitionOfDoneChecklist.map((item) => item.label),
    });
    const update = toDatabaseUpdate(input);
    if (!readiness.isReady && (input.boardPosition === "ready" || existingStory.boardPosition === "ready")) {
      update.board_position = "refining";
    }

    const { data, error } = parseSupabaseResult(
      await supabase.from("backlog_stories").update(update).eq("id", id).is("archived_at", null).select().maybeSingle(),
    );

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Story not found.", 404);
    return Response.json({ story: mapStory(data) });
  } catch (error) {
    if (error instanceof ZodError) return jsonError(zodMessage(error), 400);
    return jsonError("Unable to update the backlog story.", 400);
  }
};

export const DELETE: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  const id = storyId(context);
  if (!supabase || !context.locals.user) return jsonError("Authentication is required.", 401);
  if (!id) return jsonError("Story id is required.", 400);

  const { data, error } = parseSupabaseResult(
    await supabase
      .from("backlog_stories")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .is("archived_at", null)
      .select("id")
      .maybeSingle(),
  );

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Story not found.", 404);
  return new Response(null, { status: 204 });
};
