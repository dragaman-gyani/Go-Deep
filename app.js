// app.js - init: Data, Assets, wire topbar, profile, AI button, auth modal behaviour
document.addEventListener('DOMContentLoaded', async ()=>{
  await Data.init();
  await Assets.load(['assets/logo.xml','assets/ai-icon.xml','assets/avatar-placeholder.xml']).catch(()=>{});
  const logo = document.getElementById('logo'); if(logo) logo.src = Assets.getUrl('assets/logo.xml');
  // set profile icon
  AuthModule.renderProfile();

  // topbar AI button open AI page
  document.getElementById('aiBtn').addEventListener('click', ()=> { location.hash = '#ai'; });

  // profile click -> auth modal
  document.getElementById('profileWrap').addEventListener('click', ()=> { document.getElementById('authModal').classList.remove('hidden'); });

  // auth modal tabs
  document.getElementById('tabSign').addEventListener('click', ()=>{ document.getElementById('signForm').classList.remove('hidden'); document.getElementById('createForm').classList.add('hidden'); });
  document.getElementById('tabCreate').addEventListener('click', ()=>{ document.getElementById('signForm').classList.add('hidden'); document.getElementById('createForm').classList.remove('hidden'); });

  // sign in/create buttons
  document.getElementById('signInBtn').addEventListener('click', async ()=>{
    const email = document.getElementById('signEmail').value.trim();
    const pass = document.getElementById('signPassword').value;
    if(!email||!pass){ document.getElementById('signMsg').textContent='Enter credentials'; return; }
    const res = await AuthModule.signIn(email, pass);
    if(!res.ok){ document.getElementById('signMsg').textContent = res.msg || 'Failed'; return; }
    document.getElementById('authModal').classList.add('hidden'); AuthModule.renderProfile(); alert('Signed in'); location.hash = '#home';
  });

  document.getElementById('openCreateBtn').addEventListener('click', ()=>{ document.getElementById('signForm').classList.add('hidden'); document.getElementById('createForm').classList.remove('hidden'); });

  document.getElementById('backSignBtn').addEventListener('click', ()=>{ document.getElementById('createForm').classList.add('hidden'); document.getElementById('signForm').classList.remove('hidden'); });

  document.getElementById('createAccountBtn').addEventListener('click', async ()=>{
    const name = document.getElementById('createName').value.trim(); const email = document.getElementById('createEmail').value.trim(); const pass = document.getElementById('createPassword').value; const conf = document.getElementById('createConfirm').value; const dob = document.getElementById('createDob').value;
    if(!name||!email||!pass||!conf||!dob){ document.getElementById('createMsg').textContent='All fields required'; return; }
    if(pass !== conf){ document.getElementById('createMsg').textContent='Passwords do not match'; return; }
    const res = await AuthModule.createAccount(name, email, pass, dob);
    if(!res.ok){ document.getElementById('createMsg').textContent = res.msg; return; }
    document.getElementById('authModal').classList.add('hidden'); AuthModule.renderProfile(); alert('Account created & signed in'); location.hash = '#home';
  });

  document.getElementById('closeAuth').addEventListener('click', ()=> document.getElementById('authModal').classList.add('hidden'));

  // wire search enter to route
  document.getElementById('searchInput').addEventListener('keydown', (e)=> { if(e.key==='Enter'){ const q=document.getElementById('searchInput').value.trim(); if(q) { location.hash = '#search'; window.goDeepSearch && window.goDeepSearch(q); } }});
  document.getElementById('searchBtn').addEventListener('click', ()=> { const q=document.getElementById('searchInput').value.trim(); if(q){ location.hash = '#search'; window.goDeepSearch && window.goDeepSearch(q); } });

  // close contrib modal handlers in search.js
  // init router
  window.router && window.router();
});