"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, Check, Users, Loader2, Plus } from "lucide-react";

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
}

interface WorkspaceListResponse {
  workspaces: WorkspaceInfo[];
  selectedWorkspaceId: string | null;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full control — can manage billing, delete workspace, transfer ownership",
  admin: "Can manage members, settings, and documents",
  editor: "Can create, edit, and delete documents",
  viewer: "Can view documents and chat",
};

function getRoleBadgeClass(role: string): string {
  const classes: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    editor: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    viewer: "bg-muted text-muted-foreground",
  };
  return classes[role] ?? "bg-muted text-muted-foreground";
}

function getRoleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/switch");
      if (res.ok) {
        const data: WorkspaceListResponse = await res.json();
        setWorkspaces(data.workspaces);
        setSelectedId(data.selectedWorkspaceId);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSwitch = async (workspaceId: string) => {
    if (workspaceId === selectedId || switching) return;
    setSwitching(workspaceId);
    setError(null);
    try {
      const res = await fetch("/api/workspace/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal beralih workspace");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setSelectedId(workspaceId);
        router.refresh();
      }
    } catch {
      setError("Gagal beralih workspace");
    } finally {
      setSwitching(null);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal membuat workspace");
        return;
      }
      const data = await res.json();
      if (data.workspace) {
        setCreateName("");
        setShowCreate(false);
        // Switch to the new workspace
        await handleSwitch(data.workspace.id);
      }
    } catch {
      setError("Gagal membuat workspace");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="size-7 rounded-md bg-muted animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) return null;

  const selected = workspaces.find((w) => w.id === selectedId) ?? workspaces[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 px-2.5 py-2 h-auto"
          />
        }
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Building2 className="size-4" />
        </div>
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {selected?.name ?? "Pilih workspace"}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="size-3" />
          <span className="text-xs">{selected?.memberCount ?? 0}</span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={4} className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Workspaces</p>
            <p className="text-xs leading-none text-muted-foreground">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {workspaces.map((ws) => {
          const isSelected = ws.id === selectedId;
          const isSwitching = switching === ws.id;

          return (
            <DropdownMenuItem
              key={ws.id}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                isSelected && "bg-accent"
              )}
              onClick={() => handleSwitch(ws.id)}
              disabled={switching !== null}
            >
              {isSelected ? (
                <Check className="size-4 shrink-0 text-primary" />
              ) : isSwitching ? (
                <Loader2 className="size-4 shrink-0 text-muted-foreground animate-spin" />
              ) : (
                <div className="size-4 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{ws.name}</p>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      getRoleBadgeClass(ws.role)
                    )}
                    title={ROLE_DESCRIPTIONS[ws.role]}
                  >
                    {getRoleLabel(ws.role)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ws.memberCount} member{ws.memberCount !== 1 ? "s" : ""}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}

        {error && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Create Workspace */}
        {showCreate ? (
          <div className="px-2 py-2 space-y-2">
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Nama workspace..."
              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setShowCreate(false); setCreateName(""); }
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !createName.trim()}
                className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {creating ? "Membuat..." : "Buat"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateName(""); }}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-primary"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="size-4" />
            <span className="text-sm font-medium">Buat Workspace Baru</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="text-xs text-muted-foreground cursor-default" onClick={() => router.push("/settings/workspace")}>
          Kelola di Settings → Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
