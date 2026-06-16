/**
 * Lead Intent Detection and Scoring for MimoNotes Widget
 */

// Intent keywords (Indonesian + English)
const INTENT_KEYWORDS: Record<string, string[]> = {
  harga: ["harga", "berapa", "biaya", "tarif", "cost", "price", "pricing", "bayar"],
  beli: ["beli", "order", "pesan", "purchase", "buy", "checkout"],
  booking: ["booking", "reservasi", "janji", "appointment", "schedule"],
  demo: ["demo", "presentasi", "showcase", "trial", "free trial"],
  hubungi: ["hubungi", "kontak", "telepon", "wa", "whatsapp", "contact", "call"],
};

export type IntentType = "harga" | "beli" | "booking" | "demo" | "hubungi" | null;
export type LeadScore = "low" | "medium" | "high";
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

/**
 * Detect intent from message text.
 */
export function detectIntent(message: string): IntentType {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return intent as IntentType;
    }
  }
  return null;
}

/**
 * Calculate lead score based on intent and lead data.
 */
export function calculateLeadScore(
  hasLead: boolean,
  intent: IntentType,
  messageCount: number
): LeadScore {
  // High: intent detected AND lead provided
  if (intent && hasLead) return "high";
  // Medium: intent detected OR lead provided
  if (intent || hasLead) return "medium";
  // Low: no intent, no lead
  return "low";
}

/**
 * Determine if auto-trigger should fire.
 */
export function shouldAutoTrigger(
  leadCaptureEnabled: boolean,
  autoTriggerMessages: number,
  hasLead: boolean,
  messageCount: number
): boolean {
  if (!leadCaptureEnabled) return false;
  if (hasLead) return false; // Already captured
  if (autoTriggerMessages <= 0) return false; // Disabled
  return messageCount >= autoTriggerMessages;
}

/**
 * Generate auto-trigger prompt message.
 */
export function getAutoTriggerPrompt(): string {
  return "Sebelum melanjutkan, boleh saya tahu nama dan email Anda? Ini membantu kami memberikan layanan yang lebih baik.";
}
