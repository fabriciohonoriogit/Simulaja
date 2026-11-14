import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import { Refine } from "@refinedev/core";
import { refineDataProvider, refineResources } from "./lib/refineConfig";
import { LevelUpModal } from "./components/admin/gamification/LevelUpModal";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy loading das rotas secundárias e administrativas para carregar a Landing Page instantaneamente
const LandingV2 = lazy(() => import("./pages/LandingV2"));
const Simulador = lazy(() => import("./pages/Simulador"));
const Indicacoes = lazy(() => import("./pages/Indicacoes"));
const PreCadastro = lazy(() => import("./pages/PreCadastro"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/admin/Login"));
const Register = lazy(() => import("./pages/admin/Register"));
const ResetPassword = lazy(() => import("./pages/admin/ResetPassword"));
const Onboarding = lazy(() => import("./pages/admin/Onboarding"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Funil = lazy(() => import("./pages/admin/Funil"));
const SimuladorAdmin = lazy(() => import("./pages/admin/SimuladorAdmin"));
const Agendamentos = lazy(() => import("./pages/admin/Agendamentos"));
const Leads = lazy(() => import("./pages/admin/Leads"));
const Metas = lazy(() => import("./pages/admin/Metas"));
const Jarvis = lazy(() => import("./pages/admin/Jarvis"));
const JarvisHUDPage = lazy(() => import("./pages/admin/JarvisHUDPage"));
const JarvisStudio = lazy(() => import("./pages/admin/JarvisStudio"));
const JarvisSquadPage = lazy(() => import("./pages/admin/JarvisSquadPage"));
const Carteira = lazy(() => import("./pages/admin/Carteira"));
const Inadimplentes = lazy(() => import("./pages/admin/Inadimplentes"));
const Comissoes = lazy(() => import("./pages/admin/Comissoes"));
const Assinatura = lazy(() => import("./pages/admin/Assinatura"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Chat = lazy(() => import("./pages/admin/Chat"));
const WhatsAppInbox = lazy(() => import("./pages/admin/WhatsAppInbox"));
const CartaAnalise = lazy(() => import("./pages/admin/CartaAnalise"));
const CentralFormularios = lazy(() => import("./pages/admin/CentralFormularios"));
const AIChatbot = lazy(() => import("./components/AIChatbot"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]">
    <div className="w-8 h-8 border-3 border-[#0086FF] border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isIndicacoes = location.pathname.startsWith("/indicacoes") || location.pathname.startsWith("/parceiro");
  const isPreCadastro = location.pathname.startsWith("/pre-cadastro");
  const isLandingPage = location.pathname === "/" || location.pathname === "/home";

  return (
    <>
      <Toaster />
      <Sonner />
      <LevelUpModal />
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
      {!isAdmin && !isPreCadastro && !isLandingPage && (
        <Suspense fallback={null}>
          <AIChatbot />
        </Suspense>
      )}
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Refine dataProvider={refineDataProvider} resources={refineResources}>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </Refine>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;