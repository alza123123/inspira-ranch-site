(function () {
  'use strict';

  const CHATBOT_ENDPOINT = '/.netlify/functions/chat';

  const FALLBACK =
    'Thanks for reaching out! For immediate assistance call +1 (832) 451-5923 or email marketing@konfronta.mx';

  const COLORS = {
    navy: '#0D1B3E',
    navyDark: '#080C14',
    navyLight: '#162040',
    gold: '#C9A84C',
    goldHover: '#e2bc5a',
    white: '#FFFFFF',
    offWhite: '#F5F0E8',
    gray: '#8A95A3',
    bubble: '#1a2550',
    userBubble: '#C9A84C',
    userText: '#0D1B3E',
  };

  const sessionId = Math.random().toString(36).slice(2);
  let isOpen = false;
  let isWaiting = false;
  let conversationHistory = [];

  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'alza-chat-styles';
    style.textContent = `
      #alza-chat-btn {
        position: fixed;
        bottom: 28px;
        right: 28px;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: ${COLORS.navy};
        border: 2px solid ${COLORS.gold};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        box-shadow: 0 4px 24px rgba(0,0,0,0.35);
        transition: background 0.2s, transform 0.2s;
        outline: none;
      }
      #alza-chat-btn:hover { background: ${COLORS.navyLight}; transform: scale(1.06); }
      #alza-chat-btn:focus-visible { outline: 2px solid ${COLORS.gold}; outline-offset: 3px; }
      #alza-chat-btn svg { width: 26px; height: 26px; }

      #alza-chat-panel {
        position: fixed;
        bottom: 100px;
        right: 28px;
        width: 360px;
        height: 500px;
        background: ${COLORS.navy};
        border: 1px solid rgba(201,168,76,0.25);
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        z-index: 9998;
        box-shadow: 0 8px 48px rgba(0,0,0,0.5);
        overflow: hidden;
        transform: translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease, transform 0.22s ease;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      #alza-chat-panel.alza-open {
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;
      }

      #alza-chat-header {
        background: ${COLORS.navyDark};
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(201,168,76,0.18);
        flex-shrink: 0;
      }
      #alza-chat-header-title {
        font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
        color: ${COLORS.offWhite};
        font-size: 17px;
        font-weight: 600;
        letter-spacing: 0.3px;
      }
      #alza-chat-header-sub {
        color: ${COLORS.gold};
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-top: 2px;
      }
      #alza-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: ${COLORS.gray};
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        line-height: 1;
        transition: color 0.15s;
        outline: none;
      }
      #alza-close-btn:hover { color: ${COLORS.white}; }
      #alza-close-btn:focus-visible { outline: 2px solid ${COLORS.gold}; }
      #alza-close-btn svg { width: 18px; height: 18px; }

      #alza-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        scroll-behavior: smooth;
      }
      #alza-messages::-webkit-scrollbar { width: 4px; }
      #alza-messages::-webkit-scrollbar-track { background: transparent; }
      #alza-messages::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 4px; }

      .alza-msg {
        max-width: 82%;
        padding: 9px 13px;
        border-radius: 12px;
        font-size: 13.5px;
        line-height: 1.55;
        word-wrap: break-word;
      }
      .alza-msg-bot {
        background: ${COLORS.bubble};
        color: ${COLORS.offWhite};
        align-self: flex-start;
        border-bottom-left-radius: 3px;
      }
      .alza-msg-user {
        background: ${COLORS.userBubble};
        color: ${COLORS.userText};
        align-self: flex-end;
        border-bottom-right-radius: 3px;
        font-weight: 500;
      }

      #alza-typing {
        align-self: flex-start;
        background: ${COLORS.bubble};
        border-radius: 12px;
        border-bottom-left-radius: 3px;
        padding: 10px 14px;
        display: none;
      }
      #alza-typing.alza-visible { display: flex; align-items: center; gap: 4px; }
      .alza-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${COLORS.gold};
        animation: alzaBounce 1.1s infinite ease-in-out;
      }
      .alza-dot:nth-child(2) { animation-delay: 0.18s; }
      .alza-dot:nth-child(3) { animation-delay: 0.36s; }
      @keyframes alzaBounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
        30% { transform: translateY(-5px); opacity: 1; }
      }

      #alza-input-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px;
        border-top: 1px solid rgba(201,168,76,0.15);
        background: ${COLORS.navyDark};
        flex-shrink: 0;
      }
      #alza-input {
        flex: 1;
        background: ${COLORS.navyLight};
        border: 1px solid rgba(201,168,76,0.2);
        border-radius: 8px;
        color: ${COLORS.white};
        font-size: 13px;
        font-family: inherit;
        padding: 9px 12px;
        outline: none;
        transition: border-color 0.15s;
        resize: none;
      }
      #alza-input::placeholder { color: ${COLORS.gray}; }
      #alza-input:focus { border-color: rgba(201,168,76,0.55); }

      #alza-send-btn {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: ${COLORS.gold};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s, transform 0.1s;
        outline: none;
      }
      #alza-send-btn:hover { background: ${COLORS.goldHover}; }
      #alza-send-btn:active { transform: scale(0.94); }
      #alza-send-btn:focus-visible { outline: 2px solid ${COLORS.white}; }
      #alza-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      #alza-send-btn svg { width: 17px; height: 17px; }

      #alza-footer {
        text-align: center;
        padding: 5px 0 7px;
        font-size: 9px;
        color: rgba(138,149,163,0.6);
        letter-spacing: 0.5px;
        background: ${COLORS.navyDark};
        flex-shrink: 0;
      }

      @media (max-width: 420px) {
        #alza-chat-panel {
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100dvh;
          border-radius: 0;
        }
        #alza-chat-btn { bottom: 16px; right: 16px; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildUI() {
    const btn = document.createElement('button');
    btn.id = 'alza-chat-btn';
    btn.setAttribute('aria-label', 'Open chat with Inspira Ranch');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${COLORS.gold}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

    const panel = document.createElement('div');
    panel.id = 'alza-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Inspira Ranch chat assistant');
    panel.innerHTML = `
      <div id="alza-chat-header">
        <div>
          <div id="alza-chat-header-title">Inspira Ranch</div>
          <div id="alza-chat-header-sub">Live Assistant</div>
        </div>
        <button id="alza-close-btn" aria-label="Close chat">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="alza-messages">
        <div class="alza-msg alza-msg-bot">Hi! Welcome to Inspira Ranch 👋 How can we help you today? / ¡Hola! ¿Cómo podemos ayudarte?</div>
        <div id="alza-typing"><span class="alza-dot"></span><span class="alza-dot"></span><span class="alza-dot"></span></div>
      </div>
      <div id="alza-input-bar">
        <input id="alza-input" type="text" placeholder="Message us in English or Spanish..." maxlength="500" autocomplete="off" />
        <button id="alza-send-btn" aria-label="Send message">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${COLORS.navyDark}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
      <div id="alza-footer">Powered by ALZA</div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  function togglePanel(open) {
    isOpen = typeof open === 'boolean' ? open : !isOpen;
    const panel = document.getElementById('alza-chat-panel');
    const btn = document.getElementById('alza-chat-btn');
    if (isOpen) {
      panel.classList.add('alza-open');
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(() => {
        const input = document.getElementById('alza-input');
        if (input) input.focus();
      }, 230);
    } else {
      panel.classList.remove('alza-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function scrollToBottom() {
    const msgs = document.getElementById('alza-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function appendMessage(text, role) {
    const typing = document.getElementById('alza-typing');
    const msgs = document.getElementById('alza-messages');
    const div = document.createElement('div');
    div.className = `alza-msg alza-msg-${role}`;
    div.textContent = text;
    msgs.insertBefore(div, typing);
    scrollToBottom();
  }

  function setWaiting(active) {
    isWaiting = active;
    const typing = document.getElementById('alza-typing');
    const sendBtn = document.getElementById('alza-send-btn');
    const input = document.getElementById('alza-input');
    if (typing) typing.className = active ? 'alza-visible' : '';
    if (sendBtn) sendBtn.disabled = active;
    if (input) input.disabled = active;
    if (active) scrollToBottom();
  }

  async function sendMessage() {
    if (isWaiting) return;
    const input = document.getElementById('alza-input');
    const userMessage = input.value.trim();
    if (!userMessage) return;
    input.value = '';
    appendMessage(userMessage, 'user');
    setWaiting(true);

    conversationHistory.push({ role: 'user', content: userMessage });
    if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);

    if (!CHATBOT_ENDPOINT) {
      setTimeout(() => {
        setWaiting(false);
        const fallbackReply = FALLBACK;
        conversationHistory.push({ role: 'assistant', content: fallbackReply });
        appendMessage(fallbackReply, 'bot');
      }, 800);
      return;
    }

    try {
      const res = await fetch(CHATBOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory.slice(0, -1),
        }),
      });
      const data = await res.json();
      const reply = data.reply || FALLBACK;
      setWaiting(false);
      conversationHistory.push({ role: 'assistant', content: reply });
      if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
      appendMessage(reply, 'bot');
    } catch (_) {
      setWaiting(false);
      conversationHistory.push({ role: 'assistant', content: FALLBACK });
      appendMessage(FALLBACK, 'bot');
    }
  }

  function bindEvents() {
    document.getElementById('alza-chat-btn').addEventListener('click', () => togglePanel());
    document.getElementById('alza-close-btn').addEventListener('click', () => togglePanel(false));
    document.getElementById('alza-send-btn').addEventListener('click', sendMessage);
    document.getElementById('alza-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) togglePanel(false);
    });
  }

  function init() {
    injectStyles();
    buildUI();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
