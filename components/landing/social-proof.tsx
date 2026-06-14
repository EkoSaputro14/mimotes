"use client";

import { motion } from "framer-motion";

const logos = [
  { name: "Acme Corp", width: 80 },
  { name: "Globex", width: 70 },
  { name: "Initech", width: 75 },
  { name: "Umbrella", width: 85 },
  { name: "Stark", width: 65 },
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

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {logos.map((logo) => (
              <div
                key={logo.name}
                className="text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors duration-200"
                style={{ width: logo.width }}
              >
                <svg
                  viewBox={`0 0 ${logo.width} 24`}
                  fill="currentColor"
                  className="h-6 w-full"
                >
                  <text x="0" y="18" className="text-sm font-semibold">
                    {logo.name}
                  </text>
                </svg>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
