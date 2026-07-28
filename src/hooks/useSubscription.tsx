import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SubscriptionInfo {
  loading: boolean;
  orgId?: string;
  orgNome?: string;
  status?: "trialing" | "active" | "canceled" | "past_due" | "expired";
  trialEndsAt?: Date | null;
  daysLeft?: number;
  isExpired: boolean;
  isTrialing: boolean;
  isActive: boolean;
  plano?: string | null;
  hasJarvis: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [data, setData] = useState<SubscriptionInfo>({
    loading: true,
    status: "active",
    trialEndsAt: null,
    daysLeft: 30,
    isExpired: false,
    isTrialing: true,
    isActive: true,
    plano: "Pro",
    hasJarvis: true,
  });

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setData((d) => ({ ...d, loading: false }));
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("organizacao_id")
          .eq("id", userId)
          .single();

        if (!perfil?.organizacao_id) {
          if (isMounted) setData((d) => ({ ...d, loading: false }));
          return;
        }

        const { data: org } = await (supabase
          .from("organizacoes") as any)
          .select("id, nome, subscription_status, trial_ends_at, plano")
          .eq("id", perfil.organizacao_id)
          .single();

        if (!org) {
          if (isMounted) setData((d) => ({ ...d, loading: false }));
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

        if (isMounted) {
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
        }
      } catch (e) {
        if (isMounted) setData((d) => ({ ...d, loading: false }));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return data;
}
