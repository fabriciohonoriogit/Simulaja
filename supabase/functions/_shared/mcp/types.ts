/**
 * Jarvis 4.0 - Model Context Protocol (MCP) Tool Specifications
 */

export interface MCPToolParameter {
  type: "STRING" | "NUMBER" | "BOOLEAN" | "OBJECT" | "ARRAY";
  description: string;
  enum?: string[];
  required?: boolean;
}

export interface MCPToolSchema {
  name: string;
  description: string;
  category: "crm" | "whatsapp" | "consorcio_magalu" | "financeiro" | "web" | "system";
  parameters: {
    type: "OBJECT";
    properties: Record<string, MCPToolParameter>;
    required?: string[];
  };
}

export interface MCPExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs?: number;
  metadata?: Record<string, any>;
}

export type MCPToolHandler = (
  supabaseClient: any,
  args: Record<string, any>,
  context: { organizacaoId?: string; userId?: string }
) => Promise<MCPExecutionResult>;

export interface MCPToolDefinition {
  schema: MCPToolSchema;
  handler: MCPToolHandler;
}
