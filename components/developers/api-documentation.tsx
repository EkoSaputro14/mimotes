"use client";

import { useState } from "react";

// ============================================================
// API Documentation Component
// ============================================================

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/chat",
    title: "Send Chat Message",
    description: "Send a message and get an AI response.",
    body: `{
  "message": "What is Mimotes?",
  "sessionId": "optional-session-id",
  "model": "optional-model-name"
}`,
    response: `{
  "id": "msg_1717800000000",
  "message": "What is Mimotes?",
  "response": "Mimotes is a knowledge management platform...",
  "model": "default",
  "sessionId": "session_1717800000000",
  "tokens": { "input": 4, "output": 50 }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/search",
    title: "Search Documents",
    description: "Search through your knowledge base.",
    body: `{
  "query": "machine learning",
  "limit": 10,
  "filters": {}
}`,
    response: `{
  "query": "machine learning",
  "results": [...],
  "total": 5,
  "limit": 10
}`,
  },
  {
    method: "GET",
    path: "/api/v1/documents",
    title: "List Documents",
    description: "Get all documents in your workspace.",
    body: null,
    response: `{
  "documents": [
    { "id": "doc_xxx", "name": "Guide.md", "createdAt": "..." }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}`,
  },
];

const codeExamples = {
  curl: (ep: typeof endpoints[0]) => {
    const lines = [`curl -X ${ep.method} "https://your-domain.com${ep.path}" \\`];
    lines.push(`  -H "Authorization: Bearer YOUR_API_KEY" \\`);
    lines.push(`  -H "Content-Type: application/json"`);
    if (ep.body) {
      lines.push(`  -d '${ep.body.replace(/\n\s*/g, " ")}'`);
    }
    return lines.join(" \\\n  ");
  },
  javascript: (ep: typeof endpoints[0]) => {
    const lines = [`const response = await fetch("${ep.path}", {`];
    lines.push(`  method: "${ep.method}",`);
    lines.push(`  headers: {`);
    lines.push(`    "Authorization": "Bearer YOUR_API_KEY",`);
    lines.push(`    "Content-Type": "application/json",`);
    lines.push(`  },`);
    if (ep.body) {
      lines.push(`  body: JSON.stringify(${ep.body.replace(/\n\s*/g, "\n    ")}),`);
    }
    lines.push(`});`);
    lines.push(`const data = await response.json();`);
    return lines.join("\n");
  },
  python: (ep: typeof endpoints[0]) => {
    const lines = [`import requests`, ``];
    lines.push(`response = requests.${ep.method.toLowerCase()}(`);
    lines.push(`    "https://your-domain.com${ep.path}",`);
    lines.push(`    headers={"Authorization": "Bearer YOUR_API_KEY"},`);
    if (ep.body) {
      const body = ep.body.replace(/\n\s*/g, "");
      lines.push(`    json=${body}`);
    }
    lines.push(`)`);
    lines.push(`print(response.json())`);
    return lines.join("\n");
  },
};

export function ApiDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [codeLang, setCodeLang] = useState<"curl" | "javascript" | "python">("curl");

  const ep = endpoints[selectedEndpoint];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">API Endpoints</h3>

      {/* Endpoint list */}
      <div className="space-y-2">
        {endpoints.map((endpoint, i) => (
          <button
            key={i}
            onClick={() => setSelectedEndpoint(i)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedEndpoint === i
                ? "bg-blue-900/30 border-blue-600"
                : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
            }`}
          >
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2 ${
              endpoint.method === "GET" ? "bg-green-600 text-white" : "bg-blue-600 text-white"
            }`}>
              {endpoint.method}
            </span>
            <span className="text-white font-mono text-sm">{endpoint.path}</span>
            <span className="text-gray-400 text-sm ml-2">— {endpoint.title}</span>
          </button>
        ))}
      </div>

      {/* Endpoint details */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p className="text-gray-300 text-sm mb-4">{ep.description}</p>

        {/* Code examples */}
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            {(["curl", "javascript", "python"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setCodeLang(lang)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  codeLang === lang
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {lang === "javascript" ? "JavaScript" : lang === "python" ? "Python" : "cURL"}
              </button>
            ))}
          </div>
          <pre className="bg-black/40 rounded-lg p-4 text-sm text-green-300 font-mono overflow-x-auto">
            {codeExamples[codeLang](ep)}
          </pre>
        </div>

        {/* Response example */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Response</h4>
          <pre className="bg-black/40 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
            {ep.response}
          </pre>
        </div>
      </div>
    </div>
  );
}
