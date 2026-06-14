"use client";

import { motion } from "framer-motion";
import { Upload, MessageSquare, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "Upload your docs",
    description: "PDF, DOCX, TXT, CSV, XLSX, or website URLs.",
    icon: Upload,
  },
  {
    number: "2",
    title: "Ask any question",
    description: "Natural language. No special syntax needed.",
    icon: MessageSquare,
  },
  {
    number: "3",
    title: "Verify with sources",
    description: "Every answer links to the exact source.",
    icon: CheckCircle,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
        </motion.div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-8 text-center"
            >
              <div className="text-4xl font-bold text-primary mb-4">
                {step.number}
              </div>
              <step.icon className="h-6 w-6 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
