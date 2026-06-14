"use client";

import { motion } from "framer-motion";
import { Shield, Building2, ClipboardList } from "lucide-react";

const badges = [
  {
    icon: Shield,
    label: "AES-256",
    description: "Encryption",
  },
  {
    icon: Building2,
    label: "Team",
    description: "Isolation",
  },
  {
    icon: ClipboardList,
    label: "Audit",
    description: "Logs",
  },
];

export default function SecuritySection() {
  return (
    <section id="security" className="bg-muted/30 py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl font-bold tracking-tight">
          Private by default.
        </h2>
        <p className="mt-4 text-muted-foreground">
          AES-256 encryption. Workspace isolation.
          <br />
          Audit logging. Your data is never used for training.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background px-6 py-4"
            >
              <badge.icon className="h-6 w-6 text-primary" />
              <div className="text-xs font-medium text-muted-foreground">
                {badge.label}
              </div>
              <div className="text-xs text-muted-foreground/70">
                {badge.description}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
