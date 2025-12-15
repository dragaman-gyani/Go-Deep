// ai.js - generative-ish chat: retrieval-augmented using wiki & local contributions + worker summarizer
const AI = (function(){
  let worker = null;
  function ensureWorker(){ if(worker) return; try{ worker = new Worker('scripts/worker.js'); }catch(e){ worker=null; } }
  function summarize(texts, max=3){
    ensureWorker();
    if(worker){
      return new Promise((res)=>{ const onmsg = ev=>{ if(ev.data && ev.data.cmd==='result'){ worker.removeEventListener('message', onmsg); res(ev.data.summary); } }; worker.addEventListener('message', onmsg); worker.postMessage({cmd:'summarize', texts, max}); setTimeout(()=>{ worker.removeEventListener('message', onmsg); res(texts.slice(0,3).join(' ')); },1200); });
    }
    return Promise.resolve(texts.slice(0,3).join(' '));
  }

  async function fetchWiki(q){
    try{ const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1&titles=' + encodeURIComponent(q); const r = await fetch(url); const j = await r.json(); const p = Object.values(j.query.pages||{})[0]; if(p && !p.missing) return p.extract || ''; }catch(e){} return '';
  }

  // simple generative reply by combining wiki extract + contribution snippets + simple template
  async function generateReply(query){
    const wiki = await fetchWiki(query);
    const contribs = Data.getContributions().filter(c=> (c.title||'').toLowerCase().includes(query.toLowerCase()) || (c.content||'').toLowerCase().includes(query.toLowerCase()));
    const texts = [];
    if(wiki) texts.push(wiki);
    contribs.slice(0,3).forEach(c=> texts.push(c.content));
    const summary = await summarize(texts, 4);
    // simple templating to make a friendly answer
    const response = summary || `मुझे इस विषय पर पर्याप्त जानकारी नहीं मिली। आप "Information by Gyan Technology" में और जोड़ सकते हैं।`;
    return { answer: response, sources: (contribs.map(c=>({title:c.title, id:c.id})) ) };
  }

  return { generateReply };
})();