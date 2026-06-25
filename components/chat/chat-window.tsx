"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  FileText,
  MessageSquare,
  Search,
  Bot,
  Plus,
  PanelLeft,
} from "lucide-react";
import MessageBubble from "./message-bubble";
import SessionSidebar from "./session-sidebar";
import { AnimatedAIInput } from "@/components/ui/animated-ai-input";

const MAX_MESSAGE_LENGTH = 10000;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    documentId: string;
    documentTitle?: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>;
  createdAt: string;
  isStreaming?: boolean;
}

interface Source {
  documentId: string;
  documentTitle?: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

const SUGGESTIONS = [
  {
    icon: FileText,
    label: "Lihat Dokumen",
    prompt: "Apa saja dokumen yang tersedia?",
  },
  {
    icon: MessageSquare,
    label: "Ringkas Semua",
    prompt: "Buatkan ringkasan dari semua dokumen",
  },
  {
    icon: Search,
    label: "Cari Informasi",
    prompt: "Jelaskan isi dokumen utama",
  },
];

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [highlightedSource, setHighlightedSource] = useState<number | null>(
    null
  );
  const [chatMode, setChatMode] = useState<
    "knowledge_base" | "customer_service" | "sales_agent"
  >("customer_service");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const prevMessageCountRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetchDoneRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const debouncedScrollToBottom = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      scrollToBottom();
    }, 150);
  }, [scrollToBottom]);

  const abortInFlight = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const currentCount = messages.length;
    if (currentCount > prevMessageCountRef.current) {
      scrollToBottom();
    } else if (currentCount === prevMessageCountRef.current && isLoading) {
      debouncedScrollToBottom();
    }
    prevMessageCountRef.current = currentCount;
  }, [messages, isLoading, scrollToBottom, debouncedScrollToBottom]);

  const resetTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  const handleCitationClick = useCallback((sourceIndex: number) => {
    setHighlightedSource((prev) => (prev === sourceIndex ? null : sourceIndex));
    const el = document.getElementById(`source-preview-${sourceIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (isLoading) return;

    const lastAssistantIdx = messages.findLastIndex(
      (m) => m.role === "assistant"
    );
    if (lastAssistantIdx === -1) return;

    const lastUserIdx = messages.findLastIndex(
      (m, i) => m.role === "user" && i < lastAssistantIdx
    );
    if (lastUserIdx === -1) return;

    const userPrompt = messages[lastUserIdx].content;

    abortInFlight();

    setMessages((prev) => prev.slice(0, lastAssistantIdx));
    setIsLoading(true);
    setHighlightedSource(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userPrompt,
          sessionId,
          mode: chatMode,
        }),
        signal: controller.signal,
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
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        sources,
        createdAt: new Date().toISOString(),
        isStreaming: true,
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

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            isStreaming: false,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error("Regenerate error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      if (
        !(error instanceof Error && error.message === "Gagal membuat ulang jawaban")
      ) {
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [isLoading, messages, sessionId, abortInFlight]);

  async function handleSessionSelect(session: {
    id: string;
    title: string | null;
  }) {
    abortInFlight();

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
      toast.error(
        `Pesan terlalu panjang. Maksimal ${MAX_MESSAGE_LENGTH} karakter.`
      );
      return;
    }

    abortInFlight();

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

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          mode: chatMode,
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
        isStreaming: true,
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

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            isStreaming: false,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error("Chat error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        toast.error("Koneksi terputus. Silakan coba lagi.");
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Koneksi terputus atau permintaan habis waktu. Silakan coba lagi.",
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
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    abortInFlight();
    setMessages([]);
    setSessionId(null);
    setHighlightedSource(null);
  }

  const sessionsRefreshTriggerRef = useRef(0);

  const lastAssistantIdx = messages.findLastIndex(
    (m) => m.role === "assistant"
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full bg-background">
      {/* Skip to content */}
      <a
        href="#chat-messages"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Lewati ke pesan
      </a>

      {/* Sidebar */}
      <SessionSidebar
        currentSessionId={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        refreshTrigger={sessionsRefreshTriggerRef.current}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar — minimal, SaaS-grade */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center w-9 h-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors md:hidden"
              aria-label="Buka riwayat chat"
            >
              <PanelLeft className="h-4.5 w-4.5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Mimotes
              </span>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Chat Baru</span>
          </button>
        </header>

        {/* Messages */}
        <div
          id="chat-messages"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Percakapan"
          className="flex-1 overflow-y-auto min-h-0"
        >
          {isEmpty ? (
            /* Empty state — clean SaaS welcome */
            <div className="flex flex-col items-center justify-center h-full px-4 pb-8">
              <div className="w-full max-w-lg space-y-8">
                {/* Brand mark */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto">
                    <Bot className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Ada yang bisa saya bantu?
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tanya apa saja tentang dokumen Anda
                    </p>
                  </div>
                </div>

                {/* Suggestion cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setInput(s.prompt)}
                      className="group flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/[0.03] transition-all text-left"
                    >
                      <div className="w-9 h-9 shrink-0 rounded-lg bg-muted/80 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <s.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCitationClick={handleCitationClick}
                  highlightedSource={highlightedSource}
                  isLastMessage={
                    index === lastAssistantIdx && message.role === "assistant"
                  }
                  isStreaming={message.isStreaming ?? false}
                  isLoading={isLoading}
                  onRegenerate={handleRegenerate}
                />
              ))}

              {/* Loading indicator */}
              {isLoading &&
                messages[messages.length - 1]?.role === "user" && (
                  <div
                    className="flex items-start gap-3"
                    role="status"
                    aria-label="AI sedang menulis"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" />
                        <div
                          className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />

              {isLoading && (
                <div className="sr-only" role="status">
                  {messages[messages.length - 1]?.role === "user"
                    ? "AI sedang menulis jawaban..."
                    : "AI sedang menulis..."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-border/50 bg-background pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <AnimatedAIInput
              value={input}
              onChange={setInput}
              onSubmit={() => {
                if (!input.trim() || isLoading) return;
                handleSubmit({
                  preventDefault: () => {},
                } as React.FormEvent);
              }}
              chatMode={chatMode}
              onModeChange={setChatMode}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
