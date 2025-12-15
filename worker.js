// summarizer worker used by AI (same as previous pattern)
self.addEventListener('message', (ev)=>{
  const d = ev.data || {};
  if(d.cmd !== 'summarize') return;
  const texts = (d.texts||[]).filter(Boolean).slice(0,20);
  const max = Math.max(1, d.max || 3);
  const combined = texts.join(' ').replace(/\s+/g,' ').trim();
  if(!combined){ postMessage({cmd:'result', summary:'कोई जानकारी नहीं'}); return; }
  const sents = combined.split(/(?<=[।.!?])\s+/u).filter(s=>s.length>10);
  if(!sents.length){ postMessage({cmd:'result', summary: combined.slice(0,300)}); return; }
  const tokenize = s => s.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\s]/g,' ').split(/\s+/).filter(Boolean);
  const tf = {}; sents.forEach(s=> new Set(tokenize(s)).forEach(t=> tf[t]=(tf[t]||0)+1));
  const scored = sents.map(s=>{ const toks = tokenize(s); let sc=0; toks.forEach(t=> sc+=tf[t]||0); return {s,score: sc/Math.sqrt(Math.max(1,toks.length))}; });
  scored.sort((a,b)=>b.score-a.score);
  postMessage({cmd:'result', summary: scored.slice(0,Math.min(max,scored.length)).map(x=>x.s).join(' ')});
});