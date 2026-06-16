"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  Zap,
  UserCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface LeadAlert {
  id: string;
  leadName: string | null;
  leadEmail: string | null;
  leadScore: string;
  leadStatus: string;
  leadIntent: string | null;
  startedAt: string;
  widget: { name: string } | null;
}

interface LeadAlertsData {
  newLeads: number;
  highLeads: number;
  convertedLeads: number;
  recentAlerts: LeadAlert[];
}

export function LeadAlerts() {
  const [data, setData] = useState<LeadAlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/widget/leads?perPage=5");
      const json = await res.json();

      const leads = json.leads || [];
      const newLeads = leads.filter(
        (l: LeadAlert) => l.leadStatus === "new"
      ).length;
      const highLeads = leads.filter(
        (l: LeadAlert) => l.leadScore === "high"
      ).length;
      const convertedLeads = leads.filter(
        (l: LeadAlert) => l.leadStatus === "converted"
      ).length;

      setData({
        newLeads,
        highLeads,
        convertedLeads,
        recentAlerts: leads.slice(0, 5),
      });
    } catch (error) {
      console.error("Failed to fetch lead alerts:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Lead Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const hasAlerts =
    data.newLeads > 0 || data.highLeads > 0 || data.convertedLeads > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-5" />
            Lead Alerts
          </div>
          <Link
            href="/settings/leads"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAlerts ? (
          <div className="text-center py-6">
            <Bell className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No new alerts. Leads will appear here when captured.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Alert Summary Badges */}
            <div className="flex gap-2 flex-wrap">
              {data.newLeads > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <AlertCircle className="size-3.5" />
                  {data.newLeads} New
                </div>
              )}
              {data.highLeads > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                  <Zap className="size-3.5" />
                  {data.highLeads} High-Intent
                </div>
              )}
              {data.convertedLeads > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium">
                  <UserCheck className="size-3.5" />
                  {data.convertedLeads} Converted
                </div>
              )}
            </div>

            {/* Recent Alerts */}
            <div className="space-y-2">
              {data.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {alert.leadScore === "high" ? (
                      <Zap className="size-4 text-destructive" />
                    ) : alert.leadStatus === "converted" ? (
                      <UserCheck className="size-4 text-success" />
                    ) : (
                      <AlertCircle className="size-4 text-primary" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {alert.leadName || alert.leadEmail || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.leadIntent
                          ? `Intent: ${alert.leadIntent}`
                          : alert.widget?.name || "Widget"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        alert.leadScore === "high"
                          ? "bg-destructive/10 text-destructive"
                          : alert.leadScore === "medium"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {alert.leadScore}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        alert.leadStatus === "converted"
                          ? "bg-success/10 text-success"
                          : alert.leadStatus === "qualified"
                          ? "bg-warning/10 text-warning"
                          : alert.leadStatus === "contacted"
                          ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {alert.leadStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
