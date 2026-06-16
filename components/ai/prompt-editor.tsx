"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import PromptVersionList from "./prompt-version-list";
import { Save, Play, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  isActive: boolean;
  version: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    version: number;
    content: string;
    changeNote: string | null;
    createdAt: string;
  }>;
}

interface PromptEditorProps {
  promptId?: string; // undefined = new prompt
}

export default function PromptEditor({ promptId }: PromptEditorProps) {
  const router = useRouter();
  const isNew = !promptId;

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [changeNote, setChangeNote] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState<PromptTemplate | null>(null);
  const [showVersions, setShowVersions] = useState(false);

  // Extract variables from content
  const variables = content.match(/\{(\w+)\}/g)?.map((v) => v) || [];
  const uniqueVariables = [...new Set(variables)];

  // Load existing prompt
  useEffect(() => {
    if (!promptId) return;

    async function loadPrompt() {
      try {
        const res = await fetch(`/api/ai/prompts/${promptId}`);
        if (res.ok) {
          const data = await res.json();
          setPrompt(data);
          setName(data.name);
          setContent(data.content);
          setCategory(data.category);
        } else {
          toast.error("Prompt not found");
          router.push("/ai/prompts");
        }
      } catch {
        toast.error("Failed to load prompt");
      } finally {
        setLoading(false);
      }
    }
    loadPrompt();
  }, [promptId, router]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    if (!content.trim()) {
      toast.error("Enter prompt content");
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? "/api/ai/prompts" : `/api/ai/prompts/${promptId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          content,
          category,
          changeNote: changeNote || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(isNew ? "Prompt created!" : "Prompt saved!");
        setChangeNote("");

        if (isNew) {
          router.push(`/ai/prompts/${data.id}`);
        } else {
          setPrompt(data);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [name, content, category, changeNote, isNew, promptId, router]);

  const handleRevert = useCallback(
    async (version: number) => {
      if (!promptId) return;

      try {
        const res = await fetch(`/api/ai/prompts/${promptId}/revert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version }),
        });

        if (res.ok) {
          const data = await res.json();
          setPrompt(data);
          setContent(data.content);
          toast.success(`Reverted to version ${version}`);
        } else {
          toast.error("Failed to revert");
        }
      } catch {
        toast.error("Failed to revert");
      }
    },
    [promptId]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/ai/prompts")}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex-1" />
        {!isNew && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVersions(!showVersions)}
          >
            Versions {prompt && <Badge variant="secondary" className="ml-1 text-[10px]">v{prompt.version}</Badge>}
          </Button>
        )}
        <Link href={`/ai/playground?promptId=${promptId || ""}`}>
          <Button variant="outline" size="sm">
            <Play className="size-4" />
            Test
          </Button>
        </Link>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isNew ? "Create" : "Save"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Name + Category */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. RAG Assistant"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="general">General</option>
                  <option value="support">Support</option>
                  <option value="sales">Sales</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              {!isNew && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Change Note (optional)
                  </label>
                  <input
                    type="text"
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="What changed in this version?"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Prompt Editor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                System Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                placeholder="Enter the system prompt template..."
                className="font-mono text-sm leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground mt-2">
                Use {"{context}"}, {"{question}"}, {"{language}"} as variables.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Variables Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Variables</CardTitle>
            </CardHeader>
            <CardContent>
              {uniqueVariables.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {uniqueVariables.map((v) => (
                    <Badge key={v} variant="secondary" className="font-mono text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No variables detected. Use {"{variable}"} syntax in your prompt.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-[12]">
                {content || "Enter prompt content to see preview..."}
              </p>
            </CardContent>
          </Card>

          {/* Version History (sidebar) */}
          {showVersions && prompt && (
            <PromptVersionList
              promptId={prompt.id}
              currentVersion={prompt.version}
              versions={prompt.versions}
              onRevert={handleRevert}
            />
          )}
        </div>
      </div>
    </div>
  );
}

