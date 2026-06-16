"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateSafe } from "@/lib/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Play,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count: { versions: number };
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "support", label: "Support" },
  { value: "sales", label: "Sales" },
  { value: "technical", label: "Technical" },
];

export default function PromptList() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, [category, search]);

  async function fetchPrompts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);

      const res = await fetch(`/api/ai/prompts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch {
      toast.error("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this prompt template?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/ai/prompts/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPrompts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Prompt deleted");
      } else {
        toast.error("Failed to delete prompt");
      }
    } catch {
      toast.error("Failed to delete prompt");
    } finally {
      setDeleting(null);
    }
  }

  function truncateContent(content: string, maxLen = 120): string {
    if (content.length <= maxLen) return content;
    return content.substring(0, maxLen) + "...";
  }

  function formatDate(dateStr: string): string {
    return formatDateSafe(dateStr);
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                category === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* New Prompt */}
        <Link href="/ai/prompts/new">
          <Button size="sm">
            <Plus className="size-4" />
            New Prompt
          </Button>
        </Link>
      </div>

      {/* Prompt List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="size-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              No prompt templates yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create prompt templates to customize how the AI responds.
            </p>
            <Link href="/ai/prompts/new">
              <Button size="sm">
                <Plus className="size-4" />
                Create First Prompt
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="transition-colors hover:bg-accent/30">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate">
                        {prompt.name}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        v{prompt.version}
                      </Badge>
                      {prompt.isActive && (
                        <Badge className="text-[10px] bg-success/10 text-success shrink-0">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {truncateContent(prompt.content)}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="capitalize">{prompt.category}</span>
                      <span>·</span>
                      <span>{prompt._count.versions} versions</span>
                      <span>·</span>
                      <span>Updated {formatDate(prompt.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/ai/prompts/${prompt.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Edit className="size-3.5" />
                      </Button>
                    </Link>
                    <Link href={`/ai/playground?promptId=${prompt.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Play className="size-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(prompt.id)}
                      disabled={deleting === prompt.id}
                    >
                      {deleting === prompt.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
