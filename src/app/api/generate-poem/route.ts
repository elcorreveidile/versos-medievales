// src/app/api/generate-poem/route.ts
import { NextResponse, NextResponse as NR } from "next/server";

/* Utilidades */
const rng = (seed = Date.now()) => { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
const pick = <T,>(r: ()=>number, a: T[]) => a[Math.floor(r() * a.length)];
const LEX = {
  sujetos:["caballero","trovador","juglar","monje","compañero","doncella","señor"],
  acciones:["canta","cuenta","recuerda","invoca","busca","alaba","llora"],
  lugares:["en la villa","por la sierra","en el castillo","junto al río","en la corte","bajo la luna"],
  tiempos:["esta mañana","al anochecer","en la alborada","en la vigilia","en la romería"],
  objetos:["su lanza","su laúd","la honra","la fe","el pan","el vino","la espada"],
  conectores:["y","pero","aunque","mientras","cuando"],
  adjetivos:["leal","piadoso","firme","honrado","antiguo","severo","bravo"],
};
const RIMAS = { a:["amada","honrada","sagrada","templada","callada","soñada"], e:["fuerte","breve","suerte","miserere","verde","puente"], o:["honor","amor","señor","dolor","rigor","clamor"], i:["servir","decir","vivir","pedir","sentir","venir"] };
const contar = (v:string)=>Math.max(4,(v.toLowerCase().replace(/[^a-záéíóúüñ\s]/g," ").match(/[aeiouáéíóúü]+/gi)||[]).length);
const ajusta = (r:()=>number,base:string,obj:number)=>{let v=base,n=contar(v),ex=["muy","tan","más","pues","ya","aún"],g=0;while(n<obj&&g++<6){v=v.replace(/\b([a-záéíóúüñ]+)\b/i,`$1 ${pick(r,ex)}`);n=contar(v);}return v;};
const verso = (r:()=>number,tema?:string)=>[`${pick(r,LEX.sujetos)} ${pick(r,LEX.acciones)}`, tema?`el ${tema}`:pick(r,LEX.objetos), pick(r,LEX.conectores), pick(r,LEX.lugares), pick(r,LEX.tiempos), `con ánimo ${pick(r,LEX.adjetivos)}`].join(" ");
const rima = (v:string,fin:string[])=>v.replace(/([a-záéíóúüñ]+)(\s*)$/i,`${pick(rng(),fin)}$2`);
const cuaderna = (r:()=>number,tema?:string)=>{const obj=14,fin=pick(r,Object.values(RIMAS));const lines=Array.from({length:4},()=>rima(ajusta(r,verso(r,tema),obj),fin as string[]));return{scheme:"AAAA (cuaderna vía aprox.)",lines};};
const romance = (r:()=>number,tema?:string)=>{const obj=8,vocal=pick(r, Object.keys(RIMAS) as (keyof typeof RIMAS)[]),fin=RIMAS[vocal];const lines:Array<string>=[];for(let i=1;i<=8;i++){let l=ajusta(r,verso(r,tema),obj);if(i%2===0)l=rima(l,fin);lines.push(l);}return{scheme:`rima asonante en pares (-${vocal})`,lines};};
const pareado = (r:()=>number,tema?:string)=>{const obj=11,fin=pick(r,Object.values(RIMAS));return{scheme:"AA (pareado)",lines:[rima(ajusta(r,verso(r,tema),obj),fin as string[]),rima(ajusta(r,verso(r,tema),obj),fin as string[])]};};

/* GET: mini UI de prueba en el navegador */
export async function GET() {
  const html = `<!doctype html><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Probar /api/generate-poem</title>
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:2rem}input,select,button,textarea{font:inherit;padding:.5rem;margin:.25rem 0}textarea{width:100%;min-height:160px}</style>
  <h1>🪶 Probar generador</h1>
  <label>Tema <input id="topic" placeholder="honra y camino"/></label>
  <label>Forma <select id="form"><option value="cuaderna">cuaderna</option><option value="romance">romance</option><option value="pareado">pareado</option></select></label>
  <label>Seed <input id="seed" type="number" placeholder="12345"/></label>
  <button id="go">Generar</button>
  <pre id="out"></pre>
  <script>
    const $=s=>document.querySelector(s);
    $("#go").onclick=async()=>{
      const body={topic:$("#topic").value||undefined,form:$("#form").value,seed:$("#seed").value?Number($("#seed").value):undefined};
      const res=await fetch("",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await res.json();
      $("#out").textContent = data.lines ? data.lines.join("\\n")+"\\n\\n("+data.form+" · "+data.scheme+")" : JSON.stringify(data,null,2);
    };
  </script>`;
  return new NR(html,{headers:{"Content-Type":"text/html; charset=utf-8"}});
}

/* POST: genera poema */
export async function POST(req: Request) {
  try {
    const { topic = "", form = "cuaderna", seed } = await req.json().catch(()=> ({}));
    const r = rng(seed || Date.now());
    const poem = form==="romance" ? romance(r,topic) : form==="pareado" ? pareado(r,topic) : cuaderna(r,topic);
    return NextResponse.json({ title: topic?`Sobre ${topic}`:"Poema", form, scheme: poem.scheme, lines: poem.lines });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
