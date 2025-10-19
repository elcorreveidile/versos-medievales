// src/app/api/generate-poem/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";
export const dynamic = "force-dynamic";

const USE_LLM = !!(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);
const OPENAI_URL = process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const schemeFor = (form: string) =>
  form === "cuaderna" ? "AAAA (cuaderna vía aprox.)" :
  form === "pareado" ? "AA (pareado)" :
  "asonancia en pares (romance)";

function toLines(s?: string) {
  return (s || "").split("\n").map(t => t.trimEnd()).filter(Boolean);
}

// Fallback local muy simple (por si no hay clave)
function localPoem({ topic, form }: { topic?: string; form: "romance"|"cuaderna"|"pareado" }) {
  const base = [
    `caballero canta ${topic ? `el ${topic}` : "la honra"} en la villa al anochecer`,
    `doncella recuerda la promesa junto al río con ánimo leal`,
    `juglar invoca la memoria por la sierra en romería`,
    `monje guarda el consejo en el castillo con mesura`,
  ];
  const lines = form === "pareado" ? base.slice(0, 2) : form === "cuaderna" ? base.slice(0, 4) : [...base, ...base];
  return { title: topic ? `Sobre ${topic}` : "Poema", form, scheme: schemeFor(form), lines };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const form = (body.form || "romance") as "romance"|"cuaderna"|"pareado";
    const topic = (body.topic as string) || "";

    if (!USE_LLM) {
      const out = localPoem({ topic, form });
      return NextResponse.json({ ...out, note: "Sin API key: usando versión local." });
    }

    const system = `Eres un poeta medieval en español. Escribe un poema breve y bello en forma ${form}.
- Romance: octosílabos, asonancia en pares.
- Cuaderna: 4 versos largos, monorrima AAAA.
- Pareado: 2 versos con rima AA.
Devuelve SOLO:
{"title":"...","content":"v1\\nv2\\n..."}
sin comentarios.`;
    const user = `Tema: ${topic || "libre"}.`;

    const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY!;
    const headers: Record<string,string> = {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    };
    if (OPENAI_URL.includes("openrouter.ai")) {
      headers["HTTP-Referer"] = process.env.OPENROUTER_REFERRER ?? "";
      headers["X-Title"] = "versos-medievales";
    }

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.85,
        max_tokens: 900,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Proveedor ${res.status}: ${detail}`);
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content || "";
    // normaliza a lines[]
    const titleMatch = content.split("\n").filter(Boolean)[0]?.trim();
    const title = titleMatch?.length && titleMatch.length < 80 ? titleMatch : (topic ? `Sobre ${topic}` : "Poema");
    const bodyText = title === titleMatch ? content.slice(content.indexOf("\n") + 1) : content;
    const lines = toLines(bodyText);

    return NextResponse.json({ title, form, scheme: schemeFor(form), lines });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
