"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";

interface WidgetPreviewProps {
  widget: {
    name: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    welcomeMessage: string;
    position: string;
    quickReplies: string[];
    leadCaptureEnabled: boolean;
  };
}

export default function WidgetPreview({ widget }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    { role: "assistant", content: widget.welcomeMessage || "Hi! How can I help you?" },
  ]);

  function handleSend() {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Ini adalah preview. Jawaban AI asli akan muncul saat widget di-embed di website kamu.",
        },
      ]);
    }, 1000);
  }

  const posClass = widget.position.includes("right") ? "right-4" : "left-4";
  const posClassV = widget.position.includes("bottom") ? "bottom-4" : "top-4";

  return (
    <div className="relative w-full h-full min-h-[450px]">
      {/* Simulated website background */}
      <div className="absolute inset-0 rounded-lg overflow-hidden bg-white border border-border/50">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">
              yourwebsite.com
            </span>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </div>

      {/* Widget bubble */}
      {isOpen && (
        <div
          className={`absolute ${posClass} ${posClassV} z-10`}
          style={{ bottom: widget.position.includes("bottom") ? "16px" : undefined, top: widget.position.includes("top") ? "60px" : undefined }}
        >
          {/* Chat window */}
          <div
            className="w-[280px] h-[360px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/5"
            style={{ backgroundColor: widget.backgroundColor, color: widget.textColor }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between shrink-0"
              style={{ backgroundColor: widget.primaryColor }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">
                    {widget.name}
                  </p>
                  <p className="text-[10px] text-white/70">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-br-sm"
                        : "rounded-bl-sm border"
                    }`}
                    style={
                      msg.role === "user"
                        ? { backgroundColor: widget.primaryColor }
                        : {
                            backgroundColor: widget.backgroundColor,
                            borderColor: `${widget.textColor}15`,
                            color: widget.textColor,
                          }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Replies */}
            {messages.length <= 1 && widget.quickReplies.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {widget.quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(reply);
                      setTimeout(() => {
                        setMessages((prev) => [
                          ...prev,
                          { role: "user", content: reply },
                        ]);
                        setInput("");
                        setTimeout(() => {
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: "assistant",
                              content: `Jawaban untuk "${reply}" akan muncul di sini.`,
                            },
                          ]);
                        }, 800);
                      }, 100);
                    }}
                    className="px-2.5 py-1 rounded-full border text-[10px] font-medium transition-all hover:opacity-80"
                    style={{
                      borderColor: widget.primaryColor,
                      color: widget.primaryColor,
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1 shrink-0">
              <div className="flex items-center gap-2 rounded-xl border px-2.5 py-1.5"
                style={{ borderColor: `${widget.textColor}15` }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ketik pesan..."
                  className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                  style={{ color: widget.textColor }}
                />
                <button
                  onClick={handleSend}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: widget.primaryColor }}
                >
                  <Send className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Floating bubble (when closed) */}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className={`absolute ${posClass} ${posClassV} w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform`}
              style={{ backgroundColor: widget.primaryColor }}
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      )}

      {/* Floating bubble (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`absolute ${posClass} ${posClassV} w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-10`}
          style={{ backgroundColor: widget.primaryColor }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}
    </div>
  );
}
