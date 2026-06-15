// ============================================================
// Operations Status API
// ============================================================
// GET /api/operations/status
// Returns operational dashboard data: health, email provider status,
// invitation statistics, and system info.
// Requires API auth.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, apiErrorResponse } from "@/lib/api-auth";
import { validateEmailConfig, loadEmailConfig } from "@/lib/email";
import { auditConfiguration } from "@/lib/startup";

/**
 * GET /api/operations/status
 *
 * Returns:
 * - health: system health status
 * - email: email provider status
 * - invitations: invitation statistics
 * - config: configuration audit summary
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request);

    // ── Health check (lightweight) ──
    let dbHealthy = false;
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    // ── Email provider status ──
    const emailConfig = loadEmailConfig();
    const emailValidation = validateEmailConfig();

    // ── Invitation statistics ──
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalInvitations,
      pendingInvitations,
      acceptedInvitations,
      expiredInvitations,
      recentInvitations,
      emailLogs,
    ] = await Promise.all([
      prisma.workspaceInvitation.count({
        where: { workspaceId: auth.workspaceId },
      }),
      prisma.workspaceInvitation.count({
        where: { workspaceId: auth.workspaceId, status: "pending" },
      }),
      prisma.workspaceInvitation.count({
        where: { workspaceId: auth.workspaceId, status: "accepted" },
      }),
      prisma.workspaceInvitation.count({
        where: { workspaceId: auth.workspaceId, status: "expired" },
      }),
      prisma.workspaceInvitation.count({
        where: {
          workspaceId: auth.workspaceId,
          createdAt: { gte: since7d },
        },
      }),
      prisma.auditLog.count({
        where: {
          workspaceId: auth.workspaceId,
          resourceType: "email",
          createdAt: { gte: since30d },
        },
      }),
    ]);

    // ── Configuration audit ──
    const configAudit = auditConfiguration();
    const configSummary = {
      total: configAudit.length,
      configured: configAudit.filter((e) => e.configured).length,
      secure: configAudit.filter((e) => e.secure).length,
      missing: configAudit.filter((e) => !e.configured).map((e) => e.key),
    };

    // ── Member count ──
    const memberCount = await prisma.workspaceMember.count({
      where: { workspaceId: auth.workspaceId },
    });

    return Response.json({
      timestamp: new Date().toISOString(),
      health: {
        status: dbHealthy ? "healthy" : "degraded",
        database: {
          connected: dbHealthy,
          latencyMs: dbLatencyMs,
        },
        uptime: process.uptime(),
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      email: {
        provider: emailConfig.provider,
        configured: emailValidation.valid,
        issues: emailValidation.issues,
      },
      invitations: {
        total: totalInvitations,
        pending: pendingInvitations,
        accepted: acceptedInvitations,
        expired: expiredInvitations,
        recent7d: recentInvitations,
        emailsSent30d: emailLogs,
      },
      workspace: {
        memberCount,
      },
      config: configSummary,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
