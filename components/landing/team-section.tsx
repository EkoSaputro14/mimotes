"use client";

import { motion } from "framer-motion";

const members = [
  { initials: "SC", name: "Sarah Chen", role: "Admin" },
  { initials: "MR", name: "Marcus Rivera", role: "Member" },
  { initials: "PS", name: "Priya Sharma", role: "Member" },
  { initials: "AK", name: "Alex Kim", role: "Viewer" },
];

export default function TeamSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everyone works from the
            <br />
            <span className="text-primary">same source of truth.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <div className="text-sm font-medium">Team Workspace</div>
              <div className="text-xs text-muted-foreground">4 members</div>
            </div>
            <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Active
            </div>
          </div>
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.name} className="flex items-center gap-3 px-6 py-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {m.initials}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.name}</div>
                </div>
                <span className="text-xs text-muted-foreground">{m.role}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Shared workspace. Shared knowledge. Same answers.
        </p>
      </div>
    </section>
  );
}
