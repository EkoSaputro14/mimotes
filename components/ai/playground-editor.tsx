"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import ParameterControls from "./parameter-controls";
import ModelSelector from "./model-selector";
import CompareMode from "./compare-mode";
import {
  Play,
  Copy,
  Check,
  Save,
  RotateCcw,
  Columns2,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface RunHistory {
  id: number;
  timestamp: string;
  model: string;
  tokens: number;
  time: string;
  response: string;
}

export default function PlaygroundEditor() {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant that answers questions based on the provided context. Always cite your sources using [1], [2] notation."
  );
  const [userMessage, setUserMessage] = useState("");
  const [context, setContext] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [useRAG, setUseRAG] = useState(false);
  const [topK, setTopK] = useState(5);
  const [streaming, setStreaming] = useState(true);

  const [response, setResponse] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<{
    tokens: number;
    time: string;
    model: string;
    provider: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [history, setHistory] = useState<RunHistory[]>([]);

  const responseRef = useRef<HTMLDivElement>(null);

  const handleRun = useCallback(async () => {
    if (!userMessage.trim()) {
      toast.error("Enter a user message");
      return;
    }

    setIsRunning(true);
    setResponse("");
    setStats(null);

    try {
      const res = await fetch("/api/ai/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          userMessage,
          context,
          useRAG,
          topK,
          temperature,
          maxTokens,
          topP,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to run");
      }

      const returnedModel = res.headers.get("X-Model") || model;

      // Read stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          // Strip stats comment from display
          const display = fullText.replace(
            /<!-- STATS:.*? -->/g,
            ""
          );
          setResponse(display);
        }
      }

      // Parse stats from the full response
      const statsMatch = fullText.match(/<!-- STATS:(.*?) -->/);
      if (statsMatch) {
        try {
          const parsed = JSON.parse(statsMatch[1]);
          setStats(parsed);
        } catch {
          // ignore
        }
      }

      const cleanResponse = fullText.replace(/<!-- STATS:.*? -->/g, "").trim();

      // Add to history
      setHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          model: returnedModel,
          tokens: statsMatch ? JSON.parse(statsMatch[1]).tokens : 0,
          time: statsMatch ? JSON.parse(statsMatch[1]).time : "0s",
          response: cleanResponse,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run");
      setResponse("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsRunning(false);
    }
  }, [systemPrompt, userMessage, context, useRAG, topK, temperature, maxTokens, topP, model]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setResponse("");
    setStats(null);
    setUserMessage("");
    setContext("");
  };

  const handleSaveAsTemplate = async () => {
    const name = prompt("Template name:");
    if (!name) return;

    try {
      const res = await fetch("/api/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          content: systemPrompt,
          category: "general",
        }),
      });

      if (res.ok) {
        toast.success("Template saved!");
      } else {
        toast.error("Failed to save template");
      }
    } catch {
      toast.error("Failed to save template");
    }
  };

  if (compareMode) {
    return (
      <CompareMode
        systemPrompt={systemPrompt}
        userMessage={userMessage}
        context={context}
        temperature={temperature}
        maxTokens={maxTokens}
        topP={topP}
        onBack={() => setCompareMode(false)}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
      {/* Left: Editor */}
      <div className="space-y-4">
        {/* System Prompt */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              placeholder="Enter system prompt..."
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Context */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Context</CardTitle>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">RAG</label>
                <Switch checked={useRAG} onCheckedChange={setUseRAG} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              placeholder={
                useRAG
                  ? "Context will be auto-filled from RAG..."
                  : "Enter context manually (optional)..."
              }
              disabled={useRAG}
              className="text-sm"
            />
          </CardContent>
        </Card>

        {/* User Message */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">User Message</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              rows={3}
              placeholder="Enter your question..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleRun();
                }
              }}
              className="text-sm"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleRun} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run
          </Button>
          <Button variant="outline" onClick={handleSaveAsTemplate}>
            <Save className="size-4" />
            Save as Template
          </Button>
          <Button variant="outline" onClick={() => setCompareMode(true)}>
            <Columns2 className="size-4" />
            Compare
          </Button>
          <Button variant="ghost" onClick={handleClear}>
            <RotateCcw className="size-4" />
            Clear
          </Button>
        </div>

        {/* Parameters */}
        <ParameterControls
          temperature={temperature}
          topP={topP}
          maxTokens={maxTokens}
          useRAG={useRAG}
          topK={topK}
          onTemperatureChange={setTemperature}
          onTopPChange={setTopP}
          onMaxTokensChange={setMaxTokens}
          onUseRAGChange={setUseRAG}
          onTopKChange={setTopK}
        />
      </div>

      {/* Right: Response */}
      <div className="space-y-4">
        <Card className="min-h-[300px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Response</CardTitle>
              {response && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-2"
                >
                  {copied ? (
                    <Check className="size-3.5 text-green-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isRunning && !response && (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Generating response...</span>
              </div>
            )}
            {!isRunning && !response && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="size-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Enter a message and click Run to see the AI response
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Press Ctrl+Enter to run
                </p>
              </div>
            )}
            {response && (
              <div
                ref={responseRef}
                className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed"
              >
                {response}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <Card>
            <CardContent className="py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Tokens</p>
                  <p className="text-sm font-semibold">{stats.tokens}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-semibold">{stats.time}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="text-sm font-semibold truncate">{stats.model}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="text-sm font-semibold">{stats.provider}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">History</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistory([])}
                  className="h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => {
                      setResponse(run.response);
                      setStats({
                        tokens: run.tokens,
                        time: run.time,
                        model: run.model,
                        provider: "",
                      });
                    }}
                    className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {run.timestamp}
                      </span>
                      <span className="text-xs font-mono truncate">
                        {run.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {run.tokens} tok
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {run.time}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
