// app/page.tsx
export default function Home() {
  return (
    <main style={{fontFamily:'system-ui', padding:'2rem'}}>
      <h1>🪶 Generador de poesía medieval</h1>
      <p>La app está desplegada correctamente.</p>

      <p style={{marginTop:'1rem'}}>
        Prueba la API: abre la consola y ejecuta este fetch:
      </p>
      <pre style={{background:'#f5f5f5', padding:'1rem', borderRadius:8, overflow:'auto'}}>
{`fetch("/api/generate-poem", {
  method: "POST",
  headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ topic: "honra y camino", form: "romance" })
}).then(r=>r.json()).then(console.log)`}
      </pre>
    </main>
  );
}
