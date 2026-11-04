/**
 * cacheManager.ts
 * Detecta nova versão do build e limpa todos os caches do SW,
 * forçando hard reload em todos os dispositivos (Android, iOS, Desktop).
 */

const BUILD_VERSION = __APP_VERSION__;
const VERSION_KEY = "app_build_version";

export async function checkAndClearCache(): Promise<void> {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(VERSION_KEY) : null;

    // Primeira vez ou versão diferente → limpa tudo e recarrega
    if (stored !== BUILD_VERSION) {
      console.log(`[CacheManager] Nova versão detectada: ${stored} → ${BUILD_VERSION}. Limpando cache...`);

      // 1. Apaga todos os caches do Service Worker
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
          console.log(`[CacheManager] ${keys.length} cache(s) removidos.`);
        } catch (err) {
          console.warn("[CacheManager] Erro ao limpar caches:", err);
        }
      }

      // 2. Desregistra SW antigos
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
          console.log(`[CacheManager] ${registrations.length} SW(s) desregistrados.`);
        } catch (err) {
          console.warn("[CacheManager] Erro ao desregistrar SW:", err);
        }
      }

      // 3. Salva a nova versão
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(VERSION_KEY, BUILD_VERSION);
        }
      } catch (err) {
        console.warn("[CacheManager] Erro ao salvar versão no localStorage:", err);
      }

      // 4. Se havia uma versão anterior, recarrega para garantir que os novos bundles sejam carregados
      if (stored && typeof window !== "undefined") {
        console.log("[CacheManager] Versão atualizada, forçando recarga imediata...");
        window.location.reload();
      }
    }
  } catch (err) {
    console.warn("[CacheManager] Erro geral ao verificar cache:", err);
  }
}
