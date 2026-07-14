import type { APIRoute } from "astro";
import { jsonError, parseSupabaseResult } from "@/lib/api-response";
import { mapTeamMember } from "@/lib/backlog";
import { createClient } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase || !context.locals.user) return jsonError("Authentication is required.", 401);

  const { data, error } = parseSupabaseResult(
    await supabase.from("team_members").select("id, display_name").order("display_name"),
  );

  if (error) return jsonError(error.message, 500);
  if (!Array.isArray(data)) return jsonError("Unexpected team member response.", 500);
  return Response.json({
    members: data.map((member) => mapTeamMember(member as { id: string; display_name: string })),
  });
};
