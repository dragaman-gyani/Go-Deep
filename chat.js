// chat.js - AI chat UI page behavior and chat history storage
document.addEventListener('DOMContentLoaded', ()=>{
  async function openAIChat(){
    const tpl = document.getElementById('aiChatTpl').content.cloneNode(true);
    const view = document.getElementById('view'); view.innerHTML = ''; view.appendChild(tpl);
    // set ai icon inline
    const aiIcon = document.getElementById('aiIconInline'); aiIcon.src = Assets.getUrl ? Assets.getUrl('assets/ai-icon.xml') : 'assets/ai-icon.xml';
    const chatWin = document.getElementById('aiChatWindow'); const aiInput = document.getElementById('aiInput'); const aiSend = document.getElementById('aiSendBtn');
    const historyKey = 'gd_ai_chat_history';
    function loadHist(){ try{ return JSON.parse(localStorage.getItem(historyKey)||'[]'); }catch(e){ return []; } }
    function saveHist(h){ localStorage.setItem(historyKey, JSON.stringify(h)); }
    function renderHist(){
      chatWin.innerHTML = ''; const h = loadHist(); h.forEach(m=>{ const d = document.createElement('div'); d.className='msg ' + (m.role==='user'?'user':'bot'); d.textContent = m.text; chatWin.appendChild(d); }); chatWin.scrollTop = chatWin.scrollHeight;
    }
    renderHist();
    aiSend.addEventListener('click', async ()=>{
      const q = aiInput.value.trim(); if(!q) return;
      const h = loadHist(); h.push({role:'user', text:q}); saveHist(h); renderHist();
      aiInput.value = ''; // show loading
      const bot = document.createElement('div'); bot.className='msg bot'; bot.textContent='Thinking...'; chatWin.appendChild(bot); chatWin.scrollTop = chatWin.scrollHeight;
      const res = await AI.generateReply(q);
      // replace 'Thinking...' with actual reply
      bot.textContent = res.answer;
      h.push({role:'bot', text:res.answer}); saveHist(h);
      renderHist();
    });
  }

  // wire router 'ai' page to openAIChat
  window.openAIChat = openAIChat;
});