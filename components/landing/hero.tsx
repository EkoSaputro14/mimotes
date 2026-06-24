"use client";

import Link from "next/link";
import { MoveRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export default function LandingHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["precise", "cited", "accurate", "trusted", "instant"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl max-w-2xl tracking-tighter text-center font-bold">
              <span className="text-foreground">Ask questions. Get</span>
              <br />
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold text-primary"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg leading-relaxed tracking-tight text-neutral-600 font-normal max-w-xl text-center mx-auto">
              Upload any document. Get precise answers
              — each one linked to its source.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
            >
              Get started free
              <MoveRight className="w-4 h-4" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Free for 50 documents. No credit card.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
