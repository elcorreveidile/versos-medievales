// src/app/page.tsx
"use client";

import { useState } from "react";

type Poem = { title: string; form: string; scheme: string; lines: string[] };

export default function Home() {
  const [topic, setTopic] = useState("honra y camino");
  const [form, setForm] = useState<"cuaderna" | "romance" | "pareado">("romance");
  const [seed, setSeed] = useState<number | "">("");
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setPoem(null);
    const res = await fetch("/api/generate-poem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic.trim() || undefined,// src/app/page.tsx
"use client";
import { useState } from "react";

type Poem = { title?: string; form?: string; scheme?: string; lines?: string[]; content?: string; note?: string };

export default function Home() {
  const [topic, setTopic] = useState("honra y camino");
  const [form, setForm] = useState<"cuaderna" | "romance" | "pareado">("romance");
  const [seed, setSeed] = useState<number | "">("");
  const [poem, setPoem] = useState<Poem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalize = (d: Poem) => {
    // Si viene content (string), lo convertimos a lines[]
    if (!Array.isArray(d?.lines) && typeof d?.content === "string") {
      const lines = d.content.split("\n").map(s => s.trimEnd()).filter(Boolean);
      return { ...d, lines };
    }
    return d;
  };

  async function generate() {
    setLoading(true);
    setError(null);
    setPoem(null);
    try {
      const res = await fetch("/api/generate-poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          form,
          seed: typeof seed === "number" ? seed : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error en la API");
      const normalized = normalize(data);
      if (!normalized?.lines || normalized.lines.length === 0) {
        throw new Error("La API no devolvió versos.");
      }
      setPoem(normalized);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function downloadTxt() {
    if (!poem?.lines) return;
    const blob = new Blob([poem.lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(poem.form || "poema")}-${(poem.title || "poema").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-900">
      <header className="border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-2xl font-semibold">🪶 Generador de poesía medieval</h1>
          <p className="text-sm text-stone-600">
            Cuaderna vía (AAAA), Romance (pares asonantes) o Pareado (AA). Resultado estable con LLM o fallback local.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="sm:col-span-2 text-sm">
              Tema
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="honra, camino, frontera…"
              />
            </label>
            <label className="text-sm">
              Forma
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={form}
                onChange={(e) => setForm(e.target.value as any)}
              >
                <option value="cuaderna">Cuaderna vía</option>
                <option value="romance">Romance</option>
                <option value="pareado">Pareado</option>
              </select>
            </label>
            <label className="text-sm">
              Semilla
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="(opcional)"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={generate}
              disabled={loading}
              className="rounded-full bg-stone-900 px-4 py-2 text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {loading ? "Generando…" : "Generar poema"}
            </button>

            {poem?.lines && (
              <>
                <button
                  onClick={() => navigator.clipboard.writeText(poem.lines!.join("\n"))}
                  className="rounded-full border px-4 py-2 hover:bg-stone-50"
                >
                  Copiar
                </button>
                <button onClick={downloadTxt} className="rounded-full border px-4 py-2 hover:bg-stone-50">
                  Descargar .txt
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {poem?.lines && (
          <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-2 text-sm text-stone-500">
              {(poem.form || "").toString()} · {poem.scheme || ""}
              {poem.note ? ` · ${poem.note}` : ""}
            </div>
            <h2 className="text-xl font-medium">{poem.title || "Poema"}</h2>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 font-[ui-monospace] leading-7">
{poem.lines.join("\n")}
            </pre>
          </div>
        )}
      </section>
    </main>
  );
}
        form,
        seed: typeof seed === "number" ? seed : undefined,
      }),
    });
    const data = await res.json();
    setPoem(data);
    setLoading(false);
  }

  function downloadTxt() {
    if (!poem) return;
    const blob = new Blob([poem.lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${poem.form}-${(poem.title || "poema").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-900">
      <header className="border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-2xl font-semibold">🪶 Generador de poesía medieval</h1>
          <p className="text-sm text-stone-600">
            Cuaderna vía (AAAA), Romance (octosílabo con asonancia en pares) o Pareado (AA). Métrica y rima aproximadas.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6">
        {/* Controles */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="sm:col-span-2 text-sm">
              Tema
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="honra, camino, frontera…"
              />
            </label>

            <label className="text-sm">
              Forma
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={form}
                onChange={(e) => setForm(e.target.value as any)}
              >
                <option value="cuaderna">Cuaderna vía</option>
                <option value="romance">Romance</option>
                <option value="pareado">Pareado</option>
              </select>
            </label>

            <label className="text-sm">
              Semilla
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                type="number"
                value={seed}
                onChange={(e) =>
                  setSeed(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="(opcional)"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={generate}
              disabled={loading}
              className="rounded-full bg-stone-900 px-4 py-2 text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {loading ? "Generando…" : "Generar poema"}
            </button>

            {poem && (
              <>
                <button
                  onClick={() => navigator.clipboard.writeText(poem.lines.join("\n"))}
                  className="rounded-full border px-4 py-2 hover:bg-stone-50"
                >
                  Copiar
                </button>
                <button onClick={downloadTxt} className="rounded-full border px-4 py-2 hover:bg-stone-50">
                  Descargar .txt
                </button>
              </>
            )}
          </div>
        </div>

        {/* Resultado */}
        {poem && (
          <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-2 text-sm text-stone-500">
              {poem.form} · {poem.scheme}
            </div>
            <h2 className="text-xl font-medium">{poem.title || "Poema"}</h2>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 font-[ui-monospace] leading-7">
{poem.lines.join("\n")}
            </pre>
          </div>
        )}
      </section>

      <footer className="border-t bg-white/80">
        <div className="mx-auto max-w-3xl px-4 py-4 text-sm text-stone-600">
          © {new Date().getFullYear()} — Proyecto docente (B1/B2)
        </div>
      </footer>
    </main>
  );
}
