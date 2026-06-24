"use client";

/* ── SVG icons for each file format ──────────────────────────── */

const IconPDF = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 14h8M7 18h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <text x="7" y="10" fill="currentColor" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">PDF</text>
    <path d="M15 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDOCX = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <text x="5" y="10" fill="currentColor" fontSize="5" fontWeight="700" fontFamily="sans-serif">DOC</text>
    <path d="M7 14h8M7 18h8M7 22h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M15 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTXT = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 9l3 0M7 13l6 0M7 17l4 0M7 21l5 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M15 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCSV = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="6" y="7" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="13" y="7" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="6" y="13" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="13" y="13" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="6" y="19" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="13" y="19" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

const IconXLSX = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 7v4M11 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M7 13h4M7 17h4M7 21h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <text x="13" y="24" fill="currentColor" fontSize="5" fontWeight="600" fontFamily="sans-serif">$</text>
    <path d="M15 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconImage = ({ label }: { label: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M6 21l4-5 3 3 2-2 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="5" y="25" fill="currentColor" fontSize="4" fontWeight="600" fontFamily="sans-serif">{label}</text>
  </svg>
);

const IconMD = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <text x="5" y="12" fill="currentColor" fontSize="8" fontWeight="700" fontFamily="sans-serif">M↓</text>
    <path d="M7 16h8M7 20h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M15 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconHTML = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 9l-2 5 2 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 9l2 5-2 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 8l2 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M15 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconJSON = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 8c-2 0-2 2-2 3s0 3 2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 8c2 0 2 2 2 3s0 3-2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="19" r="1" fill="currentColor"/>
    <circle cx="14" cy="19" r="1" fill="currentColor"/>
    <path d="M15 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconURL = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5 10h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
    <path d="M8 17h8M8 21h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M15 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Format data ─────────────────────────────────────────────── */

const formats = [
  { name: "PDF", icon: IconPDF, color: "text-red-400" },
  { name: "DOCX", icon: IconDOCX, color: "text-blue-400" },
  { name: "TXT", icon: IconTXT, color: "text-zinc-400" },
  { name: "CSV", icon: IconCSV, color: "text-emerald-400" },
  { name: "XLSX", icon: IconXLSX, color: "text-green-400" },
  { name: "PNG", icon: () => <IconImage label="PNG" />, color: "text-purple-400" },
  { name: "JPG", icon: () => <IconImage label="JPG" />, color: "text-orange-400" },
  { name: "WEBP", icon: () => <IconImage label="WEBP" />, color: "text-pink-400" },
  { name: "MD", icon: IconMD, color: "text-sky-400" },
  { name: "HTML", icon: IconHTML, color: "text-amber-400" },
  { name: "JSON", icon: IconJSON, color: "text-teal-400" },
  { name: "URL", icon: IconURL, color: "text-violet-400" },
];

/* Split into 2 rows */
const row1 = formats.slice(0, 6);
const row2 = formats.slice(6);

/* ── Single marquee row ──────────────────────────────────────── */

function MarqueeRow({ items, reverse = false }: { items: typeof formats; reverse?: boolean }) {
  return (
    <div className="group flex overflow-hidden py-2 flex-row [--gap:2rem] [--duration:30s]">
      {/* Set 1 */}
      <div
        className={`flex shrink-0 items-center gap-[--gap] animate-marquee flex-row will-change-transform group-hover:paused ${reverse ? "[animation-direction:reverse]" : ""}`}
      >
        {items.map((fmt) => (
          <span
            key={fmt.name}
            className={`flex items-center gap-2 transition-colors cursor-default select-none ${fmt.color}`}
          >
            <fmt.icon />
            <span className="text-sm font-semibold tracking-wide">{fmt.name}</span>
          </span>
        ))}
      </div>
      {/* Set 2 (duplicate for seamless loop) */}
      <div
        className={`flex shrink-0 items-center gap-[--gap] animate-marquee flex-row will-change-transform group-hover:paused ${reverse ? "[animation-direction:reverse]" : ""}`}
        aria-hidden="true"
      >
        {items.map((fmt) => (
          <span
            key={`dup-${fmt.name}`}
            className={`flex items-center gap-2 transition-colors cursor-default select-none ${fmt.color}`}
          >
            <fmt.icon />
            <span className="text-sm font-semibold tracking-wide">{fmt.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Exported component ───────────────────────────────────────── */

export default function FormatMarquee() {
  return (
    <section className="relative overflow-hidden py-10 sm:py-14">
      {/* Gradient Fade — Left & Right */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 sm:w-32 bg-linear-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 sm:w-32 bg-linear-to-l from-background to-transparent" />

      <p className="text-muted-foreground/60 mb-6 text-center text-[11px] font-semibold tracking-widest uppercase">
        Supports your favorite file formats — upload, search, and chat
      </p>

      {/* Row 1 — scrolls left */}
      <MarqueeRow items={row1} />
      {/* Row 2 — scrolls right (reverse) */}
      <MarqueeRow items={row2} reverse />
    </section>
  );
}
