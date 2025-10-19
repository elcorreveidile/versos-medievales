// app/api/generate-poem/route.ts
import { NextResponse } from "next/server";

/** Utilidades básicas **/
const rng = (seed = Date.now()) => {
  let x = seed % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
};

const pick = <T>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];

// Contenido léxico sencillo (medievalizante B1)
const LEX = {
  sujetos: ["caballero", "trovador", "juglar", "monje", "compañero", "doncella", "señor"],
  acciones: ["canta", "cuenta", "recuerda", "invoca", "busca", "alaba", "llora"],
  lugares: ["en la villa", "por la sierra", "en el castillo", "junto al río", "en la corte", "bajo la luna"],
  tiempos: ["esta mañana", "al anochecer", "en la alborada", "en la vigilia", "en la romería"],
  objetos: ["su lanza", "su laúd", "la honra", "la fe", "el pan", "el vino", "la espada"],
  conectores: ["y", "pero", "aunque", "mientras", "cuando"],
  adjetivos: ["leal", "piadoso", "firme", "honrado", "antiguo", "severo", "bravo"],
};

// Finales de rima para forzar asonancias (muy simple)
const RIMAS = {
  a: ["amada", "honrada", "sagrada", "templada", "callada", "soñada"],
  e: ["fuerte", "breve", "suerte", "miserere", "verde", "puente"],
  o: ["honor", "amor", "señor", "dolor", "rigor", "clamor"],
  i: ["servir", "decir", "vivir", "pedir", "sentir", "venir"],
};

// Contador de sílabas aproximado (por grupos vocálicos)
const contarSilabas = (verso: string) => {
  const limpio = verso
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const grupos = (limpio.match(/[aeiouáéíóúü]+/gi) || []).length;
  // Ajuste muy aproximado
  return Math.max(4, grupos);
};

// Intenta aproximar a un número de sílabas objetivo
const ajustaSilabas = (r: () => number, base: string, objetivo: number) => {
  let v = base;
  let n = contarSilabas(v);
  const extras = ["muy", "tan", "más", "pues", "ya", "aún"];
  let guard = 0;
  while (n < objetivo && guard++ < 6) {
    v = v.replace(/\b([a-záéíóúüñ]+)\b/i, `$1 ${pick(r, extras)}`);
    n = contarSilabas(v);
  }
  return v;
};

// Construye un verso sencillo
function versoLibre(r: () => number, tema?: string) {
  const s = pick(r, LEX.sujetos);
  const a = pick(r, LEX.acciones);
  const l = pick(r, LEX.lugares);
  const t = pick(r, LEX.tiempos);
  const o = pick(r, LEX.objetos);
  const adj = pick(r, LEX.adjetivos);
  const c = pick(r, LEX.conectores);

  const piezas = [
    `${s} ${a}`,
    tema ? `el ${tema}` : o,
    c,
    l,
    t,
    `con ánimo ${adj}`,
  ];

  return piezas.filter(Boolean).join(" ");
}

// Fuerza una asonancia al final con un set dado
function aplicaRima(verso: string, finales: string[]) {
  // Reemplaza la última palabra por un final rimado
  return verso.replace(/([a-záéíóúüñ]+)(\s*)$/i, `${pick(rng(), finales)}$2`);
}

/** Esquemas **/
function cuadernaVia(r: () => number, tema?: string) {
  // 4 versos, ≈14 sílabas, monorrima (AAAA) — aproximado
  const objetivo = 14;
  const finales = pick(r, Object.values(RIMAS));
  const v = Array.from({ length: 4 }, () =>
    aplicaRima(
      ajustaSilabas(r, versoLibre(r, tema), objetivo),
      finales as string[]
    )
  );
  return { scheme: "AAAA (cuaderna vía aprox.)", lines: v };
}

function romance(r: () => number, tema?: string) {
  // 8 versos, ≈8 sílabas; rima asonante en pares: -a, -e, -o, -i (simple)
  const objetivo = 8;
  const vocal = pick(r, Object.keys(RIMAS) as (keyof typeof RIMAS)[]);
  const finales = RIMAS[vocal];
  const v: string[] = [];
  for (let i = 1; i <= 8; i++) {
    let line = ajustaSilabas(r, versoLibre(r, tema), objetivo);
    if (i % 2 === 0) line = aplicaRima(line, finales);
    v.push(line);
  }
  return { scheme: `rima asonante en pares (-${vocal})`, lines: v };
}

function pareado(r: () => number, tema?: string) {
  // 2 versos, ≈11 sílabas, rima AA sencilla
  const objetivo = 11;
  const finales = pick(r, Object.values(RIMAS));
  const v1 = aplicaRima(ajustaSilabas(r, versoLibre(r, tema), objetivo), finales as string[]);
  const v2 = aplicaRima(ajustaSilabas(r, versoLibre(r, tema), objetivo), finales as string[]);
  return { scheme: "AA (pareado)", lines: [v1, v2] };
}

/** Handler API **/
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic = "", form = "cuaderna", seed } = body as {
      topic?: string;
      form?: "cuaderna" | "romance" | "pareado";
      seed?: number;
    };

    const rnd = rng(seed || Date.now());

    let poem;
    if (form === "romance") poem = romance(rnd, topic);
    else if (form === "pareado") poem = pareado(rnd, topic);
    else poem = cuadernaVia(rnd, topic); // por defecto

    return NextResponse.json({
      title: topic ? `Sobre ${topic}` : "Poema",
      form,
      scheme: poem.scheme,
      lines: poem.lines,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
