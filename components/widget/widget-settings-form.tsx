"use client";

import { useState, useEffect } from "react";
import { Save, Copy, Check, ExternalLink, Eye, Settings, Plus, Users, BarChart3, Globe, Key, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WidgetPreview from "./widget-preview";

interface WidgetData {
  id: string;
  name: string;
  slug: string;
  publicKey: string;
  secretKey: string;
  allowedDomains: string[];
  isActive: boolean;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  welcomeMessage: string;
  position: string;
  quickReplies: string[];
  leadCaptureEnabled: boolean;
  leadFields: Array<{ name: string; label: string; type: string; required: boolean }>;
  _count?: { conversations: number };
  // Business profile
  mode?: string;
  businessName?: string | null;
  businessDescription?: string | null;
  businessWhatsApp?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  businessAddress?: string | null;
}

const PRESET_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Green", value: "#10B981" },
  { name: "Pink", value: "#EC4899" },
  { name: "Orange", value: "#F97316" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Teal", value: "#14B8A6" },
];

export default function WidgetSettingsForm() {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newQuickReply, setNewQuickReply] = useState("");

  // Create widget state
  const [showCreate, setShowCreate] = useState(false);
  const [newWidgetName, setNewWidgetName] = useState("");
  const [newWidgetSlug, setNewWidgetSlug] = useState("");

  // Allowed domains state
  const [domainsInput, setDomainsInput] = useState("");

  // Business profile state
  const [widgetMode, setWidgetMode] = useState("knowledge_base");
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessWhatsApp, setBusinessWhatsApp] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // Leads count
  const [leadCount, setLeadCount] = useState(0);

  // Load widgets
  useEffect(() => {
    loadWidgets();
  }, []);

  async function loadWidgets() {
    try {
      const res = await fetch("/api/widgets/list");
      if (res.ok) {
        const data = await res.json();
        setWidgets(data.widgets || []);
        if (data.widgets?.length > 0 && !selectedWidget) {
          selectWidget(data.widgets[0]);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function selectWidget(w: WidgetData) {
    setSelectedWidget(w);
    setDomainsInput((w.allowedDomains || []).join(", "));
    setCopied(false);
    // Load business profile
    setWidgetMode(w.mode || "knowledge_base");
    setBusinessName(w.businessName || "");
    setBusinessDescription(w.businessDescription || "");
    setBusinessWhatsApp(w.businessWhatsApp || "");
    setBusinessPhone(w.businessPhone || "");
    setBusinessEmail(w.businessEmail || "");
    setBusinessAddress(w.businessAddress || "");
    // Fetch lead count
    fetchLeadCount(w.id);
  }

  async function fetchLeadCount(widgetId: string) {
    try {
      const res = await fetch(`/api/widget/leads?widgetId=${widgetId}&perPage=1`);
      const data = await res.json();
      setLeadCount(data.total || 0);
    } catch {
      setLeadCount(0);
    }
  }

  // Create widget
  async function createWidget() {
    if (!newWidgetName.trim() || !newWidgetSlug.trim()) return;
    try {
      const res = await fetch("/api/widgets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWidgetName, slug: newWidgetSlug }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setNewWidgetName("");
        setNewWidgetSlug("");
        await loadWidgets();
        if (data.widget) selectWidget(data.widget);
      }
    } catch {
      // silent
    }
  }

  // Save all settings
  async function handleSave() {
    if (!selectedWidget) return;
    setSaving(true);
    try {
      const res = await fetch("/api/widgets/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: selectedWidget.id,
          name: selectedWidget.name,
          primaryColor: selectedWidget.primaryColor,
          backgroundColor: selectedWidget.backgroundColor,
          textColor: selectedWidget.textColor,
          welcomeMessage: selectedWidget.welcomeMessage,
          position: selectedWidget.position,
          quickReplies: selectedWidget.quickReplies,
          leadCaptureEnabled: selectedWidget.leadCaptureEnabled,
          allowedDomains: domainsInput
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
          // Business profile
          mode: widgetMode,
          businessName,
          businessDescription,
          businessWhatsApp,
          businessPhone,
          businessEmail,
          businessAddress,
        }),
      });
      if (res.ok) {
        await loadWidgets();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  // Copy embed code
  function handleCopyEmbed() {
    if (!selectedWidget) return;
    const embedCode = `<script src="${window.location.origin}/api/widget/embed" data-public-key="${selectedWidget.publicKey}" async></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Copy API key to clipboard
  function handleCopyKey(key: string, label: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // Add quick reply
  function addQuickReply() {
    if (!newQuickReply.trim() || !selectedWidget) return;
    setSelectedWidget({
      ...selectedWidget,
      quickReplies: [...selectedWidget.quickReplies, newQuickReply.trim()],
    });
    setNewQuickReply("");
  }

  // Remove quick reply
  function removeQuickReply(index: number) {
    if (!selectedWidget) return;
    setSelectedWidget({
      ...selectedWidget,
      quickReplies: selectedWidget.quickReplies.filter((_, i) => i !== index),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground">Loading widgets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Widget Selector + Create */}
      <section className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Widget Settings</h2>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Widget
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-lg border bg-background p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newWidgetName}
                onChange={(e) => setNewWidgetName(e.target.value)}
                placeholder="Widget name"
                className="flex-1"
              />
              <Input
                value={newWidgetSlug}
                onChange={(e) => setNewWidgetSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                placeholder="slug"
                className="sm:w-40 font-mono"
              />
              <Button size="sm" onClick={createWidget}>Create</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Widget dropdown */}
        {widgets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No widgets yet. Create one to get started.</p>
        ) : (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">Widget:</label>
            <select
              value={selectedWidget?.id || ""}
              onChange={(e) => {
                const w = widgets.find((w) => w.id === e.target.value);
                if (w) selectWidget(w);
              }}
              className="flex-1 h-9 rounded-md border bg-background px-3 text-sm"
            >
              {widgets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w._count?.conversations ?? 0} chat) {!w.isActive && "• disabled"}
                </option>
              ))}
            </select>
            {selectedWidget && (
              <Badge variant={selectedWidget.isActive ? "default" : "secondary"}>
                {selectedWidget.isActive ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
        )}
      </section>

      {/* Widget Config */}
      {selectedWidget && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Settings Form */}
          <div className="space-y-6">
            {/* Widget Info */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Widget Info
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <Input
                  value={selectedWidget.name}
                  onChange={(e) =>
                    setSelectedWidget((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder="Widget name"
                />
              </div>
            </div>

            {/* API Keys */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Public Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block bg-muted rounded-md px-3 py-2 text-xs break-all font-mono">
                      {selectedWidget.publicKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(selectedWidget.publicKey, "public")}
                      className="shrink-0 p-2 rounded-md hover:bg-muted transition-colors"
                      title="Copy Public Key"
                    >
                      {copiedKey === "public" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Secret Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block bg-muted rounded-md px-3 py-2 text-xs break-all font-mono">
                      {selectedWidget.secretKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(selectedWidget.secretKey, "secret")}
                      className="shrink-0 p-2 rounded-md hover:bg-muted transition-colors"
                      title="Copy Secret Key"
                    >
                      {copiedKey === "secret" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold">Theme & Colors</h3>

              {/* Primary Color */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedWidget.primaryColor}
                    onChange={(e) =>
                      setSelectedWidget((prev) =>
                        prev ? { ...prev, primaryColor: e.target.value } : null
                      )
                    }
                    className="h-9 w-9 rounded-md border cursor-pointer"
                  />
                  <Input
                    value={selectedWidget.primaryColor}
                    onChange={(e) =>
                      setSelectedWidget((prev) =>
                        prev ? { ...prev, primaryColor: e.target.value } : null
                      )
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() =>
                        setSelectedWidget((prev) =>
                          prev ? { ...prev, primaryColor: c.value } : null
                        )
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        selectedWidget.primaryColor === c.value
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedWidget.backgroundColor}
                    onChange={(e) =>
                      setSelectedWidget((prev) =>
                        prev ? { ...prev, backgroundColor: e.target.value } : null
                      )
                    }
                    className="h-9 w-9 rounded-md border cursor-pointer"
                  />
                  <Input
                    value={selectedWidget.backgroundColor}
                    onChange={(e) =>
                      setSelectedWidget((prev) =>
                        prev ? { ...prev, backgroundColor: e.target.value } : null
                      )
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedWidget.textColor}
                    onChange={(e) =>
                      setSelectedWidget((prev) =>
                        prev ? { ...prev, textColor: e.target.value } : null
                      )
                    }
                    className="h-9 w-9 rounded-md border cursor-pointer"
                  />
                  <Input
                    value={selectedWidget.textColor}
                    onChange={(e) =>
                      setSelectedWidget((prev) =>
                        prev ? { ...prev, textColor: e.target.value } : null
                      )
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Position */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold">Position</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "bottom-right", label: "↘ Bottom Right" },
                  { value: "bottom-left", label: "↙ Bottom Left" },
                  { value: "top-right", label: "↗ Top Right" },
                  { value: "top-left", label: "↖ Top Left" },
                ].map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() =>
                      setSelectedWidget((prev) =>
                        prev ? { ...prev, position: pos.value } : null
                      )
                    }
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedWidget.position === pos.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Welcome Message */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold">Welcome Message</h3>
              <textarea
                value={selectedWidget.welcomeMessage}
                onChange={(e) =>
                  setSelectedWidget((prev) =>
                    prev ? { ...prev, welcomeMessage: e.target.value } : null
                  )
                }
                rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Hi! How can I help you?"
              />
            </div>

            {/* Quick Replies */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold">Quick Replies</h3>
              <div className="flex flex-wrap gap-2">
                {selectedWidget.quickReplies.map((reply, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-sm"
                  >
                    {reply}
                    <button
                      onClick={() => removeQuickReply(i)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newQuickReply}
                  onChange={(e) => setNewQuickReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQuickReply())}
                  placeholder="Add quick reply..."
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addQuickReply}>
                  Add
                </Button>
              </div>
            </div>

            {/* Allowed Domains */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Allowed Domains
              </h3>
              <p className="text-xs text-muted-foreground">
                Comma-separated list of domains allowed to embed this widget. Leave empty for all domains.
              </p>
              <Input
                value={domainsInput}
                onChange={(e) => setDomainsInput(e.target.value)}
                placeholder="example.com, *.example.com"
              />
            </div>

            {/* Lead Capture */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Lead Capture</h3>
                <button
                  onClick={() =>
                    setSelectedWidget((prev) =>
                      prev
                        ? { ...prev, leadCaptureEnabled: !prev.leadCaptureEnabled }
                        : null
                    )
                  }
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    selectedWidget.leadCaptureEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      selectedWidget.leadCaptureEnabled ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Show a form to collect name, email, and phone before chatting.
              </p>
            </div>

            {/* Business Profile */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Profile
              </h3>
              <p className="text-xs text-muted-foreground">
                Configure your business details for the chatbot responses.
              </p>

              {/* Mode */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Chat Mode</label>
                <select
                  value={widgetMode}
                  onChange={(e) => setWidgetMode(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="knowledge_base">📚 Knowledge Base</option>
                  <option value="customer_service">💬 Customer Service</option>
                  <option value="sales_agent">🛒 Sales Agent</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Business Name</label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Toko Budi Elektronik"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
                  <Input
                    value={businessWhatsApp}
                    onChange={(e) => setBusinessWhatsApp(e.target.value)}
                    placeholder="6281234567890"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <Input
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="info@tokobudi.com"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Business Description</label>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Toko elektronik di Surabaya. Menjual TV, AC, kulkas, mesin cuci."
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                <Input
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Jl. Raya Darmo 123, Surabaya"
                />
              </div>
            </div>

            {/* Leads Quick Link */}
            <div className="rounded-lg border bg-card p-4">
              <a
                href="/settings/leads"
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-white font-medium">View All Leads</p>
                    <p className="text-xs text-muted-foreground">{leadCount} leads captured</p>
                  </div>
                </div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
              </a>
            </div>
          </div>

          {/* Right: Live Preview + Embed + Analytics */}
          <div className="space-y-6">
            {/* Live Preview */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-semibold">Live Preview</span>
              </div>
              <div className="rounded-lg border bg-muted/30 p-6 min-h-[500px] relative overflow-hidden">
                <WidgetPreview widget={selectedWidget} />
              </div>
            </div>

            {/* Embed Code */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">Embed Code</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted rounded-md px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap">
                  {`<script src=".../api/widget/embed" data-public-key="${selectedWidget.publicKey}" async></script>`}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyEmbed}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <a
                href={`/widget/preview?id=${selectedWidget.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Preview
                </Button>
              </a>
            </div>

            {/* Analytics */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs mb-1">Conversations</p>
                  <p className="text-white text-xl font-bold">{selectedWidget._count?.conversations ?? 0}</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <p className={`text-xl font-bold ${selectedWidget.isActive ? "text-success" : "text-destructive"}`}>
                    {selectedWidget.isActive ? "Active" : "Off"}
                  </p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs mb-1">Domains</p>
                  <p className="text-white text-xl font-bold">{(selectedWidget.allowedDomains || []).length || "All"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {selectedWidget && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
