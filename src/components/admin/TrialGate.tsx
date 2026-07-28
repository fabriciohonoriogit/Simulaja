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

  // Exibe o indicador apenas na montagem inicial absoluta da sessão, evitando desmontar a tela em atualizações de token
  if (loading && !hasLoadedOnceRef.current) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isExpired && !ALLOWED_WHEN_EXPIRED.includes(location.pathname)) {
    return <Navigate to="/admin/assinatura" replace />;
  }

  return <>{children}</>;
}
