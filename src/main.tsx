import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// @ts-ignore - virtual module provided by vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";
import { checkAndClearCache } from "./lib/cacheManager";

// Garante auto-reload imediato quando um novo Service Worker assume o controle no celular/desktop
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      console.log("[PWA] Controller atualizado. Recarregando página para aplicar a nova versão...");
      window.location.reload();
    }
  });
}

// Verifica versão do build e limpa cache se necessário (garante inicialização no Android/iOS)
checkAndClearCache()
  .catch((err) => console.warn("[PWA Boot] Erro ao verificar cache:", err))
  .finally(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  });

// Listener de atualização do SW com reload automático imediato
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("[PWA] Nova versão detectada. Atualizando imediatamente...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] Pronto para uso offline.");
  },
  onRegisteredSW(swUrl: string, registration?: ServiceWorkerRegistration) {
    if (registration) {
      // Checagem ativa periódica a cada 30 segundos se online
      setInterval(async () => {
        if (!navigator.onLine) return;
        try {
          await registration.update();
        } catch (e) {
          // Checagem silenciosa
        }
      }, 30 * 1000);
    }
  },
});

// Força checagem de nova versão do Service Worker ao carregar a página
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.update().catch((err) => {
        console.warn("[PWA] SW não encontrado no host. Removendo registro desatualizado...", err);
        registration.unregister().catch(() => {});
      });
    }
  }).catch(() => {});
}
