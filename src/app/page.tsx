// src/app/page.tsx
export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>🪶 Generador de poesía medieval</h1>
      <p>La app está desplegada correctamente.</p>

      <p style={{ marginTop:'1rem' }}>
        Prueba rápida de la API desde la consola del navegador:
      </p>
      <pre style={{ background:'#f5f5f5', padding:'1rem', borderRadius:8 }}>
{`fetch("/api/generate-poem", {
  method: "POST",
  headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ topic: "honra y camino", form: "romance" })
}).then(r=>r.json()).then(console.log)`}
      </pre>
    </main>
  );
}
