// src/app/api/health/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const info = {
    ok: true,
    has_OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    has_OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    OPENAI_API_BASE: process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1",
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    using_openrouter: (process.env.OPENAI_API_BASE ?? "").includes("openrouter.ai"),
    has_referer_for_openrouter: !!process.env.OPENROUTER_REFERRER,
  };
  return new Response(JSON.stringify(info, null, 2), { headers: { "Content-Type": "application/json" } });
}
