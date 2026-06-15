"use client";

import { useState } from "react";
import { ApiKeysManager } from "@/components/developers/api-keys-manager";
import { ApiDocumentation } from "@/components/developers/api-documentation";
import { ApiUsageMetrics } from "@/components/developers/api-usage-metrics";

// ============================================================
// /developers — API Platform Page
// ============================================================

type Tab = "overview" | "keys" | "docs" | "metrics";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "keys", label: "API Keys", icon: "🔑" },
  { id: "docs", label: "Documentation", icon: "📚" },
  { id: "metrics", label: "Usage", icon: "📊" },
];

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-white mb-1">API Platform</h1>
          <p className="text-gray-400 text-sm">
            Access Mimotes programmatically via REST API. Manage keys, view docs, and track usage.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "keys" && <ApiKeysManager />}
        {activeTab === "docs" && <ApiDocumentation />}
        {activeTab === "metrics" && <ApiUsageMetrics />}
      </div>
    </div>
  );
}

// ============================================================
// Overview Tab
// ============================================================

function OverviewTab() {
  return (
    <div className="space-y-8">
      {/* Quick Start */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Start</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
          <Step number={1} title="Get your API key">
            <p className="text-gray-400 text-sm">
              Go to the <strong className="text-white">API Keys</strong> tab and create a new key.
              Save it — it won&apos;t be shown again.
            </p>
          </Step>
          <Step number={2} title="Make your first request">
            <pre className="bg-black/40 rounded-lg p-4 text-sm text-green-300 font-mono overflow-x-auto">
{`curl -X POST "https://your-domain.com/api/v1/chat" \\
  -H "Authorization: Bearer mk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello!"}'`}
            </pre>
          </Step>
          <Step number={3} title="Explore the API">
            <p className="text-gray-400 text-sm">
              Check the <strong className="text-white">Documentation</strong> tab for all available endpoints.
            </p>
          </Step>
        </div>
      </section>

      {/* Rate Limits */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Rate Limits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RateLimitCard plan="Free" requestsPerMinute={10} requestsPerDay={100} />
          <RateLimitCard plan="Pro" requestsPerMinute={60} requestsPerDay={10000} />
          <RateLimitCard plan="Enterprise" requestsPerMinute={600} requestsPerDay={100000} />
        </div>
      </section>

      {/* Authentication */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Authentication</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-300 text-sm mb-4">
            All API requests must include a valid API key in the Authorization header:
          </p>
          <pre className="bg-black/40 rounded-lg p-4 text-sm text-green-300 font-mono">
            Authorization: Bearer mk_live_your_api_key_here
          </pre>
          <div className="mt-4 space-y-2 text-sm text-gray-400">
            <p>• Keys start with <code className="text-gray-300">mk_live_</code></p>
            <p>• Keys are hashed with SHA-256 before storage</p>
            <p>• Revoked or expired keys are immediately rejected</p>
            <p>• Each key is scoped to a single workspace</p>
          </div>
        </div>
      </section>

      {/* Response Headers */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Response Headers</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-300 text-sm mb-4">
            All API responses include rate limit information in headers:
          </p>
          <pre className="bg-black/40 rounded-lg p-4 text-sm text-gray-300 font-mono">
{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1717800060
Retry-After: 30  // only on 429 responses`}
          </pre>
        </div>
      </section>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-white font-medium mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function RateLimitCard({ plan, requestsPerMinute, requestsPerDay }: { plan: string; requestsPerMinute: number; requestsPerDay: number }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">{plan}</h3>
      <div className="space-y-1 text-sm">
        <p className="text-gray-400">
          <span className="text-white font-mono">{requestsPerMinute.toLocaleString()}</span> requests/min
        </p>
        <p className="text-gray-400">
          <span className="text-white font-mono">{requestsPerDay.toLocaleString()}</span> requests/day
        </p>
      </div>
    </div>
  );
}
