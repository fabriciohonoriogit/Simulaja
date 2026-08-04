import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// @ts-ignore - virtual module provided by vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";
import { checkAndClearCache } from "./lib/cacheManager";

// Verifica versão do build e limpa cache se necessário (resolve Android/iOS travado)
checkAndClearCache().then(() => {
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

// Força checagem de nova versão do Service Worker ao carregar a página
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.update();
    }
  });
}

