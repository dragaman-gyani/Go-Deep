// Assets loader: fetch XML (SVG) assets and convert to blob URLs
window.Assets = (function(){
  const cache = {};
  async function load(paths=[]){
    return Promise.all(paths.map(async p=>{
      if(cache[p]) return {path:p,url:cache[p]};
      try{
        const r = await fetch(p);
        if(!r.ok) throw new Error('failed '+p);
        const txt = await r.text();
        const url = URL.createObjectURL(new Blob([txt], {type:'image/svg+xml'}));
        cache[p]=url; return {path:p,url};
      }catch(e){ console.warn(e); cache[p]=p; return {path:p,url:p}; }
    }));
  }
  function getUrl(path){ return cache[path] || path; }
  return { load, getUrl };
})();