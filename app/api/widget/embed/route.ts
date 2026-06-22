import { NextResponse } from "next/server";

/**
 * GET /api/widget/embed.js
 * Returns a self-contained JavaScript widget embed script.
 * Usage: <script src=".../api/widget/embed.js" data-widget-id="xxx" async></script>
 */
export async function GET() {
  const js = `
(function() {
  // Find script tag
  var scripts = document.querySelectorAll('script[data-public-key]');
  var script = scripts[scripts.length - 1];
  if (!script) return;
  var widgetId = script.getAttribute('data-public-key');
  if (!widgetId) return;

  var baseUrl = script.src.replace(/\\/api\\/widget\\/embed.*$/, '');
  var configUrl = baseUrl + '/api/widget/config?publicKey=' + widgetId;

  // Fetch config, then render widget
  fetch(configUrl)
    .then(function(r) { return r.json(); })
    .then(function(config) {
      if (config.error) return;
      renderWidget(config, baseUrl);
    })
    .catch(function() {});

  function renderWidget(config, baseUrl) {
    var theme = config.theme || {};
    var primary = theme.primaryColor || '#3B82F6';
    var bg = theme.backgroundColor || '#FFFFFF';
    var text = theme.textColor || '#1F2937';
    var welcome = theme.welcomeMessage || 'Hi! How can I help you?';
    var position = theme.position || 'bottom-right';
    var quickReplies = theme.quickReplies || [];
    var widgetName = config.name || 'Chat';

    // Inject styles
    var style = document.createElement('style');
    style.textContent = [
      '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");',
      '#mimotes-widget * { box-sizing: border-box; margin: 0; padding: 0; }',
      '#mimotes-widget { position: fixed; z-index: 2147483647; font-family: "Inter", system-ui, sans-serif; font-size: 14px; }',
      '#mimotes-widget.pos-bottom-right { bottom: 20px; right: 20px; }',
      '#mimotes-widget.pos-bottom-left { bottom: 20px; left: 20px; }',
      '#mimotes-widget.pos-top-right { top: 20px; right: 20px; }',
      '#mimotes-widget.pos-top-left { top: 20px; left: 20px; }',
      '#mimotes-bubble { width: 56px; height: 56px; border-radius: 50%; background: ' + primary + '; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s; }',
      '#mimotes-bubble:hover { transform: scale(1.1); }',
      '#mimotes-bubble svg { width: 24px; height: 24px; fill: white; }',
      '#mimotes-chat { display: none; width: 350px; height: 500px; max-height: 80vh; background: ' + bg + '; color: ' + text + '; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); flex-direction: column; overflow: hidden; border: 1px solid rgba(0,0,0,0.05); }',
      '#mimotes-chat.open { display: flex; }',
      '#mimotes-header { background: ' + primary + '; color: white; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }',
      '#mimotes-header-info { display: flex; align-items: center; gap: 10px; }',
      '#mimotes-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }',
      '#mimotes-avatar svg { width: 18px; height: 18px; fill: white; }',
      '#mimotes-header-text p:first-child { font-weight: 600; font-size: 14px; }',
      '#mimotes-header-text p:last-child { font-size: 11px; opacity: 0.8; }',
      '#mimotes-close { background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }',
      '#mimotes-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }',
      '#mimotes-msg { max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.5; word-wrap: break-word; }',
      '#mimotes-msg.user { align-self: flex-end; background: ' + primary + '; color: white; border-bottom-right-radius: 4px; }',
      '#mimotes-msg.bot { align-self: flex-start; background: ' + bg + '; color: ' + text + '; border: 1px solid rgba(0,0,0,0.06); border-bottom-left-radius: 4px; }',
      '#mimotes-quick-replies { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 8px; }',
      '#mimotes-quick-replies button { background: none; border: 1px solid ' + primary + '; color: ' + primary + '; padding: 5px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; transition: all 0.15s; }',
      '#mimotes-quick-replies button:hover { background: ' + primary + '; color: white; }',
      '#mimotes-input-area { padding: 10px 12px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 8px; align-items: center; flex-shrink: 0; }',
      '#mimotes-input { flex: 1; border: 1px solid rgba(0,0,0,0.1); border-radius: 24px; padding: 8px 14px; font-size: 13px; outline: none; font-family: inherit; color: ' + text + '; background: ' + bg + '; }',
      '#mimotes-input:focus { border-color: ' + primary + '; }',
      '#mimotes-send { width: 34px; height: 34px; border-radius: 50%; background: ' + primary + '; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }',
      '#mimotes-send:disabled { opacity: 0.5; cursor: not-allowed; }',
      '#mimotes-send svg { width: 16px; height: 16px; fill: white; }',
      '#mimotes-typing { display: none; align-self: flex-start; padding: 10px 14px; background: #f3f4f6; border-radius: 16px; border-bottom-left-radius: 4px; }',
      '#mimotes-typing.show { display: block; }',
      '#mimotes-typing span { display: inline-block; width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; margin: 0 2px; animation: mimotes-bounce 1.2s infinite; }',
      '#mimotes-typing span:nth-child(2) { animation-delay: 0.2s; }',
      '#mimotes-typing span:nth-child(3) { animation-delay: 0.4s; }',
      '@keyframes mimotes-bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }',
      '@media (max-width: 480px) { #mimotes-chat { width: calc(100vw - 32px); height: calc(100vh - 120px); position: fixed; bottom: 80px; right: 16px; } }'
    ].join('\\n');
    document.head.appendChild(style);

    // Build HTML
    var widget = document.createElement('div');
    widget.id = 'mimotes-widget';
    widget.className = 'pos-' + position;

    var chatOpen = false;

    function toggleChat() {
      chatOpen = !chatOpen;
      chat.className = chatOpen ? 'open' : '';
      bubble.innerHTML = chatOpen
        ? '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
    }

    var bubble = document.createElement('button');
    bubble.id = 'mimotes-bubble';
    bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
    bubble.onclick = toggleChat;

    var quickRepliesHtml = '';
    if (quickReplies.length > 0) {
      quickRepliesHtml = '<div id="mimotes-quick-replies">' +
        quickReplies.map(function(r) { return '<button>' + escapeHtml(r) + '</button>'; }).join('') +
        '</div>';
    }

    widget.innerHTML =
      '<div id="mimotes-chat">' +
        '<div id="mimotes-header">' +
          '<div id="mimotes-header-info">' +
            '<div id="mimotes-avatar"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg></div>' +
            '<div id="mimotes-header-text"><p>' + escapeHtml(widgetName) + '</p><p>Online</p></div>' +
          '</div>' +
          '<button id="mimotes-close">✕</button>' +
        '</div>' +
        '<div id="mimotes-messages">' +
          '<div class="bot" id="mimotes-msg-0">' + escapeHtml(welcome) + '</div>' +
        '</div>' +
        quickRepliesHtml +
        '<div id="mimotes-typing"><span></span><span></span><span></span></div>' +
        '<div id="mimotes-input-area">' +
          '<input id="mimotes-input" placeholder="Ketik pesan..." autocomplete="off" />' +
          '<button id="mimotes-send" disabled><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>' +
        '</div>' +
      '</div>';

    widget.appendChild(bubble);
    document.body.appendChild(widget);

    // Event handlers
    var messagesEl = document.getElementById('mimotes-messages');
    var inputEl = document.getElementById('mimotes-input');
    var sendBtn = document.getElementById('mimotes-send');
    var typingEl = document.getElementById('mimotes-typing');
    var closeBtn = document.getElementById('mimotes-close');
    var quickRepliesEl = document.getElementById('mimotes-quick-replies');
    var msgCount = 1;

    closeBtn.onclick = toggleChat;

    inputEl.oninput = function() {
      sendBtn.disabled = !inputEl.value.trim();
    };

    inputEl.onkeydown = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    sendBtn.onclick = sendMessage;

    // Quick reply handlers
    if (quickRepliesEl) {
      quickRepliesEl.querySelectorAll('button').forEach(function(btn) {
        btn.onclick = function() {
          inputEl.value = btn.textContent;
          sendMessage();
          quickRepliesEl.style.display = 'none';
        };
      });
    }

    function sendMessage() {
      var msg = inputEl.value.trim();
      if (!msg) return;

      addMessage(msg, 'user');
      inputEl.value = '';
      sendBtn.disabled = true;
      typingEl.classList.add('show');
      messagesEl.scrollTop = messagesEl.scrollHeight;

      // Send to API
      fetch(baseUrl + '/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: widgetId,
          message: msg,
          sessionId: getSessionId()
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        typingEl.classList.remove('show');
        addMessage(data.reply || data.message || 'Maaf, terjadi kesalahan.', 'bot');
      })
      .catch(function() {
        typingEl.classList.remove('show');
        addMessage('Maaf, terjadi kesalahan. Coba lagi.', 'bot');
      });
    }

    function addMessage(text, role) {
      var div = document.createElement('div');
      div.id = 'mimotes-msg-' + msgCount++;
      div.className = role;
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function getSessionId() {
      var key = 'mimotes_sid_' + widgetId;
      var sid = localStorage.getItem(key);
      if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem(key, sid);
      }
      return sid;
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }
})();
`;

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
