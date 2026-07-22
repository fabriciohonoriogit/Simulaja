import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSimuladorStore } from "@/stores/simuladorStore";
import { GRUPOS, CATEGORIAS } from "@/constants/simulador";
import { useEffect } from "react";

export function useSimulador() {
  const setValoresTabela = useSimuladorStore((state) => state.setValoresTabela);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tabelas_simulador"],
    queryFn: async () => {
      return { categorias: CATEGORIAS, grupos: GRUPOS };
    },
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (data) {
      setValoresTabela(data.categorias, data.grupos);
    }
  }, [data, setValoresTabela]);

  return {
    categorias: CATEGORIAS,
    grupos: GRUPOS,
    isLoading: false,
    error: null,
  };
}
