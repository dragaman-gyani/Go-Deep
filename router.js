// router: handle #home, #search, #ai, #contribute, #account etc.
// On #ai call openAIChat; on #search call goDeepSearch with current search input
(function(){
  function route(){
    const hash = location.hash.slice(1) || 'home';
    if(hash === 'home'){ document.getElementById('view').innerHTML = '<div class="panel"><h2>Go‑Deep</h2><p class="muted">Use search or AI chat.</p></div>'; setActive('home'); }
    else if(hash === 'search'){ const q = document.getElementById('searchInput').value.trim(); if(q) goDeepSearch(q); else { document.getElementById('view').innerHTML = '<div class="panel"><h3>Search</h3><p class="muted">Type a query above.</p></div>'; } setActive('search'); }
    else if(hash === 'ai'){ window.openAIChat && window.openAIChat(); setActive('ai'); }
    else if(hash === 'contribute'){ document.getElementById('view').innerHTML = '<div class="panel"><h3>Contributions</h3></div>'; setActive('contribute'); }
    else if(hash === 'account'){ renderAccountPage(); setActive('account'); }
    else { document.getElementById('view').innerHTML = '<div class="panel">Page not found</div>'; setActive(null); }
  }
  function setActive(route){ document.querySelectorAll('.sidebar li').forEach(li=> li.classList.toggle('active', li.dataset.route === route)); }

  window.renderAccountPage = function(){
    const act = AuthModule.getActive();
    const view = document.getElementById('view');
    if(!act){ view.innerHTML = '<div class="panel">Not signed in. Click profile to sign in.</div>'; return; }
    const acc = AuthModule.getAccount(act.email);
    view.innerHTML = `<div class="panel"><h3>Account</h3><div><strong>${acc.name}</strong> (${acc.email})</div><div class="muted">DOB: ${acc.dob || '—'}</div><div style="margin-top:8px"><button id="signOutBtn">Sign Out</button></div></div>`;
    document.getElementById('signOutBtn').addEventListener('click', ()=>{ AuthModule.signOut(); alert('Signed out'); location.hash = '#home'; });
  };

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', ()=> { document.querySelectorAll('.sidebar li').forEach(li=> li.addEventListener('click', ()=> location.hash = '#' + li.dataset.route)); route(); });
})();