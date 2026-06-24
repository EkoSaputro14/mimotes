import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

// GET — list invoices for current workspace
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = { workspaceId };
    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        lineItems: true,
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        currency: inv.currency,
        subtotal: inv.subtotal,
        tax: inv.tax,
        total: inv.total,
        periodStart: inv.periodStart.toISOString(),
        periodEnd: inv.periodEnd.toISOString(),
        dueDate: inv.dueDate?.toISOString() || null,
        paidAt: inv.paidAt?.toISOString() || null,
        stripeInvoiceId: inv.stripeInvoiceId,
        createdAt: inv.createdAt.toISOString(),
        lineItems: inv.lineItems.map((li) => ({
          id: li.id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          amount: li.amount,
        })),
        payments: inv.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error("List invoices error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
