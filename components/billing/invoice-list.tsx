"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string | null;
  paidAt: string | null;
  stripeInvoiceId: string | null;
  createdAt: string;
  lineItems: LineItem[];
  payments: Payment[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case "paid":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "open":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "draft":
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    case "void":
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    case "uncollectible":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    paid: "Dibayar",
    open: "Belum Dibayar",
    draft: "Draft",
    void: "Dibatalkan",
    uncollectible: "Tidak Dapat Ditagih",
  };
  return labels[status] || status;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    draft: "bg-muted text-muted-foreground",
    void: "bg-muted text-muted-foreground",
    uncollectible: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return colors[status] || "bg-muted text-muted-foreground";
}

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/workspace/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
      }
    } catch {
      console.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  }

  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPending = invoices
    .filter((inv) => inv.status === "open")
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Invoice & Pembayaran
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Lihat dan kelola invoice serta riwayat pembayaran
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Total Dibayar</span>
          </div>
          <div className="text-xl font-bold text-foreground">{formatCents(totalPaid)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Belum Dibayar</span>
          </div>
          <div className="text-xl font-bold text-foreground">{formatCents(totalPending)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Invoice</span>
          </div>
          <div className="text-xl font-bold text-foreground">{invoices.length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["", "paid", "open", "draft"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {status === "" ? "Semua" : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Belum ada invoice</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Invoice Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === invoice.id ? null : invoice.id)
                }
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(invoice.status)}
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {getStatusLabel(invoice.status)}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCents(invoice.total)}
                  </span>
                  {expandedId === invoice.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Detail */}
              {expandedId === invoice.id && (
                <div className="border-t border-border px-4 py-4 space-y-4">
                  {/* Line Items */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Detail Item
                    </h4>
                    <div className="space-y-1">
                      {invoice.lineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0"
                        >
                          <span className="text-foreground">{item.description}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              {item.quantity} × {formatCents(item.unitPrice)}
                            </span>
                            <span className="font-medium text-foreground w-20 text-right">
                              {formatCents(item.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatCents(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pajak</span>
                      <span className="text-foreground">{formatCents(invoice.tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">{formatCents(invoice.total)}</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    {invoice.dueDate && (
                      <div>
                        <span className="font-medium">Jatuh Tempo:</span>{" "}
                        {formatDate(invoice.dueDate)}
                      </div>
                    )}
                    {invoice.paidAt && (
                      <div>
                        <span className="font-medium">Dibayar:</span>{" "}
                        {formatDate(invoice.paidAt)}
                      </div>
                    )}
                    {invoice.stripeInvoiceId && (
                      <div>
                        <span className="font-medium">Stripe ID:</span>{" "}
                        {invoice.stripeInvoiceId}
                      </div>
                    )}
                  </div>

                  {/* Payments */}
                  {invoice.payments.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Pembayaran
                      </h4>
                      <div className="space-y-1">
                        {invoice.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between text-sm py-1.5"
                          >
                            <span className="text-foreground">
                              {formatCents(payment.amount)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDate(payment.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
