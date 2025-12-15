/* auth.js - account creation/sign-in with PBKDF2 and DOB check
   - createAccount(name,email,password,dob): email must end with @clash.gyan; dob used to check age>=18
   - signIn(email,password): verifies PBKDF2 hash
   - active session stored under 'gd_active'
*/
const AuthModule = (function(){
  const ACC_KEY = 'gd_accounts_v1';
  const ACTIVE_KEY = 'gd_active_v1';

  function load(){ try{ return JSON.parse(localStorage.getItem(ACC_KEY) || '{}'); }catch(e){ return {}; } }
  function save(m){ localStorage.setItem(ACC_KEY, JSON.stringify(m)); }

  function bufToB64(buf){ const bytes=new Uint8Array(buf); let s=''; for(const b of bytes) s+=String.fromCharCode(b); return btoa(s); }
  function b64ToBuf(b64){ const bin = atob(b64); const arr = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return arr.buffer; }

  async function genSalt(){ const arr = crypto.getRandomValues(new Uint8Array(16)); return bufToB64(arr.buffer); }
  async function derive(password, saltB64, iterations=60000){
    const salt = b64ToBuf(saltB64); const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations, hash:'SHA-256'}, key, 256);
    return bufToB64(derived);
  }

  function setActive(obj, remember=true){ const p = JSON.stringify(obj); if(remember) localStorage.setItem(ACTIVE_KEY,p); else sessionStorage.setItem(ACTIVE_KEY,p); renderProfile(); }
  function getActive(){ try{ return JSON.parse(sessionStorage.getItem(ACTIVE_KEY) || localStorage.getItem(ACTIVE_KEY) || 'null'); }catch(e){ return null; } }
  function signOut(){ sessionStorage.removeItem(ACTIVE_KEY); localStorage.removeItem(ACTIVE_KEY); renderProfile(); }

  function isAdult(dobStr){
    if(!dobStr) return false;
    const dob = new Date(dobStr); const diff = Date.now() - dob.getTime(); const age = diff / (1000*60*60*24*365.25); return age >= 18;
  }

  async function createAccount(name, email, password, dob){
    email = (email||'').trim().toLowerCase();
    if(!email.endsWith('@clash.gyan')) return {ok:false, msg:'Email must end with @clash.gyan'};
    if(!isAdult(dob)) return {ok:false, msg:'You must be 18 or older to create an account'};
    const accs = load();
    if(accs[email]) return {ok:false, msg:'Account exists'};
    const salt = await genSalt();
    const hash = await derive(password, salt);
    accs[email] = { name, email, salt, hash, avatar:'', dob, channelCreated:false, channelHandle:'', channelUrl:'' };
    save(accs);
    setActive({email,name,avatar:''}, true);
    // also add to Data.users for channel listing
    Data.saveUser({ id: email, name, email, avatar:'', channel: null });
    return {ok:true, user: accs[email]};
  }

  async function signIn(email, password){
    email = (email||'').trim().toLowerCase();
    const accs = load();
    const a = accs[email];
    if(!a) return {ok:false, msg:'Account not found'};
    const derived = await derive(password, a.salt);
    if(derived === a.hash){ setActive({email: a.email, name: a.name, avatar: a.avatar}, true); return {ok:true, user: a}; }
    return {ok:false, msg:'Invalid credentials'};
  }

  function getAccount(email){ const accs = load(); return accs[email] || null; }

  function updateAvatar(email, dataUrl){
    const accs = load(); if(!accs[email]) return; accs[email].avatar = dataUrl; save(accs); if(getActive() && getActive().email === email) setActive({email, name: accs[email].name, avatar: dataUrl}, true);
  }

  async function setChannel(email, {url,name,handle,desc}){
    const accs = load(); if(!accs[email]) return {ok:false, msg:'Account not found'};
    if(accs[email].channelCreated) return {ok:false, msg:'Channel already created'};
    // ensure unique handle
    for(const k in accs) if(accs[k].channelHandle && accs[k].channelHandle.toLowerCase() === handle.toLowerCase()) return {ok:false, msg:'Handle taken'};
    accs[email].channelCreated = true; accs[email].channelHandle = handle; accs[email].channelUrl = url; accs[email].channelName = name; accs[email].channelDesc = desc; save(accs);
    Data.saveUser({ id: email, name: accs[email].name, email, avatar: accs[email].avatar || 'assets/avatar-placeholder.xml', channel: { url, name, handle, desc }});
    return {ok:true};
  }

  function renderProfile(){
    const act = getActive(); const icon = document.getElementById('profileIcon'); const nameEl = document.getElementById('profileName');
    if(act){ const acc = load()[act.email]; if(acc && acc.avatar) icon.src = acc.avatar; else icon.src = generateLetterSVG(acc?.name||act.name||act.email); if(nameEl) nameEl.textContent = acc?.name || act.name; }
    else { icon.src = Assets.getUrl('assets/avatar-placeholder.xml'); if(nameEl) nameEl.textContent = 'Guest'; }
  }

  function generateLetterSVG(name){
    const letter = (name||'').trim().charAt(0).toUpperCase() || 'G';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' rx='20' fill='#37474f'/><text x='50%' y='55%' font-family='Segoe UI, Roboto, Arial' font-size='64' fill='#fff' text-anchor='middle' dominant-baseline='middle'>${letter}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  return { createAccount, signIn, signOut, getActive, getAccount, updateAvatar, setChannel, renderProfile, isAdult };
})();