// src/app/api/generate-poem/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

type ReqA = { topic?: string; form?: 'romance'|'cuaderna'|'copla'|'redondilla'; seed?: number };
type ReqB = {
  character?: string; location?: string; event?: string; emotion?: string;
  language?: 'spanish'|'english'|'chinese';
};

function buildPrompt(input: ReqA & ReqB) {
  // Acepta ambos formatos de tu app (tema+forma) o (character/location/…)
  const form = (input.form || 'romance').toLowerCase();
  const language = (input.language || 'spanish') as 'spanish'|'english'|'chinese';

  let brief = '';
  if (input.topic) {
    brief = `Tema: ${input.topic}.`;
  } else {
    brief =
      `Personaje: ${input.character ?? 'caballero'}; ` +
      `Lugar: ${input.location ?? 'castillo'}; ` +
      `Acción: ${input.event ?? 'batalla'}; ` +
      `Emoción: ${input.emotion ?? 'honra'}.`;
  }

  // Instrucciones por forma métrica
  const meters: Record<string,string> = {
    romance:
`• Romance castellano: versos octosílabos, rima asonante EN LOS VERSOS PARES; impares sueltos.
• 3–4 estrofas (12–16 versos). Español medieval/arcaizante, léxico de honor, fe, frontera.
• Evita modernismos. Mantén musicalidad y imágenes medievales.`,

    cuaderna:
`• Cuaderna vía: 14 sílabas (hemistiquios 7+7 con cesura), AAAA por estrofa.
• 3 estrofas (12–16 versos máximo). Tono didáctico/épico. Léxico culto medieval.`,

    copla:
`• Copla arte menor (octosílabos) con rima consonante ABBA o ABAB.
• 3–4 estrofas. Tono lírico, imaginería medieval.`,

    redondilla:
`• Redondilla (ABBA, octosílabos). 3–4 estrofas. Lirismo cortesano.`
  };

  const meterGuide = meters[form] ?? meters.romance;

  // Idioma del resultado (tu curso es en ES; dejamos opción)
  const langHeader =
    language === 'english' ? 'Write in archaic English.' :
    language === 'chinese' ? '以古典中文写作，仿中古风格。' :
    'Escribe en español con sabor medieval.';

  const system =
`Eres un POETA MEDIEVAL experto (épica, mester de clerecía y tradición romancística).
Sigues con rigor la métrica pedida y mantienes tono y léxico de la época.`;

  const user =
`${langHeader}

${brief}

Forma solicitada: ${form.toUpperCase()}
Guía de métrica:
${meterGuide}

Formato de salida:
1) Una sola línea de TÍTULO (sin adornos).
2) Poema tal cual, sin comentarios, explicaciones ni notas.
`;

  return { system, user, language: language === 'english' ? 'english' : language === 'chinese' ? 'chinese' : 'spanish' };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqA & ReqB;
    const { system, user, language } = buildPrompt(body);

    // === Llamada a un endpoint compatible con OpenAI (OpenAI u OpenRouter) ===
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Falta API key en variables de entorno.' }), { status: 500 });
    }

    // Si usas OpenAI directamente:
    const endpoint = process.env.OPENAI_API_BASE ?? 'https://api.openai.com/v1/chat/completions';
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(endpoint.includes('openrouter.ai') ? { 'HTTP-Referer': process.env.OPENROUTER_REFERRER ?? '', 'X-Title': 'versos-medievales' } : {})
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 900,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: 'Fallo en el proveedor', detail: t }), { status: 500 });
    }

    const data = await res.json() as any;
    const full = (data.choices?.[0]?.message?.content ?? '').trim();
    if (!full) return new Response(JSON.stringify({ error: 'Respuesta vacía del modelo' }), { status: 500 });

    const lines = full.split('\n').filter(l => l.trim().length);
    const title = lines.shift()?.trim() || 'Poema';
    const content = lines.join('\n').trim();

    return new Response(JSON.stringify({ title, content, language }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error generando poema', detail: String(e?.message || e) }), { status: 500 });
  }
}
