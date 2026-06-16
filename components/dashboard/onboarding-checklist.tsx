"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface OnboardingChecklistProps {
  hasDocuments: boolean;
  hasChats: boolean;
}

interface Step {
  label: string;
  description: string;
  href: string;
  icon: typeof Upload;
  completed: boolean;
}

export function OnboardingChecklist({
  hasDocuments,
  hasChats,
}: OnboardingChecklistProps) {
  const steps: Step[] = [
    {
      label: "Upload dokumen pertama",
      description: "PDF, DOCX, TXT, CSV, atau URL website",
      href: "/documents/upload",
      icon: Upload,
      completed: hasDocuments,
    },
    {
      label: "Mulai chat dengan AI",
      description: "Ajukan pertanyaan berdasarkan dokumen Anda",
      href: "/chat",
      icon: MessageSquare,
      completed: hasChats,
    },
    {
      label: "Lihat analitik penggunaan",
      description: "Pantau penggunaan dan kualitas jawaban",
      href: "/analytics/usage",
      icon: BarChart3,
      completed: false,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Mulai dengan Mimotes</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {completedCount}/{steps.length} langkah selesai
            </p>
          </div>
          {/* E2: Progress ring */}
          <div className="relative size-10">
            <svg className="size-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-muted"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeDasharray={`${progress} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
              {progress}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.href}
                href={step.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  step.completed
                    ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                    : "hover:bg-accent"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
              >
                <div
                  className={`flex size-8 items-center justify-center rounded-full flex-shrink-0 ${
                    step.completed
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      step.completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {!step.completed && (
                  <Circle className="size-4 text-muted-foreground flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
