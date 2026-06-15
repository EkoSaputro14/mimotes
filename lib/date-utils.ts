/**
 * Deterministic date/time formatting utilities.
 *
 * These use getHours/getMinutes/getDate/getMonth/getFullYear instead of
 * toLocaleDateString/toLocaleTimeString to produce identical output on
 * server (Node.js) and client (browser), preventing React #418 hydration
 * mismatches caused by locale differences between runtimes.
 */

const SHORT_MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SHORT_MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

/**
 * Format a date string as "11 Jun 2026" (en) or "11 Jun 2026" (id).
 * Deterministic — same output on server and client.
 */
export function formatDateSafe(
  dateStr: string | Date,
  locale: "en" | "id" = "en"
): string {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return "";
    const months = locale === "id" ? SHORT_MONTHS_ID : SHORT_MONTHS_EN;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return "";
  }
}

/**
 * Format a date string as "HH.MM" (24-hour, zero-padded).
 * Deterministic — same output on server and client.
 */
export function formatTimeSafe(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return "";
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}.${m}`;
  } catch {
    return "";
  }
}

/**
 * Format a date string as "11 Jun 2026 08.50" (full date+time).
 * Deterministic — same output on server and client.
 */
export function formatDateTimeSafe(
  dateStr: string | Date,
  locale: "en" | "id" = "en"
): string {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return "";
    return `${formatDateSafe(d, locale)} ${formatTimeSafe(d)}`;
  } catch {
    return "";
  }
}

/**
 * Format a date as short weekday "Mon", "Tue", etc.
 * Deterministic — same output on server and client.
 */
export function formatWeekdayShort(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return "";
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[d.getDay()];
  } catch {
    return "";
  }
}
