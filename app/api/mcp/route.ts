import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { resolveWorkspaceId } from "@/lib/prisma";
import { createMimotesMCPServer } from "@/lib/mcp/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = await resolveWorkspaceId(session.user.id! as string);
  await requireFeature(workspaceId, "mcp");
  const server = createMimotesMCPServer(session.user.id! as string);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  return response;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = await resolveWorkspaceId(session.user.id! as string);
  await requireFeature(workspaceId, "mcp");
  const server = createMimotesMCPServer(session.user.id! as string);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  return response;
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = await resolveWorkspaceId(session.user.id! as string);
  await requireFeature(workspaceId, "mcp");
  const server = createMimotesMCPServer(session.user.id! as string);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  return response;
}
