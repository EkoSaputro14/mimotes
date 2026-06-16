"use client";

import { motion } from "framer-motion";

const faqItems = [
  {
    q: "What file formats are supported?",
    a: "PDF, DOCX, TXT, CSV, XLSX, and website URLs. Drag and drop — we handle the rest.",
  },
  {
    q: "Is my data secure?",
    a: "AES-256 encryption at rest and in transit. Your documents are never used to train AI models.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. 50 documents, unlimited chat, 1 workspace. No credit card required.",
  },
];

export default function FaqSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight">Questions?</h2>
        </motion.div>

        <div className="mt-12 divide-y divide-border">
          {faqItems.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="ml-2 shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
