// src/app/api/generate-poem/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// -------- utilidades mínimas (fallback local) --------
const rng = (seed = Date.now()) => { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const schemeFor = (form: string) =>
  form === "cuaderna" ? "AAAA (cuaderna vía aprox.)" :
  form === "pareado"  ? "AA (pareado)" :
  "asonancia en pares (romance)";

function localPoem({ topic, form }:{ topic?: string; form: "romance"|"cuaderna"|"pareado"}) {
  const r = rng();
  const sujetos = ["caballero","juglar","monje","peregrino","doncella"];
  const lugares = ["en la villa","por la sierra","en el castillo","junto al río","en la frontera"];
  const tiempos = ["al anochecer","en la alborada","en vigilia","tras la batalla","en romería"];

  const v = () => `${pick(r,sujetos)} canta ${topic ? `el ${topic}` : "la honra"} ${pick(r,lugares)} ${pick(r,tiempos)}`;
  let lines: string[] = [];
  if (form === "pareado") lines = [v(), v()];
  else if (form === "cuaderna") lines = [v(), v(), v(), v()];
  else lines = [v(), v(), v(), v(), v(), v(), v(), v()];

  return { title: topic ? `Sobre ${cap(topic)}` : "Poema", form, scheme: schemeFor(form), lines };
}

// -------- LLM (OpenAI / OpenRouter compatible) --------
const API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const API_BASE = process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1";
const MODEL    = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

async function generateLLM({ topic, form }:{ topic?: string; form: "romance"|"cuaderna"|"pareado"}) {
  const endpoint = `${API_BASE.replace(/\/$/, "")}/chat/completions`;

  const system =
`Eres un poeta medieval en español. Escribe un poema breve y bello.
- Romance: octosílabos, asonancia en pares.
- Cuaderna: 4 versos largos, monorrima AAAA.
- Pareado: 2 versos con rima AA.
Devuelve SOLO JSON: {"title":"...","content":"v1\\nv2\\n..."}`;

  const user = `Tema: ${topic || "libre"}. Forma: ${form}.`;

  const headers: Record<string,string> = {
    "Authorization": `Bearer ${API_KEY!}`,
    "Content-Type": "application/json",
  };
  // Requisitos de OpenRouter
  if (API_BASE.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_REFERRER ?? "";
    headers["X-Title"] = "versos-medievales";
  }

  const res = await fetch(endpoint, {
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
    const detail = await res.text().catch(()=> "");
    throw new Error(`Proveedor ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content || "";
  // Normaliza a {title, lines[]}
  const first = content.split("\n").find(l => l.trim().length) || "";
  const title = first.length < 80 ? first.trim() : (topic ? `Sobre ${topic}` : "Poema");
  const body  = first && content.startsWith(first) ? content.slice(content.indexOf("\n")+1) : content;
  const lines = body.split("\n").map(s => s.trimEnd()).filter(Boolean);
  return { title, form, scheme: schemeFor(form), lines };
}

export async function POST(req: Request) {
  try {
    const { topic = "", form = "romance" } = await req.json().catch(()=> ({})) as { topic?: string; form?: "romance"|"cuaderna"|"pareado" };

    // Si no hay API key, usamos local
    if (!API_KEY) {
      const out = localPoem({ topic, form });
      return NextResponse.json({ ...out, note: "Sin API key: usando versión local." });
    }

    // Intento LLM; si falla: fallback local (¡sin 500!)
    try {
      const out = await generateLLM({ topic, form });
      return NextResponse.json(out);
    } catch (e:any) {
      const fb = localPoem({ topic, form });
      return NextResponse.json({ ...fb, note: `LLM falló: ${e.message}` });
    }
  } catch (e:any) {
    // Último recurso: NUNCA 500; devolvemos local + nota
    const fb = localPoem({ topic: "", form: "romance" });
    return NextResponse.json({ ...fb, note: `Error inesperado: ${e?.message || e}` });
  }
}
