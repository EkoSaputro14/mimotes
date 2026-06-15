import { prisma } from "@/lib/prisma";
import { getMCPClient } from "./client";
import type { MCPServerConfig, MCPToolInfo } from "./types";

export interface MCPServerStatus {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  connected: boolean;
  tools: MCPToolInfo[];
  error?: string;
}

export class MCPManager {
  private static instance: MCPManager | null = null;

  static getInstance(): MCPManager {
    if (!MCPManager.instance) {
      MCPManager.instance = new MCPManager();
    }
    return MCPManager.instance;
  }

  async getActiveServers(): Promise<MCPServerConfig[]> {
    try {
      const servers = await prisma.mcpServer.findMany({
        where: { isActive: true },
      });

      return servers.map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        apiKey: s.apiKey || undefined,
        isActive: s.isActive,
        tools: (s.tools as unknown as MCPToolInfo[]) || [],
      }));
    } catch {
      return [];
    }
  }

  async connectAll(): Promise<MCPServerStatus[]> {
    const servers = await this.getActiveServers();
    const client = getMCPClient();
    const statuses: MCPServerStatus[] = [];

    for (const server of servers) {
      try {
        const connection = await client.connect(server);
        statuses.push({
          id: server.id,
          name: server.name,
          url: server.url,
          isActive: server.isActive,
          connected: true,
          tools: connection.tools,
        });

        await prisma.mcpServer.update({
          where: { id: server.id },
          data: { tools: JSON.parse(JSON.stringify(connection.tools)) },
        });
      } catch (error) {
        statuses.push({
          id: server.id,
          name: server.name,
          url: server.url,
          isActive: server.isActive,
          connected: false,
          tools: [],
          error: error instanceof Error ? error.message : "Connection failed",
        });
      }
    }

    return statuses;
  }

  async connectServer(serverId: string): Promise<MCPServerStatus> {
    const server = await prisma.mcpServer.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const config: MCPServerConfig = {
      id: server.id,
      name: server.name,
      url: server.url,
      apiKey: server.apiKey || undefined,
      isActive: server.isActive,
    };

    const client = getMCPClient();

    try {
      const connection = await client.connect(config);

      await prisma.mcpServer.update({
        where: { id: serverId },
        data: { tools: JSON.parse(JSON.stringify(connection.tools)) },
      });

      return {
        id: server.id,
        name: server.name,
        url: server.url,
        isActive: server.isActive,
        connected: true,
        tools: connection.tools,
      };
    } catch (error) {
      return {
        id: server.id,
        name: server.name,
        url: server.url,
        isActive: server.isActive,
        connected: false,
        tools: [],
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  async disconnectServer(serverId: string): Promise<void> {
    const client = getMCPClient();
    await client.disconnect(serverId);
  }

  async disconnectAll(): Promise<void> {
    const client = getMCPClient();
    await client.disconnectAll();
  }

  async getStatus(): Promise<MCPServerStatus[]> {
    const servers = await this.getActiveServers();
    const client = getMCPClient();
    const statuses: MCPServerStatus[] = [];

    for (const server of servers) {
      const connection = client.getConnection(server.id);
      statuses.push({
        id: server.id,
        name: server.name,
        url: server.url,
        isActive: server.isActive,
        connected: connection?.connected || false,
        tools: connection?.tools || server.tools || [],
      });
    }

    return statuses;
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean; serverName: string }> {
    const client = getMCPClient();
    return client.callToolByName(toolName, args);
  }

  getAllTools(): Array<MCPToolInfo & { serverId: string; serverName: string }> {
    const client = getMCPClient();
    return client.getAllTools();
  }
}

export function getMCPManager(): MCPManager {
  return MCPManager.getInstance();
}
