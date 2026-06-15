(function() {
  "use strict";

  // ============================================================
  // Mimotes Widget — Embeddable Chat Widget (Hardened)
  // Usage: <script src="https://your-domain.com/widget.js" data-key="pw_pub_xxx"></script>
  // ============================================================

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
    publicKey: null,
    widgetId: null,
    theme: {},
    conversationId: null,
    visitorId: "v_" + crypto.randomUUID(),
  };

  // Get public key from script tag
  for (var i = 0; i < scripts.length; i++) {
    var key = scripts[i].getAttribute("data-key");
    if (key) {
      CONFIG.publicKey = key;
      break;
    }
  }

  if (!CONFIG.publicKey) {
    console.error("[Mimotes Widget] No data-key attribute found");
    return;
  }

  // ============================================================
  // Sanitize text to prevent XSS
  // ============================================================
  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  // Load widget config
  // ============================================================
  function loadConfig(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", CONFIG.apiUrl + "/api/widget/config?publicKey=" + encodeURIComponent(CONFIG.publicKey));
    xhr.onload = function() {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        CONFIG.widgetId = data.id;
        CONFIG.theme = data.theme;
        callback(data);
      }
    };
    xhr.send();
  }

  // ============================================================
  // Create widget UI (using textContent, no innerHTML)
  // ============================================================
  function createWidget(config) {
    var theme = config.theme;

    // Container
    var container = document.createElement("div");
    container.id = "mimotes-widget";
    container.style.position = "fixed";
    container.style.zIndex = "999999";
    container.style.fontFamily = "-apple-system,BlinkMacSystemFont,sans-serif";
    // Position
    if (theme.position === "bottom-left") {
      container.style.bottom = "20px";
      container.style.left = "20px";
    } else {
      container.style.bottom = "20px";
      container.style.right = "20px";
    }

    // Chat window (hidden)
    var chatWindow = document.createElement("div");
    chatWindow.id = "mimotes-chat";
    chatWindow.style.display = "none";
    chatWindow.style.width = "360px";
    chatWindow.style.height = "500px";
    chatWindow.style.background = theme.backgroundColor;
    chatWindow.style.borderRadius = "12px";
    chatWindow.style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
    chatWindow.style.flexDirection = "column";
    chatWindow.style.overflow = "hidden";
    chatWindow.style.marginBottom = "16px";

    // Header
    var header = document.createElement("div");
    header.style.background = theme.primaryColor;
    header.style.color = "white";
    header.style.padding = "16px";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    var headerTitle = document.createElement("span");
    headerTitle.style.fontWeight = "600";
    headerTitle.textContent = config.name; // Safe: textContent

    var closeBtn = document.createElement("span");
    closeBtn.id = "mimotes-close";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "20px";
    closeBtn.textContent = "\u00d7"; // × character

    header.appendChild(headerTitle);
    header.appendChild(closeBtn);

    // Messages
    var messages = document.createElement("div");
    messages.id = "mimotes-messages";
    messages.style.flex = "1";
    messages.style.overflowY = "auto";
    messages.style.padding = "16px";

    // Welcome message
    addMessage(messages, theme.welcomeMessage, "assistant", theme);

    // Input area
    var inputArea = document.createElement("div");
    inputArea.style.padding = "12px";
    inputArea.style.borderTop = "1px solid #eee";
    inputArea.style.display = "flex";
    inputArea.style.gap = "8px";

    var input = document.createElement("input");
    input.id = "mimotes-input";
    input.type = "text";
    input.placeholder = "Type a message...";
    input.style.flex = "1";
    input.style.border = "1px solid #ddd";
    input.style.borderRadius = "8px";
    input.style.padding = "10px";
    input.style.fontSize = "14px";
    input.style.outline = "none";

    var sendBtn = document.createElement("button");
    sendBtn.id = "mimotes-send";
    sendBtn.textContent = "Send";
    sendBtn.style.background = theme.primaryColor;
    sendBtn.style.color = "white";
    sendBtn.style.border = "none";
    sendBtn.style.borderRadius = "8px";
    sendBtn.style.padding = "10px 16px";
    sendBtn.style.cursor = "pointer";
    sendBtn.style.fontWeight = "600";

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messages);
    chatWindow.appendChild(inputArea);

    // Launcher button
    var launcher = document.createElement("div");
    launcher.id = "mimotes-launcher";
    launcher.style.width = "56px";
    launcher.style.height = "56px";
    launcher.style.background = theme.primaryColor;
    launcher.style.borderRadius = "50%";
    launcher.style.display = "flex";
    launcher.style.alignItems = "center";
    launcher.style.justifyContent = "center";
    launcher.style.cursor = "pointer";
    launcher.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    launcher.style.color = "white";
    launcher.style.fontSize = "24px";
    launcher.textContent = "\ud83d\udcac"; // 💬 emoji

    container.appendChild(chatWindow);
    container.appendChild(launcher);
    document.body.appendChild(container);

    // Event listeners
    launcher.onclick = function() {
      chatWindow.style.display = chatWindow.style.display === "flex" ? "none" : "flex";
      launcher.style.display = "none";
    };

    closeBtn.onclick = function() {
      chatWindow.style.display = "none";
      launcher.style.display = "flex";
    };

    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      addMessage(messages, text, "user", theme);
      messages.scrollTop = messages.scrollHeight;

      var xhr = new XMLHttpRequest();
      xhr.open("POST", CONFIG.apiUrl + "/api/widget/chat");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = function() {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          CONFIG.conversationId = data.conversationId;
          addMessage(messages, data.message, "assistant", theme);
        } else {
          addMessage(messages, "Sorry, something went wrong.", "assistant", theme);
        }
        messages.scrollTop = messages.scrollHeight;
      };
      xhr.onerror = function() {
        addMessage(messages, "Network error. Please try again.", "assistant", theme);
      };
      xhr.send(JSON.stringify({
        publicKey: CONFIG.publicKey,
        message: text,
        conversationId: CONFIG.conversationId,
        visitorId: CONFIG.visitorId,
      }));
    }

    sendBtn.onclick = sendMessage;
    input.onkeypress = function(e) {
      if (e.key === "Enter") sendMessage();
    };
  }

  // ============================================================
  // addMessage — Safe rendering with textContent (no innerHTML)
  // ============================================================
  function addMessage(container, text, role, theme) {
    var msg = document.createElement("div");
    var isUser = role === "user";
    msg.style.marginBottom = "12px";
    msg.style.display = "flex";
    msg.style.justifyContent = isUser ? "flex-end" : "flex-start";

    var bubble = document.createElement("div");
    bubble.style.maxWidth = "80%";
    bubble.style.padding = "10px 14px";
    bubble.style.borderRadius = "12px";
    bubble.style.fontSize = "14px";
    bubble.style.lineHeight = "1.5";

    if (isUser) {
      bubble.style.background = theme.primaryColor;
      bubble.style.color = "white";
      bubble.style.borderBottomRightRadius = "4px";
    } else {
      bubble.style.background = "#f3f4f6";
      bubble.style.color = theme.textColor;
      bubble.style.borderBottomLeftRadius = "4px";
    }

    // Safe: textContent prevents XSS
    bubble.textContent = text;
    msg.appendChild(bubble);
    container.appendChild(msg);
  }

  // ============================================================
  // Initialize
  // ============================================================
  loadConfig(createWidget);
})();
