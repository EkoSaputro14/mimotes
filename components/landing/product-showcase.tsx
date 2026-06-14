"use client";

import Link from "next/link";
import { MoveRight, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductShowcase() {
  return (
    <section id="product" className="pb-16 pt-8 sm:pb-24 sm:pt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <div className="size-2.5 rounded-full bg-muted" />
            <div className="size-2.5 rounded-full bg-muted" />
            <div className="size-2.5 rounded-full bg-muted" />
            <span className="ml-2 text-xs text-muted-foreground">MimoNotes</span>
          </div>

          {/* Real screenshot */}
          <div className="relative">
            <img
              src="/images/landing-showcase.png"
              alt="MimoNotes chat interface showing a question about vacation policy with source citation from Employee Handbook"
              className="w-full h-auto"
              loading="eager"
            />

            {/* Citation highlight overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6 pt-12">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex max-w-md items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-lg shadow-primary/10"
              >
                <FileText className="size-4 shrink-0 text-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Source: Employee Handbook.pdf
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Section 4.2, Page 12
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          ↑ Source citation — always visible
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-6 text-center"
        >
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
          >
            Get started free
            <MoveRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
