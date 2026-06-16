"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface ScrollFadeInProps {
  children: ReactNode;
  /** Delay in seconds before this section animates in */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Direction of slide: "up" | "down" | "left" | "right" | "none" */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance in px for the slide offset */
  distance?: number;
  /** Tailwind class for the wrapper */
  className?: string;
}

const slideOffsets = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
  none: {},
};

function ScrollFadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance = 40,
  className,
}: ScrollFadeInProps) {
  const offset =
    direction === "none"
      ? {}
      : direction === "up" || direction === "down"
        ? { y: direction === "up" ? distance : -distance }
        : { x: direction === "left" ? distance : -distance };

  const variants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: { opacity: 1, x: 0, y: 0 },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { ScrollFadeIn };
