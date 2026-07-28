export class PerformanceTracker {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();

  /**
   * Obtém resultado em cache se ainda válido
   */
  getCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data as T;
  }

  /**
   * Armazena resultado em cache por um determinado tempo (TTL em segundos)
   */
  setCache(key: string, data: any, ttlSeconds = 300) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Monitora tempo de execução e métricas de telemetria das chamadas MCP
   */
  trackExecution(toolName: string, startTimeMs: number, success: boolean) {
    const durationMs = Date.now() - startTimeMs;
    console.log(`[Telemetry] Tool: ${toolName} | Duração: ${durationMs}ms | Sucesso: ${success}`);
    return durationMs;
  }
}

export const performanceTracker = new PerformanceTracker();
