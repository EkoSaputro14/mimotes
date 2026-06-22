"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import WidgetPreview from "@/components/widget/widget-preview";

interface WidgetData {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  welcomeMessage: string;
  position: string;
  quickReplies: string[];
  leadCaptureEnabled: boolean;
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const widgetId = searchParams.get("id");
  const [widget, setWidget] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWidget() {
      if (!widgetId) {
        setError("No widget ID provided. Add ?id=<widgetId> to the URL.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/widgets/${widgetId}`);
        if (!res.ok) {
          setError("Widget not found");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setWidget(data.widget || data);
      } catch {
        setError("Failed to load widget");
      } finally {
        setLoading(false);
      }
    }
    loadWidget();
  }, [widgetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading widget...</div>
      </div>
    );
  }

  if (error || !widget) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-8">
        <h1 className="text-2xl font-bold mb-2">Widget Preview</h1>
        <p className="text-muted-foreground">{error || "No widget found"}</p>
        <p className="text-sm text-muted-foreground mt-4">
          Usage: <code className="bg-muted px-1 rounded">/widget/preview?id=YOUR_WIDGET_ID</code>
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Simulated website */}
      <div className="absolute inset-0">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <h1 className="text-lg font-semibold">Demo Website</h1>
          <p className="text-sm text-muted-foreground">
            This page simulates how your widget will look on a real website.
          </p>
        </div>
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="h-4 bg-muted rounded w-1/2 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="h-4 bg-muted rounded w-1/2 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="h-4 bg-muted rounded w-1/2 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <div className="h-4 bg-muted rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
              <div className="h-3 bg-muted rounded w-4/6" />
            </div>
          </div>
        </div>
      </div>

      {/* Widget */}
      <WidgetPreview widget={widget} />
    </div>
  );
}

export default function WidgetPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
