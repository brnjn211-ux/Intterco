(function () {
  // CONFIGURATION
  // REPLACE THIS with your actual N8N Webhook URL
  const WEBHOOK_URL = 'https://n8n.srv1152156.hstgr.cloud/webhook/intterco-chat'; 
  
  let greeted = false;

  // Session ID for conversation continuity
  if (!sessionStorage.getItem('icChatId')) {
    sessionStorage.setItem('icChatId', 'user-' + Date.now());
  }
  let userId = sessionStorage.getItem('icChatId');

  // --- AUTO-INJECT CONTAINER ---
  function injectHTML() {
    let host = document.getElementById('intterco-chat-container');
    
    // If container doesn't exist, create it
    if (!host) {
      host = document.createElement('div');
      host.id = 'intterco-chat-container';
      document.body.appendChild(host);
    }
    
    if (host.dataset.ready === '1') return;

    host.innerHTML = `
      <div class="ic-chat-launcher" id="icChatOpen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>

      <div class="ic-chat-wrap" id="icChatWrap">
        <div class="ic-chat-window">
          <div class="ic-chat-header">
            <div class="ic-brand">
              <img src="assets/logo.png" alt="Intterco" class="ic-chat-icon">
            </div>
            <button id="icChatClose" class="ic-close">✕</button>
          </div>
          
          <div class="ic-chat-body" id="icChatBody"></div>
          
          <div class="ic-chat-input">
            <input id="icChatInput" type="text" placeholder="Initialize inquiry..." />
            <button id="icChatSend" class="ic-send">Send</button>
          </div>
        </div>
      </div>
    `;

    host.dataset.ready = '1';
  }

  // --- MESSAGING LOGIC ---
  function appendMessage(role, text) {
    const body = document.getElementById('icChatBody');
    const msg = document.createElement('div');
    msg.className = `ic-msg ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'ic-bubble';
    
    // Auto-linkify URLs
    const html = String(text || '')
      .replace(/(?:\r\n|\r|\n)/g, '<br>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:#DDAC5F;">$1</a>');

    bubble.innerHTML = html;
    msg.appendChild(bubble);
    body.appendChild(msg);
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }

  async function postMessage(message) {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId })
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return data.reply || data.message || text;
      } catch {
        return text;
      }
    } catch {
      return "System connection interrupted. Please try again.";
    }
  }

  function bindBehavior() {
    const openBtn = document.getElementById('icChatOpen');
    const closeBtn = document.getElementById('icChatClose');
    const wrap = document.getElementById('icChatWrap');
    const input = document.getElementById('icChatInput');
    const send = document.getElementById('icChatSend');

    function toggleChat(show) {
      wrap.classList.toggle('open', show);
      if (show) {
        // HIDE LAUNCHER WHEN CHAT IS OPEN
        openBtn.style.display = 'none';
        
        if (!greeted) {
          greeted = true;
          // Tech-style greeting
          appendMessage('bot', "Intterco Systems Online. How can we engineer your automation?");
        }
        input.focus();
      } else {
        // SHOW LAUNCHER WHEN CHAT IS CLOSED
        openBtn.style.display = 'flex';
      }
    }

    async function sendFlow() {
      const txt = input.value.trim();
      if (!txt) return;

      appendMessage('user', txt);
      input.value = '';
      
      // Typing placeholder
      const body = document.getElementById('icChatBody');
      const typing = document.createElement('div');
      typing.className = 'ic-msg bot';
      typing.innerHTML = `<div class="ic-bubble"><div class="ic-typing"><span></span><span></span><span></span></div></div>`;
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      // Simulated network delay or real fetch
      const reply = await postMessage(txt);
      
      typing.remove();
      appendMessage('bot', reply);
    }

    openBtn.addEventListener('click', () => toggleChat(true));
    closeBtn.addEventListener('click', () => toggleChat(false));
    send.addEventListener('click', sendFlow);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendFlow();
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    injectHTML();
    bindBehavior();
  });
})();
