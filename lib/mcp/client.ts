import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { MCPToolInfo, MCPServerConfig } from "./types";

export interface MCPClientConnection {
  client: Client;
  config: MCPServerConfig;
  tools: MCPToolInfo[];
  connected: boolean;
}

export class MimotesMCPClient {
  private connections: Map<string, MCPClientConnection> = new Map();

  async connect(config: MCPServerConfig): Promise<MCPClientConnection> {
    if (this.connections.has(config.id)) {
      const existing = this.connections.get(config.id)!;
      if (existing.connected) {
        return existing;
      }
    }

    const client = new Client({
      name: "mimotes-client",
      version: "1.0.0",
    });

    const url = new URL(config.url);

    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const transport = new SSEClientTransport(url, {
      requestInit: { headers },
    });

    await client.connect(transport);

    const toolsResult = await client.listTools();
    const tools: MCPToolInfo[] = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || "",
      inputSchema: tool.inputSchema as Record<string, unknown>,
    }));

    const connection: MCPClientConnection = {
      client,
      config,
      tools,
      connected: true,
    };

    this.connections.set(config.id, connection);
    return connection;
  }

  async disconnect(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (connection) {
      await connection.client.close();
      connection.connected = false;
      this.connections.delete(serverId);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [id] of this.connections) {
      await this.disconnect(id);
    }
  }

  getConnection(serverId: string): MCPClientConnection | undefined {
    return this.connections.get(serverId);
  }

  getAllConnections(): MCPClientConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectedServers(): MCPClientConnection[] {
    return this.getAllConnections().filter((c) => c.connected);
  }

  getAllTools(): Array<MCPToolInfo & { serverId: string; serverName: string }> {
    const tools: Array<MCPToolInfo & { serverId: string; serverName: string }> = [];

    for (const connection of this.connections.values()) {
      if (connection.connected) {
        for (const tool of connection.tools) {
          tools.push({
            ...tool,
            serverId: connection.config.id,
            serverName: connection.config.name,
          });
        }
      }
    }

    return tools;
  }

  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    const connection = this.connections.get(serverId);
    if (!connection || !connection.connected) {
      throw new Error(`Server ${serverId} is not connected`);
    }

    const result = await connection.client.callTool({
      name: toolName,
      arguments: args,
    });

    return {
      content: result.content as Array<{ type: string; text: string }>,
      isError: result.isError as boolean,
    };
  }

  async callToolByName(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean; serverName: string }> {
    for (const connection of this.connections.values()) {
      if (connection.connected) {
        const hasTool = connection.tools.some((t) => t.name === toolName);
        if (hasTool) {
          const result = await this.callTool(connection.config.id, toolName, args);
          return { ...result, serverName: connection.config.name };
        }
      }
    }

    throw new Error(`Tool "${toolName}" not found in any connected MCP server`);
  }
}

let globalClient: MimotesMCPClient | null = null;

export function getMCPClient(): MimotesMCPClient {
  if (!globalClient) {
    globalClient = new MimotesMCPClient();
  }
  return globalClient;
}
