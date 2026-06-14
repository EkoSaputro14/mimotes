"use client";

import Link from "next/link";
import { CheckCircle2, MoveRight } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  "50 documents",
  "Unlimited chat",
  "1 workspace",
  "Team collaboration",
  "Source citations",
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight">Start for free.</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-12 max-w-sm overflow-hidden rounded-2xl border border-border bg-card p-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              ★ Most Popular
            </div>
            <div className="mt-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Starter
            </div>
            <div className="mt-2 text-3xl font-bold">Free</div>
          </div>

          <div className="mt-8 space-y-3">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>

          <Link
            href="/register"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started free
            <MoveRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pro plans coming soon.
        </p>
      </div>
    </section>
  );
}
