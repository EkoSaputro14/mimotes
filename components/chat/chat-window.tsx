"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import MessageBubble from "./message-bubble";
import SessionSidebar from "./session-sidebar";
import { cn } from "@/lib/utils";

const MAX_MESSAGE_LENGTH = 10000;
const EMPTY_STATE_SUGGESTIONS = [
  "Apa saja dokumen yang tersedia?",
  "Jelaskan isi dokumen utama",
  "Buatkan ringkasan dari semua dokumen",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    documentId: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>;
  createdAt: string;
}

interface Source {
  documentId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

const FOLLOW_UP_SUGGESTIONS = [
  "Jelaskan lebih detail",
  "Berikan contoh",
  "Ringkas dalam 3 poin",
];

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [highlightedSource, setHighlightedSource] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const resetTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) form.requestSubmit();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleCitationClick = useCallback((sourceIndex: number) => {
    setHighlightedSource((prev) => (prev === sourceIndex ? null : sourceIndex));
    const el = document.getElementById(`source-preview-${sourceIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleFollowUp = useCallback((suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (isLoading) return;

    // Find the last assistant message to get context for regeneration
    const lastAssistantIdx = messages.findLastIndex((m) => m.role === "assistant");
    if (lastAssistantIdx === -1) return;

    // Find the user message that prompted this assistant response
    const lastUserIdx = messages.findLastIndex(
      (m, i) => m.role === "user" && i < lastAssistantIdx
    );
    if (lastUserIdx === -1) return;

    const userPrompt = messages[lastUserIdx].content;

    // Remove the last assistant message
    setMessages((prev) => prev.slice(0, lastAssistantIdx));
    setIsLoading(true);
    setHighlightedSource(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userPrompt,
          sessionId,
        }),
      });

      if (!response.ok) {
        toast.error("Gagal membuat ulang jawaban.");
        throw new Error("Gagal membuat ulang jawaban");
      }

      const newSessionId = response.headers.get("X-Session-Id");
      const sourcesHeader = response.headers.get("X-Sources");

      if (newSessionId) {
        setSessionId(newSessionId);
      }

      let sources: Source[] = [];
      if (sourcesHeader) {
        try {
          sources = JSON.parse(decodeURIComponent(sourcesHeader));
        } catch {
          // Ignore parse errors
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        sources,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: assistantContent,
              };
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Regenerate error:", error);
      if (
        !(error instanceof Error && error.message === "Gagal membuat ulang jawaban")
      ) {
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, sessionId]);

  async function handleSessionSelect(session: {
    id: string;
    title: string | null;
  }) {
    setSessionId(session.id);
    setIsLoading(true);
    setHighlightedSource(null);

    try {
      const res = await fetch(
        `/api/chat/sessions?sessionId=${session.id}`
      );
      if (res.ok) {
        const data = await res.json();
        const sessionMessages: Message[] = (data.messages || []).map(
          (m: {
            id: string;
            role: string;
            content: string;
            sources?: Source[];
            createdAt: string | Date;
          }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources || [],
            createdAt:
              typeof m.createdAt === "string"
                ? m.createdAt
                : new Date(m.createdAt).toISOString(),
          })
        );
        setMessages(sessionMessages);
      } else {
        toast.error("Gagal memuat percakapan");
      }
    } catch {
      toast.error("Gagal memuat percakapan");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (input.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Pesan terlalu panjang. Maksimal ${MAX_MESSAGE_LENGTH} karakter.`);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    resetTextareaHeight();
    setIsLoading(true);
    setHighlightedSource(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        toast.error("Gagal mengirim pesan. Silakan coba lagi.");
        throw new Error("Gagal mengirim pesan");
      }

      clearTimeout(timeoutId);

      const newSessionId = response.headers.get("X-Session-Id");
      const sourcesHeader = response.headers.get("X-Sources");

      if (newSessionId) {
        setSessionId(newSessionId);
      }

      let sources: Source[] = [];
      if (sourcesHeader) {
        try {
          sources = JSON.parse(decodeURIComponent(sourcesHeader));
        } catch {
          // Ignore parse errors
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        sources,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: assistantContent,
              };
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        toast.error("Koneksi terputus. Silakan coba lagi.");
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Koneksi terputus atau permintaan habis waktu. Silakan coba lagi.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } else if (
        !(error instanceof Error && error.message === "Gagal mengirim pesan")
      ) {
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setSessionId(null);
    setHighlightedSource(null);
  }

  const lastAssistantIdx = messages.findLastIndex((m) => m.role === "assistant");
  const showFollowUps =
    !isLoading &&
    messages.length > 0 &&
    lastAssistantIdx !== -1 &&
    messages[lastAssistantIdx]?.content.length > 0;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <SessionSidebar
        currentSessionId={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg md:hidden"
              aria-label="Buka riwayat chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mimotes AI</h1>
              <p className="text-sm text-muted-foreground">
                Tanya apa saja berdasarkan dokumen yang tersedia
              </p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Chat Baru
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Selamat datang di Mimotes
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Ajukan pertanyaan dan AI akan menjawab berdasarkan dokumen yang
                tersedia. Jawaban akan disertai referensi sumber.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {EMPTY_STATE_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleFollowUp(suggestion)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5",
                      "text-xs font-medium text-muted-foreground",
                      "bg-muted hover:bg-muted/80 rounded-full",
                      "transition-colors duration-150",
                      "border border-border hover:border-border/80",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCitationClick={handleCitationClick}
              highlightedSource={highlightedSource}
              isLastMessage={index === lastAssistantIdx && message.role === "assistant"}
              isStreaming={isLoading && index === lastAssistantIdx && message.role === "assistant" && message.content === ""}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                AI
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Follow-up suggestions */}
        {showFollowUps && (
          <div className="px-6 pb-2 flex flex-wrap gap-2">
            {FOLLOW_UP_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleFollowUp(suggestion)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5",
                  "text-xs font-medium text-muted-foreground",
                  "bg-muted hover:bg-muted/80 rounded-full",
                  "transition-colors duration-150",
                  "border border-border hover:border-border/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
              >
                <Sparkles className="h-3 w-3" />
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-border bg-card">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pertanyaan Anda... (Enter untuk kirim, Shift+Enter untuk baris baru)"
              disabled={isLoading}
              rows={1}
              className="flex-1 px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all disabled:opacity-50 resize-none overflow-hidden min-h-[48px] max-h-[160px]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
