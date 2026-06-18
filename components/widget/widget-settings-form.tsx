"use client";

import { useState, useEffect } from "react";

interface Widget {
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
  leadCaptureEnabled: boolean;
  leadFields: Array<{ name: string; label: string; type: string; required: boolean }>;
  _count?: { conversations: number; widgetConversations?: number };
  // Business profile
  mode?: string;
  businessName?: string | null;
  businessDescription?: string | null;
  businessWhatsApp?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  businessAddress?: string | null;
}

export default function WidgetSettingsForm() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newWidgetName, setNewWidgetName] = useState("");
  const [newWidgetSlug, setNewWidgetSlug] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(false);
  const [leadFields, setLeadFields] = useState([
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "whatsapp", label: "WhatsApp", type: "tel", required: false },
  ]);
  const [leadCount, setLeadCount] = useState(0);
  // Business profile state
  const [widgetMode, setWidgetMode] = useState("knowledge_base");
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessWhatsApp, setBusinessWhatsApp] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => { fetchWidgets(); }, []);

  async function fetchWidgets() {
    try {
      const res = await fetch("/api/widgets/list");
      const data = await res.json();
      setWidgets(data.widgets || []);
    } catch {
      // Widgets not available yet
    } finally {
      setLoading(false);
    }
  }

  async function createWidget() {
    if (!newWidgetName.trim() || !newWidgetSlug.trim()) return;
    const res = await fetch("/api/widgets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newWidgetName, slug: newWidgetSlug }),
    });
    if (res.ok) {
      const data = await res.json();
      setSelectedWidget(data.widget);
      setShowCreate(false);
      setNewWidgetName("");
      setNewWidgetSlug("");
      fetchWidgets();
    }
  }

  function generateEmbedCode(widget: Widget) {
    const baseUrl = window.location.origin;
    return `<script src="${baseUrl}/widget.js" data-key="${widget.publicKey}"></script>`;
  }

  function selectWidget(widget: Widget) {
    setSelectedWidget(widget);
    setEmbedCode(generateEmbedCode(widget));
    setSaved(false);
    setLeadCaptureEnabled(widget.leadCaptureEnabled ?? false);
    if (widget.leadFields && widget.leadFields.length > 0) {
      setLeadFields(widget.leadFields);
    }
    // Load business profile
    setWidgetMode(widget.mode || "knowledge_base");
    setBusinessName(widget.businessName || "");
    setBusinessDescription(widget.businessDescription || "");
    setBusinessWhatsApp(widget.businessWhatsApp || "");
    setBusinessPhone(widget.businessPhone || "");
    setBusinessEmail(widget.businessEmail || "");
    setBusinessAddress(widget.businessAddress || "");
    setProfileSaved(false);
    // Fetch lead count for this widget
    fetchLeadCount(widget.id);
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

  async function saveLeadCapture() {
    if (!selectedWidget) return;
    try {
      const res = await fetch(`/api/widgets/${selectedWidget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadCaptureEnabled,
          leadFields,
        }),
      });
      if (res.ok) {
        setSaved(true);
        fetchWidgets();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save lead capture settings:", error);
    }
  }

  async function saveBusinessProfile() {
    if (!selectedWidget) return;
    try {
      const res = await fetch(`/api/widgets/${selectedWidget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        setProfileSaved(true);
        fetchWidgets();
        setTimeout(() => setProfileSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save business profile:", error);
    }
  }

  return (
    <div className="space-y-8">
      {/* Widget List */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Your Widgets</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Create Widget
          </button>
        </div>

        {showCreate && (
          <div className="bg-card border border-border rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newWidgetName}
                onChange={(e) => setNewWidgetName(e.target.value)}
                placeholder="Widget name"
                className="flex-1 bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
              />
              <input
                type="text"
                value={newWidgetSlug}
                onChange={(e) => setNewWidgetSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                placeholder="slug"
                className="sm:w-40 w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-mono"
              />
              <button onClick={createWidget} className="bg-success hover:bg-success/90 text-white px-4 py-2 rounded text-sm">Create</button>
              <button onClick={() => setShowCreate(false)} className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : widgets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No widgets yet. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {widgets.map((w) => (
              <div
                key={w.id}
                onClick={() => selectWidget(w)}
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  selectedWidget?.id === w.id
                    ? "bg-primary/10 border-primary"
                    : "bg-card/50 border-border hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium">{w.name}</span>
                    <span className="text-muted-foreground text-sm ml-2 font-mono">/{w.slug}</span>
                    {!w.isActive && <span className="text-destructive text-xs ml-2">(disabled)</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded" style={{ background: w.primaryColor }} />
                    <span>{w._count?.conversations ?? 0} conversations</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Widget Config */}
      {selectedWidget && (
        <section className="bg-card/50 border border-border rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">{selectedWidget.name} Settings</h3>

          {/* Embed Code */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Embed Code</label>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-success break-all">
              {embedCode}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(embedCode); setSaved(true); }}
              className="mt-2 text-sm text-primary hover:text-primary/80"
            >
              {saved ? "✅ Copied!" : "📋 Copy embed code"}
            </button>
          </div>

          {/* API Keys */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Public Key</label>
              <code className="block bg-black/40 rounded p-2 text-xs text-foreground break-all">{selectedWidget.publicKey}</code>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Secret Key</label>
              <code className="block bg-black/40 rounded p-2 text-xs text-foreground break-all">{selectedWidget.secretKey}</code>
            </div>
          </div>

          {/* Theme */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Primary Color</label>
              <div className="flex gap-2">
                <input type="color" defaultValue={selectedWidget.primaryColor} className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-muted-foreground text-sm self-center">{selectedWidget.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Background</label>
              <div className="flex gap-2">
                <input type="color" defaultValue={selectedWidget.backgroundColor} className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-muted-foreground text-sm self-center">{selectedWidget.backgroundColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Text Color</label>
              <div className="flex gap-2">
                <input type="color" defaultValue={selectedWidget.textColor} className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-muted-foreground text-sm self-center">{selectedWidget.textColor}</span>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Welcome Message</label>
            <input
              type="text"
              defaultValue={selectedWidget.welcomeMessage}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Position</label>
            <select defaultValue={selectedWidget.position} className="bg-background border border-border rounded px-3 py-2 text-foreground text-sm">
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          {/* Business Profile */}
          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-medium text-white mb-1">Business Profile</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Tell the AI about your business for natural, helpful responses.
            </p>

            {/* Mode Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Operating Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "knowledge_base", label: "Knowledge Base", desc: "Citations visible, strict" },
                  { value: "customer_service", label: "Customer Service", desc: "Natural, helpful (Recommended)" },
                  { value: "sales_agent", label: "Sales Agent", desc: "Lead capture, conversion" },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setWidgetMode(m.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      widgetMode === m.value
                        ? "border-primary bg-primary/10 text-white"
                        : "border-border bg-background text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span className="text-sm font-medium block">{m.label}</span>
                    <span className="text-xs opacity-70">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Business Fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Toko Budi Elektronik"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">WhatsApp</label>
                <input
                  type="text"
                  value={businessWhatsApp}
                  onChange={(e) => setBusinessWhatsApp(e.target.value)}
                  placeholder="6281234567890"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                <input
                  type="text"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="info@tokobudi.com"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-1 block">Business Description</label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Toko elektronik di Surabaya. Menjual TV, AC, kulkas, mesin cuci. Melayani COD dan pengiriman."
                rows={3}
                className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-1 block">Address</label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Jl. Raya Darmo 123, Surabaya"
                className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
              />
            </div>
            <button
              onClick={saveBusinessProfile}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded text-sm font-medium"
            >
              {profileSaved ? "✅ Profile Saved!" : "Save Business Profile"}
            </button>
          </div>

          {/* Allowed Domains */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Allowed Domains (comma-separated)</label>
            <input
              type="text"
              defaultValue={(selectedWidget.allowedDomains ?? []).join(", ")}
              placeholder="example.com, *.example.com"
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
            />
          </div>

          {/* Lead Capture */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-white">Lead Capture</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Collect visitor information before or during conversations.
                </p>
              </div>
              <button
                onClick={() => setLeadCaptureEnabled(!leadCaptureEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  leadCaptureEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    leadCaptureEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {leadCaptureEnabled && (
              <div className="space-y-3 bg-background/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Configure which fields to collect. Toggling &quot;Required&quot; makes the field mandatory.
                </p>
                {leadFields.map((field, idx) => (
                  <div
                    key={field.name}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white font-medium">
                        {field.label}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({field.type})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = [...leadFields];
                        updated[idx] = { ...updated[idx], required: !updated[idx].required };
                        setLeadFields(updated);
                      }}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        field.required
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {field.required ? "Required" : "Optional"}
                    </button>
                  </div>
                ))}
                <button
                  onClick={saveLeadCapture}
                  className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded text-sm font-medium"
                >
                  {saved ? "✅ Saved!" : "Save Lead Capture Settings"}
                </button>
              </div>
            )}
          </div>

          {/* Leads Quick Link */}
          <div className="border-t border-border pt-4">
            <a
              href="/settings/leads"
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors group"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <div>
                  <p className="text-sm text-white font-medium">View All Leads</p>
                  <p className="text-xs text-muted-foreground">{leadCount} leads captured</p>
                </div>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
            </a>
          </div>
        </section>
      )}

      {/* Analytics Preview */}
      {selectedWidget && (
        <section className="bg-card/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Analytics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-muted-foreground text-xs mb-1">Total Conversations</p>
              <p className="text-white text-2xl font-bold">{selectedWidget._count?.conversations ?? 0}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-muted-foreground text-xs mb-1">Status</p>
              <p className={`text-2xl font-bold ${selectedWidget.isActive ? "text-success" : "text-destructive"}`}>
                {selectedWidget.isActive ? "Active" : "Disabled"}
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-muted-foreground text-xs mb-1">Domains</p>
              <p className="text-white text-2xl font-bold">{(selectedWidget.allowedDomains ?? []).length || "All"}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
