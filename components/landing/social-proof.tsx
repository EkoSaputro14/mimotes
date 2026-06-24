"use client";

import { motion } from "framer-motion";
import { FileText, MessageSquare, Globe } from "lucide-react";

const stats = [
  { icon: FileText, value: "10+", label: "File Formats" },
  { icon: MessageSquare, value: "24/7", label: "AI Support" },
  { icon: Globe, value: "∞", label: "Unlimited Queries" },
];

export default function SocialProof() {
  return (
    <section className="py-12 sm:py-16 border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Trusted by teams who need accurate answers
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-10 sm:gap-16">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 text-muted-foreground/60"
              >
                <stat.icon className="size-5" />
                <span className="text-lg font-bold text-foreground">{stat.value}</span>
                <span className="text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
