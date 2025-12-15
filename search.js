/* search.js - improved search flow:
   - If query starts with '@' or matches a channel handle -> open channel page
   - Attempt exact wikipedia title first (wikiExact)
   - Fallback search (wikiSearch)
   - Show "Information by Gyan Technology" banner styled specially
   - Show contributions (local) relevant to query
*/
document.addEventListener('DOMContentLoaded', ()=>{
  async function wikiExact(q){
    try{
      const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=600&titles=' + encodeURIComponent(q);
      const r = await fetch(url); const j = await r.json();
      const pages = Object.values(j.query.pages || {}); const p = pages[0];
      if(p && !p.missing) return { title: p.title, extract: p.extract||'', url: 'https://en.wikipedia.org/?curid='+p.pageid, thumbnail: p.thumbnail && p.thumbnail.source };
    }catch(e){ }
    return null;
  }
  async function wikiSearch(q){
    try{
      const sUrl = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=' + encodeURIComponent(q) + '&srlimit=8';
      const sr = await fetch(sUrl).then(r=>r.json());
      const results = sr.query && sr.query.search ? sr.query.search : [];
      const pageids = results.map(r=>r.pageid).join('|');
      let pages={};
      if(pageids){
        const infoUrl = 'https://en.wikipedia.org/w/api.php?action=query&pageids=' + pageids + '&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=400&format=json&origin=*';
        const inf = await fetch(infoUrl).then(r=>r.json());
        pages = inf.query && inf.query.pages ? inf.query.pages : {};
      }
      return results.map(r=>{ const p = pages[r.pageid]||{}; return { title: r.title, snippet: (p.extract||r.snippet||'').slice(0,800), extract:p.extract||'', url:'https://en.wikipedia.org/?curid='+r.pageid, thumbnail: p.thumbnail && p.thumbnail.source }; });
    }catch(e){ return []; }
  }

  // main search UI function
  async function doSearch(query){
    if(!query) return;
    const view = document.getElementById('view'); view.innerHTML = '';
    // channel handle detection
    const qtrim = query.trim();
    if(qtrim.startsWith('@')){ const h = qtrim.slice(1).toLowerCase(); const users = Data.getUsers(); const found = users.find(u=> u.channel && u.channel.handle.toLowerCase()===h); if(found){ location.hash = '#channel=@'+found.channel.handle; return; } }

    // show Information banner
    const infoBanner = document.createElement('div'); infoBanner.className='panel';
    infoBanner.innerHTML = `<div class="special-info">Information by Gyan Technology</div>`;
    view.appendChild(infoBanner);

    // Try exact
    const exact = await wikiExact(query);
    let webResults=[];
    if(exact){ webResults.push(exact); const searchRes = await wikiSearch(query); searchRes.forEach(s=>{ if(webResults.length<6 && s.title.toLowerCase() !== exact.title.toLowerCase()) webResults.push(s); }); }
    else { webResults = await wikiSearch(query); }

    // contributions local
    const contributions = Data.getContributions().filter(c=> (c.title||'').toLowerCase().includes(query.toLowerCase()) || (c.content||'').toLowerCase().includes(query.toLowerCase()));

    // render web results
    webResults.forEach(w=>{
      const tpl = document.getElementById('searchResultTpl').content.cloneNode(true);
      tpl.querySelector('.res-title').textContent = w.title;
      tpl.querySelector('.res-snippet').textContent = (w.extract||w.snippet||'').slice(0,500);
      tpl.querySelector('.res-source').textContent = w.url || '';
      view.appendChild(tpl);
    });

    // render contributions
    if(contributions.length){
      const cblock = document.createElement('div'); cblock.className='panel'; cblock.innerHTML = '<h3>Community Contributions</h3>';
      contributions.forEach(c=>{
        const el = document.createElement('div'); el.className='result-block'; el.innerHTML = `<div class="special-info">Information by Gyan Technology (Community)</div><h4>${c.title}</h4><div class="muted">${c.content}</div><div class="muted">Source: ${c.source||'—'}</div><div style="margin-top:6px"><button class="report" data-id="${c.id}">Report</button><button class="delete hidden" data-id="${c.id}">Delete</button></div>`;
        // wire report/delete later after appended
        cblock.appendChild(el);
      });
      view.appendChild(cblock);
    }

    // Wire report & delete buttons (after rendering)
    view.querySelectorAll('.report').forEach(b=> b.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id; const res = Data.reportContribution(id);
      if(res && res.deleted){ alert('Contribution auto-deleted due to reports'); doSearch(query); }
      else if(res){ alert('Reported. Reports count: '+res.reports); }
    }));
    // show delete buttons only for contributions authored by active user
    const active = AuthModule.getActive();
    view.querySelectorAll('.result-block').forEach(block=>{
      const del = block.querySelector('.delete'); if(!del) return;
      const id = del.dataset.id;
      const c = Data.getContributions().find(x=>x.id===id);
      if(active && c && c.author === active.email) del.classList.remove('hidden');
      del.addEventListener('click', ()=>{
        if(!confirm('Delete this contribution permanently?')) return;
        Data.deleteContribution(id); alert('Deleted'); doSearch(query);
      });
    });

    // add "Add Contribution" button if active and age >=18
    const addBtn = document.createElement('div'); addBtn.className='panel'; addBtn.innerHTML = '<button id="openAddContrib">Add Information</button>';
    view.appendChild(addBtn);
    document.getElementById('openAddContrib').addEventListener('click', ()=>{
      const act = AuthModule.getActive();
      if(!act){ alert('Sign in to add info'); document.getElementById('authModal').classList.remove('hidden'); return; }
      const acc = AuthModule.getAccount ? AuthModule.getAccount(act.email) : null;
      const dob = acc?.dob || '';
      if(!AuthModule.isAdult(dob)){ alert('Only users age 18+ can add information'); return; }
      // open contrib modal
      document.getElementById('contribModal').classList.remove('hidden');
      document.getElementById('contribMsg').textContent = '';
      // wire add
      document.getElementById('contribAddBtn').onclick = ()=>{
        const t = document.getElementById('contribTitle').value.trim(); const c = document.getElementById('contribContent').value.trim(); const s = document.getElementById('contribSource').value.trim();
        if(!t || !c){ document.getElementById('contribMsg').textContent = 'Title and content required'; return; }
        const id = Data.uid('contrib'); Data.addContribution({ id, title: t, content: c, source: s, author: act.email, createdAt: new Date().toISOString() });
        document.getElementById('contribModal').classList.add('hidden'); alert('Contribution added'); doSearch(query);
      };
      document.getElementById('contribCancelBtn').onclick = ()=> document.getElementById('contribModal').classList.add('hidden');
    });
  }

  // expose
  window.goDeepSearch = doSearch;
});