"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SettingsSkeleton } from "./settings-skeleton";

interface MCPServer {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  isActive: boolean;
  connected: boolean;
  toolCount: number;
  tools?: Array<{ name: string; description: string }>;
}

interface MCPTool {
  name: string;
  description: string;
  serverId: string;
  serverName: string;
}

export default function MCPSettingsForm() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    apiKey: "",
    isActive: true,
  });
  const [mcpUrl, setMcpUrl] = useState("/api/mcp");

  useEffect(() => {
    setMcpUrl(`${window.location.origin}/api/mcp`);
  }, []);

  useEffect(() => {
    loadServers();
    loadTools();
  }, []);

  async function loadServers() {
    try {
      const res = await fetch("/api/mcp/servers");
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch (err) {
      console.error("Failed to load MCP servers:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTools() {
    try {
      const res = await fetch("/api/mcp/tools");
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch (err) {
      console.error("Failed to load MCP tools:", err);
    }
  }

  async function handleConnectAll() {
    setConnecting(true);
    try {
      const res = await fetch("/api/mcp/connect", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Connected to ${data.servers.filter((s: MCPServer) => s.connected).length} servers`
        );
        await loadServers();
        await loadTools();
      }
    } catch {
      toast.error("Failed to connect MCP servers");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnectAll() {
    try {
      const res = await fetch("/api/mcp/connect", { method: "DELETE" });
      if (res.ok) {
        toast.success("Disconnected from all MCP servers");
        await loadServers();
        setTools([]);
      }
    } catch {
      toast.error("Failed to disconnect MCP servers");
    }
  }

  async function handleSave() {
    try {
      const url = editingServer
        ? `/api/mcp/servers/${editingServer.id}`
        : "/api/mcp/servers";

      const method = editingServer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingServer ? "Server updated" : "Server added");
        setShowAddForm(false);
        setEditingServer(null);
        setFormData({ name: "", url: "", apiKey: "", isActive: true });
        await loadServers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save server");
      }
    } catch {
      toast.error("Failed to save server");
    }
  }

  async function handleDelete(serverId: string) {
    try {
      const res = await fetch(`/api/mcp/servers/${serverId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Server deleted");
        setDeleteConfirm(null);
        await loadServers();
        await loadTools();
      }
    } catch {
      toast.error("Failed to delete server");
    }
  }

  async function handleToggleActive(server: MCPServer) {
    try {
      const res = await fetch(`/api/mcp/servers/${server.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !server.isActive }),
      });
      if (res.ok) {
        toast.success(server.isActive ? "Server deactivated" : "Server activated");
        await loadServers();
      }
    } catch {
      toast.error("Failed to update server");
    }
  }

  function handleEdit(server: MCPServer) {
    setEditingServer(server);
    setFormData({
      name: server.name,
      url: server.url,
      apiKey: server.apiKey || "",
      isActive: server.isActive,
    });
    setShowAddForm(true);
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Skip link target */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary"
      >
        Lewati ke konten
      </a>

      <div id="main-content" tabIndex={-1}>
        <h2 className="text-2xl font-bold text-foreground">
          MCP Server Configuration
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage Model Context Protocol (MCP) servers. Connect to external MCP
          servers to use their tools in your chatbot.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            Connected Servers
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleConnectAll}
              disabled={connecting}
              className="px-4 py-2 bg-success text-success-foreground text-sm font-medium rounded-lg hover:bg-success/90 disabled:opacity-50 transition-colors"
            >
              {connecting ? "Connecting..." : "Connect All"}
            </button>
            <button
              onClick={handleDisconnectAll}
              className="px-4 py-2 bg-destructive text-white text-sm font-medium rounded-lg hover:bg-destructive/90 transition-colors"
            >
              Disconnect All
            </button>
            <button
              onClick={() => {
                setEditingServer(null);
                setFormData({ name: "", url: "", apiKey: "", isActive: true });
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Server
            </button>
          </div>
        </div>

        {servers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No MCP servers configured. Click &quot;Add Server&quot; to add one.
          </p>
        ) : (
          <div className="space-y-3" role="list" aria-label="MCP Servers">
            {servers.map((server) => (
              <div
                key={server.id}
                role="listitem"
                className={`p-4 rounded-lg border transition-colors ${
                  server.connected
                    ? "border-success/30 bg-success/5"
                    : server.isActive
                      ? "border-warning/30 bg-warning/5"
                      : "border-border bg-muted/50"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        server.connected
                          ? "bg-success"
                          : server.isActive
                            ? "bg-warning"
                            : "bg-muted-foreground"
                      }`}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-medium text-foreground">
                        {server.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {server.url}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {server.toolCount} tools
                    </span>
                    <button
                      onClick={() => handleToggleActive(server)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        server.isActive
                          ? "bg-warning/10 text-warning-foreground hover:bg-warning/20"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {server.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleEdit(server)}
                      className="px-3 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    >
                      Edit
                    </button>
                    {deleteConfirm === server.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-destructive font-medium">
                          Hapus?
                        </span>
                        <button
                          onClick={() => handleDelete(server.id)}
                          className="px-2 py-1 text-xs bg-destructive text-white rounded hover:bg-destructive/90 transition-colors"
                        >
                          Ya
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-accent transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(server.id)}
                        className="px-3 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <div
          className="bg-card rounded-xl border border-border p-6 space-y-4"
          role="dialog"
          aria-label={editingServer ? "Edit Server" : "Add New Server"}
        >
          <h3 className="text-lg font-semibold text-foreground">
            {editingServer ? "Edit Server" : "Add New Server"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Server Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My MCP Server"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Server URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="http://localhost:3001/sse"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                API Key (Optional)
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder="Bearer token for authentication"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-border"
              />
              <label htmlFor="isActive" className="text-sm text-foreground">
                Active (auto-connect on startup)
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.url}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {editingServer ? "Update" : "Add"} Server
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingServer(null);
                  setFormData({ name: "", url: "", apiKey: "", isActive: true });
                }}
                className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tools.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Available Tools ({tools.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tools.map((tool) => (
              <div
                key={`${tool.serverId}-${tool.name}`}
                className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="font-medium text-sm text-foreground">
                  {tool.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {tool.description}
                </div>
                <div className="text-xs text-primary mt-2">
                  From: {tool.serverName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-primary/5 rounded-xl border border-primary/20 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Mimotes MCP Server
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Your Mimotes instance also runs as an MCP server. Other AI clients can
          connect to it using this URL:
        </p>
        <code className="block p-3 bg-muted rounded text-sm text-foreground font-mono break-all">
          {mcpUrl}
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Tools exposed: ask_question, search_documents, upload_document,
          list_documents, get_document_detail, delete_document, get_system_health
        </p>
      </div>
    </div>
  );
}
