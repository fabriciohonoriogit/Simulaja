import { useSubscription } from "@/hooks/useSubscription";
import { Navigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useRef, useEffect } from "react";

const ALLOWED_WHEN_EXPIRED = ["/admin/assinatura", "/admin/configuracoes"];

export default function TrialGate({ children }: { children: React.ReactNode }) {
  const { loading, isExpired } = useSubscription();
  const location = useLocation();
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      hasLoadedOnceRef.current = true;
    }
  }, [loading]);

  // Timeout de segurança: nunca trava o CRM se o Supabase demorar
  useEffect(() => {
    const timer = setTimeout(() => {
      hasLoadedOnceRef.current = true;
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Exibe o indicador discreto apenas nos primeiros milissegundos se ainda não carregou
  if (loading && !hasLoadedOnceRef.current) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isExpired && !ALLOWED_WHEN_EXPIRED.includes(location.pathname)) {
    return <Navigate to="/admin/assinatura" replace />;
  }

  return <>{children}</>;
}
