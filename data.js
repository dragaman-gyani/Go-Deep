/* Data layer:
   - Loads data/users.xml and data/contributions.xml into localStorage if absent
   - Provides getContributions / addContribution / deleteContribution / reportContribution
   - Contributions stored as XML string in localStorage key 'gd_contributions_xml'
*/
const Data = (function(){
  const KEY_USERS='gd_users_xml', KEY_CONY='gd_contribs_xml';
  async function init(){
    await Assets.load(['assets/logo.xml','assets/ai-icon.xml','assets/avatar-placeholder.xml']).catch(()=>{});
    if(!localStorage.getItem(KEY_USERS)) await fetchAndStore('data/users.xml', KEY_USERS);
    if(!localStorage.getItem(KEY_CONY)) await fetchAndStore('data/contributions.xml', KEY_CONY);
  }
  async function fetchAndStore(path,key){
    try{ const r = await fetch(path); if(!r.ok) throw new Error(); const txt=await r.text(); localStorage.setItem(key, txt); }catch(e){ localStorage.setItem(key, '<contributions/>'); }
  }
  function getUsers(){
    const xml = localStorage.getItem(KEY_USERS) || '<users/>';
    const doc = new DOMParser().parseFromString(xml,'application/xml');
    return Array.from(doc.querySelectorAll('user')).map(u=>({
      id: u.getAttribute('id'),
      name: text(u,'name'),
      email: text(u,'email'),
      avatar: text(u,'avatar') || 'assets/avatar-placeholder.xml',
      dob: text(u,'dob')
    }));
  }
  function text(node, sel, def=''){ const el=node.querySelector(sel); return el?el.textContent:def; }

  function getContributions(){
    const xml = localStorage.getItem(KEY_CONY) || '<contributions/>';
    const doc = new DOMParser().parseFromString(xml,'application/xml');
    return Array.from(doc.querySelectorAll('contribution')).map(c=>({
      id: c.getAttribute('id'),
      title: text(c,'title'),
      content: text(c,'content'),
      source: text(c,'source'),
      author: text(c,'author'),
      createdAt: text(c,'createdAt'),
      reports: parseInt(text(c,'reports')||'0')
    }));
  }

  function addContribution(obj){
    const xml = localStorage.getItem(KEY_CONY) || '<contributions/>'; const doc = new DOMParser().parseFromString(xml,'application/xml');
    const node = doc.createElement('contribution'); node.setAttribute('id', obj.id);
    const t = doc.createElement('title'); t.textContent = obj.title; node.appendChild(t);
    const c = doc.createElement('content'); c.textContent = obj.content; node.appendChild(c);
    const s = doc.createElement('source'); s.textContent = obj.source || ''; node.appendChild(s);
    const a = doc.createElement('author'); a.textContent = obj.author; node.appendChild(a);
    const ca = doc.createElement('createdAt'); ca.textContent = obj.createdAt || new Date().toISOString(); node.appendChild(ca);
    const rpt = doc.createElement('reports'); rpt.textContent = '0'; node.appendChild(rpt);
    doc.documentElement.appendChild(node);
    localStorage.setItem(KEY_CONY, new XMLSerializer().serializeToString(doc));
  }

  function deleteContribution(id){
    const xml = localStorage.getItem(KEY_CONY) || '<contributions/>'; const doc = new DOMParser().parseFromString(xml,'application/xml');
    const node = doc.querySelector(`contribution[id="${id}"]`); if(node){ node.remove(); localStorage.setItem(KEY_CONY, new XMLSerializer().serializeToString(doc)); return true; } return false;
  }

  function reportContribution(id){
    const xml = localStorage.getItem(KEY_CONY) || '<contributions/>'; const doc = new DOMParser().parseFromString(xml,'application/xml');
    const node = doc.querySelector(`contribution[id="${id}"]`); if(!node) return null;
    let r = node.querySelector('reports'); if(!r){ r = doc.createElement('reports'); node.appendChild(r); }
    r.textContent = String((parseInt(r.textContent||'0')||0)+1);
    const val = parseInt(r.textContent);
    // auto-delete if >=3 reports
    if(val >= 3){ node.remove(); localStorage.setItem(KEY_CONY, new XMLSerializer().serializeToString(doc)); return {deleted:true}; }
    localStorage.setItem(KEY_CONY, new XMLSerializer().serializeToString(doc));
    return {deleted:false, reports: val};
  }

  function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

  return { init, getUsers, getContributions, addContribution, deleteContribution, reportContribution, uid };
})();