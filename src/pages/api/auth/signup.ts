import type { APIRoute } from "astro";
export const POST: APIRoute = () =>
  new Response(null, {
    status: 303,
    headers: { Location: `/auth/signin?error=${encodeURIComponent("This workspace uses demo accounts only.")}` },
  });
