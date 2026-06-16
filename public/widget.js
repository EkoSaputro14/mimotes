(function() {
  "use strict";
  // MimoNotes Widget v2 — Embeddable Chat Widget with SSE, History, A11y, SDK Hooks
  // Usage: <script src="https://domain/widget.js" data-key="pw_pub_xxx"></script>

  var scriptOrigin = null;
  var scripts = document.getElementsByTagName("script");
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].getAttribute("src") || "";
    if (src.indexOf("/widget.js") !== -1) {
      try { scriptOrigin = new URL(src).origin; } catch(e) {}
      break;
    }
  }

  var CONFIG = {
    apiUrl: scriptOrigin || window.location.origin,
    publicKey: null, widgetId: null, theme: {},
    conversationId: null, visitorId: null,
  };

  for (var i = 0; i < scripts.length; i++) {
    var key = scripts[i].getAttribute("data-key");
    if (key) { CONFIG.publicKey = key; break; }
  }
  if (!CONFIG.publicKey) { console.error("[MimoNotes Widget] No data-key attribute found"); return; }

  // Visitor ID persistence (localStorage)
  var VISITOR_KEY = "mimo_visitor_id";
  var CONV_KEY = "mimo_conversation_id";
  try { CONFIG.visitorId = localStorage.getItem(VISITOR_KEY); } catch (e) {}
  if (!CONFIG.visitorId) {
    CONFIG.visitorId = "v_" + crypto.randomUUID();
    try { localStorage.setItem(VISITOR_KEY, CONFIG.visitorId); } catch (e) {}
  }
  try { CONFIG.conversationId = sessionStorage.getItem(CONV_KEY); } catch (e) {}

  var els = {};

  // XSS-safe escaping
  function escapeHtml(text) {
    var d = document.createElement("div"); d.textContent = text; return d.innerHTML;
  }

  function apiFetch(path, opts) { return fetch(CONFIG.apiUrl + path, opts); }

  function loadConfig(callback) {
    apiFetch("/api/widget/config?publicKey=" + encodeURIComponent(CONFIG.publicKey))
      .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d) { CONFIG.widgetId = d.id; CONFIG.theme = d.theme; callback(d); })
      .catch(function(e) { console.error("[MimoNotes Widget] Config load failed:", e); });
  }

  // ── Build UI ──
  function createWidget(config) {
    var theme = config.theme;
    var container = document.createElement("div");
    container.id = "mimotes-widget";
    var cs = container.style;
    cs.position = "fixed"; cs.zIndex = "999999";
    cs.fontFamily = "-apple-system,BlinkMacSystemFont,sans-serif";
    cs.bottom = "20px";
    if (theme.position === "bottom-left") { cs.left = "20px"; } else { cs.right = "20px"; }

    // Chat window (dialog)
    var chatWindow = document.createElement("div");
    chatWindow.id = "mimotes-chat";
    chatWindow.setAttribute("role", "dialog");
    chatWindow.setAttribute("aria-label", "Chat with " + (config.name || "Assistant"));
    chatWindow.setAttribute("aria-modal", "true");
    var cws = chatWindow.style;
    cws.display = "none"; cws.width = "360px"; cws.height = "500px";
    cws.background = theme.backgroundColor; cws.borderRadius = "12px";
    cws.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
    cws.flexDirection = "column"; cws.overflow = "hidden"; cws.marginBottom = "16px";

    // Header
    var header = document.createElement("div");
    var hs = header.style;
    hs.background = theme.primaryColor; hs.color = "white"; hs.padding = "16px";
    hs.display = "flex"; hs.justifyContent = "space-between"; hs.alignItems = "center";
    var headerTitle = document.createElement("span");
    headerTitle.style.fontWeight = "600"; headerTitle.textContent = config.name;
    var closeBtn = document.createElement("button");
    closeBtn.id = "mimotes-close"; closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.style.cssText = "cursor:pointer;font-size:20px;background:none;border:none;color:white";
    closeBtn.textContent = "\u00d7";
    header.appendChild(headerTitle); header.appendChild(closeBtn);

    // Messages container
    var messages = document.createElement("div");
    messages.id = "mimotes-messages";
    messages.setAttribute("role", "log");
    messages.setAttribute("aria-live", "polite");
    messages.setAttribute("aria-relevant", "additions");
    messages.setAttribute("aria-label", "Chat messages");
    messages.style.cssText = "flex:1;overflow-y:auto;padding:16px";

    // Loading indicator
    var loading = document.createElement("div");
    loading.id = "mimotes-loading";
    loading.setAttribute("role", "status");
    loading.setAttribute("aria-label", "AI is typing...");
    loading.style.cssText = "display:none;padding:8px 16px;font-size:13px;color:#888";
    loading.textContent = "Typing...";

    // History banner
    var historyBanner = document.createElement("div");
    historyBanner.id = "mimotes-history-banner";
    historyBanner.style.cssText = "display:none;padding:8px 12px;text-align:center";
    var historyBtn = document.createElement("button");
    historyBtn.id = "mimotes-history-btn";
    historyBtn.setAttribute("aria-label", "Continue previous conversation");
    historyBtn.textContent = "Continue previous chat";
    historyBtn.style.cssText = "background:none;border:1px solid " + theme.primaryColor +
      ";border-radius:16px;padding:6px 16px;font-size:13px;color:" + theme.primaryColor + ";cursor:pointer";
    historyBanner.appendChild(historyBtn);

    // Input area
    var inputArea = document.createElement("div");
    inputArea.style.cssText = "padding:12px;border-top:1px solid #eee;display:flex;gap:8px";
    var input = document.createElement("input");
    input.id = "mimotes-input"; input.type = "text";
    input.placeholder = "Type a message...";
    input.setAttribute("aria-label", "Type your message");
    input.style.cssText = "flex:1;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:14px;outline:none";
    var sendBtn = document.createElement("button");
    sendBtn.id = "mimotes-send"; sendBtn.setAttribute("aria-label", "Send message");
    sendBtn.textContent = "Send";
    sendBtn.style.cssText = "background:" + theme.primaryColor + ";color:white;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;font-weight:600";
    inputArea.appendChild(input); inputArea.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(historyBanner);
    chatWindow.appendChild(messages);
    chatWindow.appendChild(loading);
    chatWindow.appendChild(inputArea);

    // Launcher button
    var launcher = document.createElement("button");
    launcher.id = "mimotes-launcher";
    launcher.setAttribute("aria-label", "Open chat");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.style.cssText = "width:56px;height:56px;background:" + theme.primaryColor +
      ";border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);color:white;font-size:24px;border:none";
    launcher.textContent = "\ud83d\udcac";

    container.appendChild(chatWindow);
    container.appendChild(launcher);
    document.body.appendChild(container);

    els = { container: container, chatWindow: chatWindow, messages: messages, input: input,
      sendBtn: sendBtn, closeBtn: closeBtn, launcher: launcher, loading: loading,
      historyBanner: historyBanner, historyBtn: historyBtn, inputArea: inputArea };

    addMessage(messages, theme.welcomeMessage || "Hi! How can I help you?", "assistant", theme);
    bindEvents(theme);
    checkConversationHistory();
    checkLeadCapture(config);
  }

  function bindEvents(theme) {
    els.launcher.onclick = function() { openChat(); };
    els.closeBtn.onclick = function() { closeChat(); };
    els.sendBtn.onclick = function() { sendMessage(theme); };
    els.input.onkeydown = function(e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(theme); }
    };
    els.chatWindow.addEventListener("keydown", function(e) {
      if (e.key === "Escape") { closeChat(); return; }
      if (e.key === "Tab") { trapFocus(e); }
    });
    els.historyBtn.onclick = function() { loadConversationHistory(); };
  }

  function openChat() {
    els.chatWindow.style.display = "flex";
    els.launcher.style.display = "none";
    els.launcher.setAttribute("aria-expanded", "true");
    els.input.focus();
    fire("onOpen");
  }

  function closeChat() {
    els.chatWindow.style.display = "none";
    els.launcher.style.display = "flex";
    els.launcher.setAttribute("aria-expanded", "false");
    els.launcher.focus();
    fire("onClose");
  }

  function trapFocus(e) {
    var focusable = els.chatWindow.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // ── Conversation History ──
  function checkConversationHistory() {
    if (!CONFIG.visitorId) return;
    apiFetch("/api/widget/conversations?publicKey=" + encodeURIComponent(CONFIG.publicKey) +
             "&visitorId=" + encodeURIComponent(CONFIG.visitorId))
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) {
        if (d && d.conversations && d.conversations.length > 0)
          els.historyBanner.style.display = "block";
      }).catch(function() {});
  }

  function loadConversationHistory() {
    if (!CONFIG.visitorId) return;
    apiFetch("/api/widget/conversations?publicKey=" + encodeURIComponent(CONFIG.publicKey) +
             "&visitorId=" + encodeURIComponent(CONFIG.visitorId))
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) {
        if (!d || !d.conversations || !d.conversations.length) return null;
        var conv = d.conversations[0];
        CONFIG.conversationId = conv.id;
        try { sessionStorage.setItem(CONV_KEY, conv.id); } catch (e) {}
        return apiFetch("/api/widget/conversations/" + encodeURIComponent(conv.id) +
                        "/messages?publicKey=" + encodeURIComponent(CONFIG.publicKey));
      })
      .then(function(r) { return r && r.ok ? r.json() : null; })
      .then(function(d) {
        if (!d || !d.messages) return;
        els.messages.innerHTML = "";
        els.historyBanner.style.display = "none";
        var theme = CONFIG.theme;
        for (var i = 0; i < d.messages.length; i++)
          addMessage(els.messages, d.messages[i].content, d.messages[i].role, theme);
        els.messages.scrollTop = els.messages.scrollHeight;
      }).catch(function() {});
  }

  // ── Lead Capture ──
  function checkLeadCapture(config) {
    if (!config.leadCaptureEnabled || !config.leadFields || !config.leadFields.length) return;
    try {
      var storedLead = sessionStorage.getItem('mimo_lead');
      if (storedLead) {
        CONFIG.leadData = JSON.parse(storedLead);
      } else {
        showLeadForm(config.leadFields);
      }
    } catch (e) { showLeadForm(config.leadFields); }
  }

  function showLeadForm(fields) {
    els.inputArea.style.display = 'none';

    var form = document.createElement('div');
    form.className = 'mimo-lead-form';
    form.setAttribute('role', 'form');
    form.setAttribute('aria-label', 'Contact information');
    form.style.cssText = 'padding:16px 16px 12px;border-top:1px solid #eee';

    var title = document.createElement('p');
    title.textContent = 'Please share your contact info to start chatting:';
    title.style.cssText = 'margin:0 0 12px;font-size:14px;color:' + (CONFIG.theme.textColor || '#333');
    form.appendChild(title);

    var inputs = {};

    fields.forEach(function(field) {
      var label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.style.cssText = 'display:block;margin-bottom:4px;font-size:13px;color:' + (CONFIG.theme.textColor || '#333');

      var input = document.createElement('input');
      input.type = field.type || 'text';
      input.name = field.name;
      input.placeholder = field.label;
      input.required = !!field.required;
      input.setAttribute('aria-label', field.label);
      input.style.cssText = 'width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;font-size:14px;box-sizing:border-box';

      inputs[field.name] = input;
      form.appendChild(label);
      form.appendChild(input);
    });

    var submitBtn = document.createElement('button');
    submitBtn.textContent = 'Start Chat';
    submitBtn.type = 'button';
    submitBtn.setAttribute('aria-label', 'Start chat with contact info');
    submitBtn.style.cssText = 'width:100%;padding:10px;background:' + (CONFIG.theme.primaryColor || '#6366f1') +
      ';color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600';

    submitBtn.onclick = function() {
      var leadData = {};
      var valid = true;

      fields.forEach(function(field) {
        var value = inputs[field.name].value.trim();
        if (field.required && !value) {
          valid = false;
          inputs[field.name].style.borderColor = '#ef4444';
        } else {
          inputs[field.name].style.borderColor = '#ddd';
        }
        leadData[field.name] = value;
      });

      if (!valid) return;

      CONFIG.leadData = leadData;
      try { sessionStorage.setItem('mimo_lead', JSON.stringify(leadData)); } catch (e) {}

      form.remove();
      els.inputArea.style.display = '';
      els.input.focus();

      fire('onLeadCapture', leadData);
    };

    form.appendChild(submitBtn);
    els.messages.parentNode.insertBefore(form, els.inputArea);
  }

  // ── Send Message (SSE streaming with fallback) ──
  function sendMessage(theme) {
    var text = els.input.value.trim();
    if (!text) return;
    els.input.value = "";
    addMessage(els.messages, text, "user", theme);
    els.messages.scrollTop = els.messages.scrollHeight;
    els.loading.style.display = "block";
    els.sendBtn.disabled = true;

    var body = JSON.stringify({
      publicKey: CONFIG.publicKey, message: text,
      conversationId: CONFIG.conversationId, visitorId: CONFIG.visitorId,
      lead: CONFIG.leadData || null,
    });

    fire("onMessage", { role: "user", content: text });
    sendStreaming(body, theme);
  }

  function sendStreaming(body, theme) {
    fetch(CONFIG.apiUrl + "/api/widget/chat/stream", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: body,
    })
    .then(function(response) {
      var ct = response.headers.get("Content-Type") || "";
      if (ct.indexOf("text/event-stream") === -1) {
        return response.json().then(function(d) { handleFallbackResponse(d, theme); });
      }
      handleStream(response, theme);
    })
    .catch(function(err) {
      console.warn("[MimoNotes Widget] Streaming failed, falling back:", err);
      sendFallback(body, theme);
    });
  }

  function handleStream(response, theme) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "", bubble = null, fullText = "";

    function read() {
      reader.read().then(function(result) {
        if (result.done) { finalize(bubble, fullText, theme); return; }
        buffer += decoder.decode(result.value, { stream: true });
        var parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (var i = 0; i < parts.length; i++) {
          var evt = parseSSE(parts[i]);
          if (!evt || !evt.data) continue;
          var data;
          try { data = JSON.parse(evt.data); } catch (e) { continue; }
          if (data.type === "chunk" && data.content) {
            if (!bubble) bubble = addMessage(els.messages, "", "assistant", theme);
            fullText += data.content;
            bubble.textContent = fullText;
            els.messages.scrollTop = els.messages.scrollHeight;
          } else if (data.type === "sources" && data.sources) {
            showSources(data.sources, theme);
          } else if (data.type === "done") {
            if (data.conversationId) {
              CONFIG.conversationId = data.conversationId;
              try { sessionStorage.setItem(CONV_KEY, data.conversationId); } catch (e) {}
            }
            finalize(bubble, fullText, theme); return;
          } else if (data.type === "error") {
            addMessage(els.messages, data.message || "An error occurred.", "assistant", theme);
            finalize(null, "", theme); return;
          }
        }
        read();
      }).catch(function() { finalize(bubble, fullText, theme); });
    }
    read();
  }

  function parseSSE(block) {
    var lines = block.split("\n"), evt = { event: "message", data: "" };
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf("event:") === 0) evt.event = lines[i].substring(6).trim();
      else if (lines[i].indexOf("data:") === 0) evt.data = lines[i].substring(5).trim();
    }
    return evt;
  }

  function finalize(bubble, fullText, theme) {
    els.loading.style.display = "none";
    els.sendBtn.disabled = false;
    els.messages.scrollTop = els.messages.scrollHeight;
    if (fullText) fire("onMessage", { role: "assistant", content: fullText });
  }

  function sendFallback(body, theme) {
    apiFetch("/api/widget/chat", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: body,
    })
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(d) { handleFallbackResponse(d, theme); })
    .catch(function(err) {
      addMessage(els.messages, "Network error. Please try again.", "assistant", theme);
      els.loading.style.display = "none"; els.sendBtn.disabled = false;
      fire("onError", err);
    });
  }

  function handleFallbackResponse(data, theme) {
    if (data.error) {
      addMessage(els.messages, "Sorry, something went wrong.", "assistant", theme);
    } else {
      if (data.conversationId) {
        CONFIG.conversationId = data.conversationId;
        try { sessionStorage.setItem(CONV_KEY, data.conversationId); } catch (e) {}
      }
      addMessage(els.messages, data.message, "assistant", theme);
      fire("onMessage", { role: "assistant", content: data.message });
    }
    els.loading.style.display = "none";
    els.sendBtn.disabled = false;
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  // ── Sources display ──
  function showSources(sources, theme) {
    if (!sources || !sources.length) return;
    var container = document.createElement("div");
    container.setAttribute("role", "list");
    container.setAttribute("aria-label", "Sources");
    container.style.cssText = "margin-top:10px;display:flex;flex-direction:column;gap:6px;";

    // Header
    var header = document.createElement("div");
    header.style.cssText = "font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;";
    header.textContent = "Sources";
    container.appendChild(header);

    for (var i = 0; i < sources.length; i++) {
      (function(idx) {
        var src = sources[idx];
        var card = document.createElement("div");
        card.setAttribute("role", "listitem");
        card.style.cssText = "background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;cursor:pointer;transition:border-color 0.15s;";
        card.onmouseenter = function() { card.style.borderColor = theme.primaryColor + "40"; };
        card.onmouseleave = function() { card.style.borderColor = "#e5e7eb"; };

        // Header row
        var headerRow = document.createElement("div");
        headerRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:8px 10px;min-height:44px;";

        // Left: index + title
        var left = document.createElement("div");
        left.style.cssText = "display:flex;align-items:center;gap:8px;min-width:0;flex:1;";

        // Index badge
        var badge = document.createElement("span");
        badge.style.cssText = "display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:4px;background:" + theme.primaryColor + "15;color:" + theme.primaryColor + ";font-size:10px;font-weight:700;flex-shrink:0;";
        badge.textContent = idx + 1;
        left.appendChild(badge);

        // File type icon
        var fileType = (src.metadata && src.metadata.fileType) || "";
        var icons = {pdf:"\uD83D\uDCD5", docx:"\uD83D\uDCD8", txt:"\uD83D\uDCDD", csv:"\uD83D\uDCCA", xlsx:"\uD83D\uDCD7", url:"\uD83D\uDD17"};
        var icon = document.createElement("span");
        icon.style.cssText = "font-size:14px;flex-shrink:0;";
        icon.textContent = icons[fileType] || "\uD83D\uDCC4";
        left.appendChild(icon);

        // Title
        var title = document.createElement("span");
        title.style.cssText = "font-size:12px;font-weight:500;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
        title.textContent = (src.metadata && src.metadata.title) || (src.metadata && src.metadata.filename) || "Document";
        left.appendChild(title);

        headerRow.appendChild(left);

        // Right: similarity badge + expand arrow
        var right = document.createElement("div");
        right.style.cssText = "display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:8px;";

        // Similarity badge
        if (src.similarity) {
          var simPct = Math.round(src.similarity * 100);
          var simColor = simPct >= 80 ? "#059669" : simPct >= 60 ? "#d97706" : "#dc2626";
          var simBg = simPct >= 80 ? "#ecfdf5" : simPct >= 60 ? "#fffbeb" : "#fef2f2";
          var simBadge = document.createElement("span");
          simBadge.style.cssText = "font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;background:" + simBg + ";color:" + simColor + ";";
          simBadge.textContent = simPct + "%";
          right.appendChild(simBadge);
        }

        // Expand arrow
        var arrow = document.createElement("span");
        arrow.style.cssText = "font-size:12px;color:#9ca3af;transition:transform 0.2s;";
        arrow.textContent = "\u25BC";
        right.appendChild(arrow);

        headerRow.appendChild(right);
        card.appendChild(headerRow);

        // Content preview (hidden by default)
        var preview = document.createElement("div");
        preview.style.cssText = "display:none;padding:0 10px 10px;";
        var content = document.createElement("p");
        content.style.cssText = "font-size:11px;line-height:1.5;color:#6b7280;margin:0;word-break:break-word;";
        var previewText = (src.content || "").substring(0, 200);
        content.textContent = previewText + (src.content && src.content.length > 200 ? "..." : "");
        preview.appendChild(content);
        card.appendChild(preview);

        // Toggle expand
        var expanded = false;
        card.onclick = function() {
          expanded = !expanded;
          preview.style.display = expanded ? "block" : "none";
          arrow.style.transform = expanded ? "rotate(180deg)" : "rotate(0deg)";
          card.style.borderColor = expanded ? theme.primaryColor + "60" : "#e5e7eb";
        };

        container.appendChild(card);
      })(i);
    }

    els.messages.appendChild(container);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  // ── Safe message rendering (XSS-safe, textContent only) ──
  function addMessage(container, text, role, theme) {
    var msg = document.createElement("div");
    var isUser = role === "user";
    msg.style.cssText = "margin-bottom:12px;display:flex;justify-content:" + (isUser ? "flex-end" : "flex-start");
    msg.setAttribute("role", "article");
    msg.setAttribute("aria-label", (isUser ? "You" : "Assistant") + ": " + (text || "").substring(0, 50));
    var bubble = document.createElement("div");
    var bg = isUser ? theme.primaryColor : "#f3f4f6";
    var fg = isUser ? "white" : (theme.textColor || "#111");
    var br = isUser ? "border-bottom-right-radius:4px" : "border-bottom-left-radius:4px";
    bubble.style.cssText = "max-width:80%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word;background:" + bg + ";color:" + fg + ";" + br;
    bubble.textContent = text || "";
    msg.appendChild(bubble);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return bubble;
  }

  // ── SDK event helper ──
  function fire(name, data) {
    try {
      if (window.MimoNotesWidget && typeof window.MimoNotesWidget[name] === "function")
        window.MimoNotesWidget[name](data);
    } catch (e) {}
  }

  // ── SDK V2 Global Object ──
  window.MimoNotesWidget = {
    onOpen: null, onClose: null, onMessage: null, onError: null, onLeadCapture: null,
    open: function() { if (els.launcher) openChat(); },
    close: function() { if (els.chatWindow) closeChat(); },
    destroy: function() {
      if (els.container && els.container.parentNode) els.container.parentNode.removeChild(els.container);
      els = {};
      try { delete window.MimoNotesWidget; } catch (e) { window.MimoNotesWidget = undefined; }
    },
    config: CONFIG,
    version: "2.0.0",
  };

  loadConfig(createWidget);
})();
