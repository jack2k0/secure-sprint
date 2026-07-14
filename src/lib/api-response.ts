import { z } from "zod";

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new z.ZodError([
      {
        code: "custom",
        path: [],
        message: "Request body must be valid JSON.",
      },
    ]);
  }
}

export function zodMessage(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

const supabaseResultSchema = z.object({
  data: z.unknown(),
  error: z.object({ message: z.string() }).nullable(),
});

export function parseSupabaseResult(result: unknown) {
  return supabaseResultSchema.parse(result);
}
