import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { jsonError, parseJson, parseSupabaseResult, zodMessage } from "@/lib/api-response";
import { mapStory } from "@/lib/backlog";
import { createStorySchema } from "@/lib/story-schema";
import { createClient } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase || !context.locals.user) return jsonError("Authentication is required.", 401);

  const { data, error } = parseSupabaseResult(
    await supabase
      .from("backlog_stories")
      .select("*")
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  );

  if (error) return jsonError(error.message, 500);
  if (!Array.isArray(data)) return jsonError("Unexpected story list response.", 500);
  return Response.json({ stories: data.map(mapStory) });
};

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase || !context.locals.user) return jsonError("Authentication is required.", 401);

  try {
    const input = createStorySchema.parse(await parseJson(context.request));
    const { data, error } = parseSupabaseResult(
      await supabase
        .from("backlog_stories")
        .insert({ title: input.title, created_by: context.locals.user.id })
        .select()
        .single(),
    );

    if (error) return jsonError(error.message, 500);
    return Response.json({ story: mapStory(data) }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return jsonError(zodMessage(error), 400);
    return jsonError("Unable to create the backlog story.", 400);
  }
};
