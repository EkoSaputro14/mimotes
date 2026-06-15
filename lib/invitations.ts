import { randomBytes, createHash, timingSafeEqual } from "crypto";

export const INVITATION_EXPIRY_DAYS = 7;

export interface InvitationToken {
  rawToken: string;
  tokenHash: string;
  tokenPrefix: string;
}

export function generateInvitationToken(): InvitationToken {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const tokenPrefix = rawToken.substring(0, 8);

  return { rawToken, tokenHash, tokenPrefix };
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function verifyInvitationToken(
  rawToken: string,
  storedHash: string
): boolean {
  const computedHash = hashToken(rawToken);
  const rawBuffer = Buffer.from(computedHash, "utf-8");
  const storedBuffer = Buffer.from(storedHash, "utf-8");

  if (rawBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(rawBuffer, storedBuffer);
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function getExpiresAt(days: number = INVITATION_EXPIRY_DAYS): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}
