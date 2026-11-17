import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// @ts-ignore - virtual module provided by vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";
import { checkAndClearCache } from "./lib/cacheManager";

// Renderização imediata e direta do React App
createRoot(document.getElementById("root")!).render(<App />);

// Limpeza de cache em segundo plano sem bloquear a inicialização
checkAndClearCache().catch((err) => console.warn("[PWA Boot] Erro ao verificar cache:", err));

// Service Worker registrado sem forçar reload de janela
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("[PWA] Nova versão detectada. Atualizando imediatamente...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] Pronto para uso offline.");
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
