import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type MCPToolResult = CallToolResult;

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  isActive: boolean;
  tools?: MCPToolInfo[];
}

export interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPResourceInfo {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPromptInfo {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export type MCPTransportType = "stdio" | "streamable-http" | "sse";
