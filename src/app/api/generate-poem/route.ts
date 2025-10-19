// src/app/api/generate-poem/route.ts
import { NextResponse } from "next/server";

/* ========= Utilidades ========= */
const rng = (seed = Date.now()) => {
  let x = seed % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
};
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;

/* ======== Léxico medievalizante (B1/B2) ======== */
const LEX = {
  sujetos: ["caballero", "trovador", "juglar", "monje", "peregrino", "doncella", "señor", "villano", "escudero"],
  acciones: ["canta", "cuenta", "recuerda", "invoca", "busca", "alaba", "llora", "promete", "guarda", "defiende"],
  lugares: ["en la villa", "por la sierra", "en el castillo", "junto al río", "en la corte", "en la frontera", "bajo la luna"],
  tiempos: ["esta mañana", "al anochecer", "en la alborada", "en la vigilia", "en romería", "tras la batalla"],
  objetos: ["la honra", "su fe", "la mesnada", "la espada", "el pendón", "el laúd", "el pan y el vino"],
  conectores: ["y", "pero", "aunque", "mientras", "cuando"],
  adjetivos: ["leal", "piadoso", "firme", "honrado", "antiguo", "severo", "bravo", "humilde", "valiente"],
  fórmulas: [
    "¡Dios y mi señor!",
    "por vida vuestra",
    "a la merced del cielo",
    "con mesura",
    "si pluguiese",
    "según fuero antiguo",
  ],
  motivos: [
    "la deuda de vasallaje",
    "el consejo del buen juez",
    "el rumor de la frontera",
    "el precio del honor",
    "la palabra empeñada",
  ],
};

/* Rimas asonantes por vocal (para romances y pareados sencillos) */
const RIMAS: Record<string, string[]> = {
  a: ["amada", "honrada", "sagrada", "templada", "callada", "soñada"],
  e: ["fuerte", "breve", "suerte", "verde", "puente"],
  o: ["honor", "amor", "señor", "dolor", "rigor", "clamor"],
  i: ["servir", "decir", "venir", "sentir", "vivir", "pedir"],
};

/* ========= Silabación aprox. y ajuste ========= */
const contarSilabas = (verso: string) => {
  const limpio = verso
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const grupos = (limpio.match(/[aeiouáéíóúü]+/gi) || []).length;
  return Math.max(4, grupos);
};

const extensores = ["muy", "tan", "más", "pues", "ya", "aún", "todavía", "bien"];
const ajusta = (r: () => number, base: string, objetivo: number) => {
  let v = base;
  let n = contarSilabas(v);
  let guard = 0;
  while (n < objetivo && guard++ < 8) {
    v = v.replace(/\b([a-záéíóúüñ]+)\b/i, `$1 ${pick(r, extensores)}`);
    n = contarSilabas(v);
  }
  return v;
};

/* ========= Construcción de versos ========= */
const versoLibre = (r: () => number, tema?: string) => {
  // 1–2 fórmulas opcionales para sabor medieval
  const prefijo = Math.random() < 0.4 ? pick(r, LEX.fórmulas) + ", " : "";
  const s = pick(r, LEX.sujetos);
  const a = pick(r, LEX.acciones);
  const complemento = tema ? `el ${tema}` : pick(r, LEX.objetos);
  const l = pick(r, LEX.lugares);
  const t = pick(r, LEX.tiempos);
  const adj = pick(r, LEX.adjetivos);
  const motivo = Math.random() < 0.35 ? `, por ${pick(r, LEX.motivos)}` : "";
  return `${prefijo}${s} ${a} ${complemento} ${l} ${t} con ánimo ${adj}${motivo}`;
};

const aplicaAsonancia = (verso: string, finales: string[]) =>
  verso.replace(/([a-záéíóúüñ]+)(\s*)$/i, `${pick(rng(), finales)}$2`);

/* ========= Formas poéticas ========= */

function cuadernaVia(r: () => number, tema?: string) {
  // 4 versos ~14 sílabas, monorrima (AAAA). Aproximación docente.
  const objetivo = 14;
  const finales = pick(r, Object.values(RIMAS));
  const versos = Array.from({ length: 4 }, () =>
    aplicaAsonancia(ajusta(r, versoLibre(r, tema), objetivo), finales as string[])
  );
  return { scheme: "AAAA (cuaderna vía aprox.)", lines: versos };
}

function romance(r: () => number, tema?: string) {
  // 8 versos ~8 sílabas; asonancia en pares (vocal aleatoria)
  const objetivo = 8;
  const vocal = pick(r, Object.keys(RIMAS));
  const finales = RIMAS[vocal];
  const versos: string[] = [];
  for (let i = 1; i <= 8; i++) {
    let v = ajusta(r, versoLibre(r, tema), objetivo);
    if (i % 2 === 0) v = aplicaAsonancia(v, finales);
    versos.push(v);
  }
  return { scheme: `asonancia en pares (-${vocal})`, lines: versos };
}

function pareado(r: () => number, tema?: string) {
  // 2 versos ~11 sílabas; rima AA
  const objetivo = 11;
  const finales = pick(r, Object.values(RIMAS));
  const v1 = aplicaAsonancia(ajusta(r, versoLibre(r, tema), objetivo), finales as string[]);
  const v2 = aplicaAsonancia(ajusta(r, versoLibre(r, tema), objetivo), finales as string[]);
  return { scheme: "AA (pareado)", lines: [v1, v2] };
}

/* ========= Handlers ========= */

export async function POST(req: Request) {
  try {
    const { topic = "", form = "romance", seed } = (await req.json().catch(() => ({}))) as {
      topic?: string;
      form?: "cuaderna" | "romance" | "pareado";
      seed?: number;
    };

    const r = rng(seed ?? Date.now());
    const title = topic ? `Sobre ${cap(topic)}` : "Poema";

    const poem =
      form === "cuaderna" ? cuadernaVia(r, topic) :
      form === "pareado" ? pareado(r, topic) :
      romance(r, topic);

    return NextResponse.json({ title, form, scheme: poem.scheme, lines: poem.lines });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

/* GET opcional: pequeña UI de prueba en la propia ruta */
export async function GET() {
  const html = `<!doctype html><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Probar /api/generate-poem</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:2rem;color:#111}
    input,select,button{font:inherit;padding:.5rem;margin:.25rem 0}
    pre{background:#f6f6f6;padding:1rem;border-radius:10px}
  </style>
  <h1>🪶 Probar generador</h1>
  <label>Tema <input id="topic" value="honra y camino"/></label>
  <label>Forma 
    <select id="form"><option>romance</option><option>cuaderna</option><option>pareado</option></select>
  </label>
  <label>Seed <input id="seed" type="number" placeholder="12345"/></label>
  <button id="go">Generar</button>
  <pre id="out">—</pre>
  <script>
  const $=s=>document.querySelector(s);
  $("#go").onclick=async()=>{
    const body={topic:$("#topic").value,form:$("#form").value,seed:$("#seed").value?Number($("#seed").value):undefined};
    const res=await fetch("",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await res.json();
    $("#out").textContent = data.lines ? data.lines.join("\\n")+"\\n\\n("+data.form+" · "+data.scheme+")" : JSON.stringify(data,null,2);
  };
  </script>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
