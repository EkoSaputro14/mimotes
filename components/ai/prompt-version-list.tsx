"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateSafe, formatDateTimeSafe } from "@/lib/date-utils";
import { GitBranch, RotateCcw, Eye, X } from "lucide-react";
import * as Diff from "diff";

interface Version {
  id: string;
  version: number;
  content: string;
  changeNote: string | null;
  createdAt: string;
}

interface PromptVersionListProps {
  promptId: string;
  currentVersion: number;
  versions: Version[];
  onRevert: (version: number) => Promise<void>;
}

export default function PromptVersionList({
  currentVersion,
  versions,
  onRevert,
}: PromptVersionListProps) {
  const [diffView, setDiffView] = useState<{
    from: Version;
    to: Version;
  } | null>(null);
  const [reverting, setReverting] = useState<number | null>(null);

  const diffLines = useMemo(() => {
    if (!diffView) return [];
    return Diff.diffLines(diffView.from.content, diffView.to.content);
  }, [diffView]);

  async function handleRevert(version: number) {
    if (!confirm(`Revert to version ${version}? This will create a new version.`))
      return;

    setReverting(version);
    try {
      await onRevert(version);
    } finally {
      setReverting(null);
    }
  }

  function formatDate(dateStr: string): string {
    return formatDateTimeSafe(dateStr);
  }

  function getPreviousVersion(version: number): Version | undefined {
    return versions.find((v) => v.version === version - 1);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Version History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No versions yet.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">
                      v{v.version}
                    </span>
                    {v.version === currentVersion && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        current
                      </Badge>
                    )}
                  </div>
                  {v.changeNote && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {v.changeNote}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDate(v.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Diff button: compare with previous version */}
                  {getPreviousVersion(v.version) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5"
                      title="View diff with previous version"
                      onClick={() =>
                        setDiffView({
                          from: getPreviousVersion(v.version)!,
                          to: v,
                        })
                      }
                    >
                      <Eye className="size-3" />
                    </Button>
                  )}
                  {/* Revert button */}
                  {v.version !== currentVersion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5"
                      title={`Revert to v${v.version}`}
                      onClick={() => handleRevert(v.version)}
                      disabled={reverting === v.version}
                    >
                      <RotateCcw className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Diff Modal Overlay */}
      {diffView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">
                Diff: v{diffView.from.version} → v{diffView.to.version}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDiffView(null)}
                className="h-7 px-2"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
              {diffLines.map((part, index) => {
                const color = part.added
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  : part.removed
                    ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    : "text-muted-foreground";
                const prefix = part.added ? "+" : part.removed ? "-" : " ";
                return (
                  <div key={index} className={`px-2 py-0.5 ${color}`}>
                    {part.value
                      .split("\n")
                      .filter((line, i, arr) => !(i === arr.length - 1 && line === ""))
                      .map((line, i) => (
                        <div key={i}>
                          <span className="select-none text-muted-foreground/50 mr-2">
                            {prefix}
                          </span>
                          {line}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
