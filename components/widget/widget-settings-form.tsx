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
  _count?: { conversations: number };
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

  return (
    <div className="space-y-8">
      {/* Widget List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Your Widgets</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Create Widget
          </button>
        </div>

        {showCreate && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newWidgetName}
                onChange={(e) => setNewWidgetName(e.target.value)}
                placeholder="Widget name"
                className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              />
              <input
                type="text"
                value={newWidgetSlug}
                onChange={(e) => setNewWidgetSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                placeholder="slug"
                className="w-40 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono"
              />
              <button onClick={createWidget} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">Create</button>
              <button onClick={() => setShowCreate(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : widgets.length === 0 ? (
          <p className="text-gray-500 text-sm">No widgets yet. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {widgets.map((w) => (
              <div
                key={w.id}
                onClick={() => { setSelectedWidget(w); setEmbedCode(generateEmbedCode(w)); setSaved(false); }}
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  selectedWidget?.id === w.id
                    ? "bg-blue-900/30 border-blue-600"
                    : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium">{w.name}</span>
                    <span className="text-gray-400 text-sm ml-2 font-mono">/{w.slug}</span>
                    {!w.isActive && <span className="text-red-400 text-xs ml-2">(disabled)</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
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
        <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">{selectedWidget.name} Settings</h3>

          {/* Embed Code */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Embed Code</label>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-green-300 break-all">
              {embedCode}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(embedCode); setSaved(true); }}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              {saved ? "✅ Copied!" : "📋 Copy embed code"}
            </button>
          </div>

          {/* API Keys */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Public Key</label>
              <code className="block bg-black/40 rounded p-2 text-xs text-gray-300 break-all">{selectedWidget.publicKey}</code>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Secret Key</label>
              <code className="block bg-black/40 rounded p-2 text-xs text-gray-300 break-all">{selectedWidget.secretKey}</code>
            </div>
          </div>

          {/* Theme */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Primary Color</label>
              <div className="flex gap-2">
                <input type="color" defaultValue={selectedWidget.primaryColor} className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm self-center">{selectedWidget.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Background</label>
              <div className="flex gap-2">
                <input type="color" defaultValue={selectedWidget.backgroundColor} className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm self-center">{selectedWidget.backgroundColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Text Color</label>
              <div className="flex gap-2">
                <input type="color" defaultValue={selectedWidget.textColor} className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm self-center">{selectedWidget.textColor}</span>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Welcome Message</label>
            <input
              type="text"
              defaultValue={selectedWidget.welcomeMessage}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Position</label>
            <select defaultValue={selectedWidget.position} className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          {/* Allowed Domains */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Allowed Domains (comma-separated)</label>
            <input
              type="text"
              defaultValue={selectedWidget.allowedDomains.join(", ")}
              placeholder="example.com, *.example.com"
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>
        </section>
      )}

      {/* Analytics Preview */}
      {selectedWidget && (
        <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Analytics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Total Conversations</p>
              <p className="text-white text-2xl font-bold">{selectedWidget._count?.conversations ?? 0}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Status</p>
              <p className={`text-2xl font-bold ${selectedWidget.isActive ? "text-green-400" : "text-red-400"}`}>
                {selectedWidget.isActive ? "Active" : "Disabled"}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Domains</p>
              <p className="text-white text-2xl font-bold">{selectedWidget.allowedDomains.length || "All"}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
