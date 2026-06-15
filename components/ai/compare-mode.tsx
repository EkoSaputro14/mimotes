"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Play,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface CompareResult {
  model: string;
  provider: string;
  content: string;
  tokens: number;
  time: string;
}

interface CompareModeProps {
  systemPrompt: string;
  userMessage: string;
  context: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  onBack: () => void;
}

export default function CompareMode({
  systemPrompt,
  userMessage,
  context,
  temperature,
  maxTokens,
  topP,
  onBack,
}: CompareModeProps) {
  const [modelA, setModelA] = useState("");
  const [modelB, setModelB] = useState("");
  const [results, setResults] = useState<CompareResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleRunAll() {
    if (!userMessage.trim()) {
      toast.error("Enter a user message first");
      return;
    }

    setIsRunning(true);
    setResults([]);

    try {
      const models = [
        { model: modelA },
        { model: modelB },
      ].filter((m) => m.model);

      if (models.length === 0) {
        toast.error("Select at least one model");
        return;
      }

      const res = await fetch("/api/ai/playground/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          userMessage,
          context,
          temperature,
          maxTokens,
          topP,
          models,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to compare");
      }

      const data = await res.json();
      setResults(data.responses || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to compare");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleCopy(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <h3 className="text-sm font-semibold">Compare Mode</h3>
      </div>

      {/* Shared Input Summary */}
      <Card>
        <CardContent className="py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">System: </span>
              <span className="line-clamp-1">{systemPrompt}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Message: </span>
              <span className="line-clamp-1">{userMessage}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Params: </span>
              <span>Temp: {temperature} · Top-P: {topP} · Max: {maxTokens}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Model A
          </label>
          <input
            type="text"
            value={modelA}
            onChange={(e) => setModelA(e.target.value)}
            placeholder="e.g. gpt-4o-mini"
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Model B
          </label>
          <input
            type="text"
            value={modelB}
            onChange={(e) => setModelB(e.target.value)}
            placeholder="e.g. mimo-v2.5-pro"
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Run Button */}
      <Button onClick={handleRunAll} disabled={isRunning} className="w-full">
        {isRunning ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        Run All Models
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold truncate">
                    {result.model}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(result.content, index)}
                    className="h-7 px-2"
                  >
                    {copiedIndex === index ? (
                      <Check className="size-3.5 text-green-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                  {result.content}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2">
                  <span>{result.tokens} tokens</span>
                  <span>{result.time}</span>
                  <span>{result.provider}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !isRunning && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Select models and click "Run All" to compare responses
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
