import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LandingV2 from "./pages/LandingV2";
import Simulador from "./pages/Simulador";
import Indicacoes from "./pages/Indicacoes";
import NotFound from "./pages/NotFound";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Funil from "./pages/admin/Funil";
import Leads from "./pages/admin/Leads";
import Metas from "./pages/admin/Metas";
import Carteira from "./pages/admin/Carteira";
import Inadimplentes from "./pages/admin/Inadimplentes";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import SimuladorAdmin from "./pages/admin/SimuladorAdmin";
import Agendamentos from "./pages/admin/Agendamentos";
import Jarvis from "./pages/admin/Jarvis";
import JarvisHUDPage from "./pages/admin/JarvisHUDPage";
import JarvisStudio from "./pages/admin/JarvisStudio";
import JarvisSquadPage from "./pages/admin/JarvisSquadPage";
import Settings from "./pages/admin/Settings";
import Register from "./pages/admin/Register";
import ResetPassword from "./pages/admin/ResetPassword";
import Chat from "./pages/admin/Chat";
import { lazy } from "react";
import CartaAnalise from "./pages/admin/CartaAnalise";
const CentralFormularios = lazy(() => import("./pages/admin/CentralFormularios"));
import Comissoes from "./pages/admin/Comissoes";
import Assinatura from "./pages/admin/Assinatura";
import Onboarding from "./pages/admin/Onboarding";
import AIChatbot from "./components/AIChatbot";
import { useLocation } from "react-router-dom";

import WhatsAppInbox from "./pages/admin/WhatsAppInbox";
import { Refine } from "@refinedev/core";
import { refineDataProvider, refineResources } from "./lib/refineConfig";
import { LevelUpModal } from "./components/admin/gamification/LevelUpModal";

import PreCadastro from "./pages/PreCadastro";

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isIndicacoes = location.pathname.startsWith("/indicacoes") || location.pathname.startsWith("/parceiro");
  const isPreCadastro = location.pathname.startsWith("/pre-cadastro");

  return (
    <>
      <Toaster />
      <Sonner />
      <LevelUpModal />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<LandingV2 />} />
        <Route path="/simulador" element={<Simulador />} />
        <Route path="/parceiro" element={<Simulador />} />
        <Route path="/indicacoes" element={<Indicacoes />} />
        <Route path="/pre-cadastro" element={<PreCadastro />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/register" element={<Register />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/admin/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="funil" element={<Funil />} />
          <Route path="simulador" element={<SimuladorAdmin />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="leads" element={<Leads />} />
          <Route path="metas" element={<Metas />} />
          <Route path="jarvis" element={<Jarvis />} />
          <Route path="jarvis-hud" element={<JarvisHUDPage />} />
          <Route path="jarvis-studio" element={<JarvisStudio />} />
          <Route path="squad" element={<JarvisSquadPage />} />
          <Route path="jarvis-squad" element={<JarvisSquadPage />} />
          <Route path="carteira" element={<Carteira />} />
          <Route path="inadimplentes" element={<Inadimplentes />} />
          <Route path="comissoes" element={<Comissoes />} />
          <Route path="assinatura" element={<Assinatura />} />
          <Route path="configuracoes" element={<Settings />} />
          <Route path="chat" element={<Chat />} />
          <Route path="whatsapp-inbox" element={<WhatsAppInbox />} />
          <Route path="carta-analise" element={<CartaAnalise />} />
          <Route path="analise-credito" element={<CartaAnalise />} />
          <Route path="formularios" element={<CentralFormularios />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdmin && !isPreCadastro && <AIChatbot />}
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Refine dataProvider={refineDataProvider} resources={refineResources}>
          <AppContent />
        </Refine>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
