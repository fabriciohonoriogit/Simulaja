import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// @ts-ignore - virtual module provided by vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";
import { checkAndClearCache } from "./lib/cacheManager";

// Verifica versão do build e limpa cache se necessário (garante inicialização no Android/iOS)
checkAndClearCache()
  .catch((err) => console.warn("[PWA Boot] Erro ao verificar cache:", err))
  .finally(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  });

// Listener de atualização do SW com reload automático
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("[PWA] Nova versão detectada. Atualizando...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] Pronto para uso offline.");
  },
});

// Força checagem de nova versão do Service Worker ao carregar a página (com tratamento silencioso de erros)
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

