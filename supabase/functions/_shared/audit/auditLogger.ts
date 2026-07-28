export interface AuditLogEntry {
  organizacaoId?: string;
  userId?: string;
  action: string;
  toolUsed: string;
  status: "success" | "warning" | "failed";
  details?: Record<string, any>;
  ipAddress?: string;
}

export class AuditLogger {
  /**
   * Grava logs de auditoria e segurança em tempo real para ações executadas pelo Jarvis
   */
  async logAction(supabase: any, entry: AuditLogEntry) {
    const logPayload = {
      organizacao_id: entry.organizacaoId || null,
      usuario_id: entry.userId || null,
      acao: entry.action,
      ferramenta_mcp: entry.toolUsed,
      status: entry.status,
      detalhes: entry.details || {},
      created_at: new Date().toISOString(),
    };

    console.log(`[AuditLog] [${entry.status.toUpperCase()}] ${entry.action} (${entry.toolUsed})`, entry.details);

    try {
      await supabase.from("audit_logs").insert(logPayload);
    } catch (e: any) {
      console.warn("[AuditLog] Tabela audit_logs não encontrada, log retido em memória:", e.message);
    }
  }
}

export const auditLogger = new AuditLogger();
