import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SubscriptionInfo {
  loading: boolean;
  orgId: string | null;
  orgNome: string | null;
  status: "trialing" | "active" | "expired" | "canceled" | null;
  trialEndsAt: Date | null;
  daysLeft: number;
  isExpired: boolean;
  isTrialing: boolean;
  isActive: boolean;
  plano: string | null;
  hasJarvis: boolean;
}

export const useSubscription = (): SubscriptionInfo => {
  const { user } = useAuth();
  const [data, setData] = useState<SubscriptionInfo>({
    loading: true,
    orgId: null,
    orgNome: null,
    status: null,
    trialEndsAt: null,
    daysLeft: 0,
    isExpired: false,
    isTrialing: false,
    isActive: false,
    plano: null,
    hasJarvis: false,
  });

  useEffect(() => {
    if (!user) {
      setData((d) => ({ ...d, loading: false }));
      return;
    }
    (async () => {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("organizacao_id")
        .eq("id", user.id)
        .single();

      if (!perfil?.organizacao_id) {
        setData((d) => ({ ...d, loading: false }));
        return;
      }

      const { data: org } = await (supabase
        .from("organizacoes") as any)
        .select("id, nome, subscription_status, trial_ends_at, plano")
        .eq("id", perfil.organizacao_id)
        .single();

      if (!org) {
        setData((d) => ({ ...d, loading: false }));
        return;
      }

      const trialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
      const now = new Date();
      const msLeft = trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 86400000 * 30;
      const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      const status = org.subscription_status as SubscriptionInfo["status"];
      const isActive = status === "active";
      const isTrialing = status === "trialing" || !status || msLeft > 0;
      const isExpired = status === "expired" || status === "canceled";
      
      const plano = org.plano || "Pro";
      // Jarvis é liberado para acesso completo no CRM
      const hasJarvis = !isExpired && (isTrialing || isActive || plano !== 'Starter');

      setData({
        loading: false,
        orgId: org.id,
        orgNome: org.nome,
        status: status || "active",
        trialEndsAt,
        daysLeft,
        isExpired,
        isTrialing,
        isActive: isActive || !isExpired,
        plano,
        hasJarvis: true,
      });
    })();
  }, [user]);

  return data;
};
