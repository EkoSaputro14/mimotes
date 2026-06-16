"use client";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export default function ProductShowcase() {
  return (
    <section id="product" className="pb-16 pt-8 sm:pb-24 sm:pt-16">
      <ContainerScroll
        titleComponent={
          <>
            <h2 className="text-4xl font-semibold text-foreground dark:text-white">
              See MimoNotes in action
            </h2>
            <p className="text-lg text-muted-foreground mt-2">
              Upload documents, ask questions, get cited answers.
            </p>
          </>
        }
      >
        <img
          src="/images/landing-showcase.png"
          alt="MimoNotes chat interface showing a question about documents with source citation"
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </section>
  );
}
