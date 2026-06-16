"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface Lead {
  id: string;
  leadName: string | null;
  leadEmail: string | null;
  leadWhatsApp: string | null;
  leadScore: string | null;
  leadStatus: string | null;
  startedAt: string;
  widget: { name: string } | null;
  _count: { messages: number };
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-warning/10 text-warning",
  qualified: "bg-warning/10 text-warning",
  converted: "bg-success/10 text-success",
  lost: "bg-muted text-muted-foreground",
};

const SCORE_COLORS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, [page, search, statusFilter]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/widget/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(conversationId: string, newStatus: string) {
    try {
      await fetch("/api/widget/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, status: newStatus }),
      });
      fetchLeads();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  async function exportCSV() {
    try {
      const res = await fetch("/api/widget/leads/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
    }
  }

  const filteredLeads = leads.filter(
    (l) =>
      !search ||
      l.leadName?.toLowerCase().includes(search.toLowerCase()) ||
      l.leadEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Email</th>
              <th className="p-3 text-left text-sm font-medium">WhatsApp</th>
              <th className="p-3 text-left text-sm font-medium">Score</th>
              <th className="p-3 text-left text-sm font-medium">Status</th>
              <th className="p-3 text-left text-sm font-medium">Widget</th>
              <th className="p-3 text-left text-sm font-medium">Messages</th>
              <th className="p-3 text-left text-sm font-medium">Date</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  No leads found
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b">
                  <td className="p-3 text-sm">{lead.leadName || "—"}</td>
                  <td className="p-3 text-sm">{lead.leadEmail || "—"}</td>
                  <td className="p-3 text-sm">{lead.leadWhatsApp || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${SCORE_COLORS[lead.leadScore || "low"]}`}
                    >
                      {lead.leadScore || "low"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.leadStatus || "new"]}`}
                    >
                      {lead.leadStatus || "new"}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {lead.widget?.name || "—"}
                  </td>
                  <td className="p-3 text-sm">{lead._count.messages}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(lead.startedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <select
                      value={lead.leadStatus || "new"}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} total leads</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={leads.length < 20}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
