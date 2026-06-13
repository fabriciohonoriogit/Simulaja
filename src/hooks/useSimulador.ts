import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSimuladorStore } from "@/stores/simuladorStore";
import { GRUPOS, CATEGORIAS } from "@/components/ConsortiumSimulator";
import { useEffect } from "react";

export function useSimulador() {
  const setValoresTabela = useSimuladorStore((state) => state.setValoresTabela);

  // Exemplo de como seria a busca real das tabelas 'imoveis_simulador', 'carros_simulador', etc.
  // Como não temos certeza da estrutura exata no Supabase ainda, estamos utilizando
  // a estrutura pronta (GRUPOS/CATEGORIAS) como fallback caso a tabela não retorne dados válidos.
  const { data, isLoading, error } = useQuery({
    queryKey: ["tabelas_simulador"],
    queryFn: async () => {
      try {
        // Exemplo: buscar de uma view ou tabela unificada
        // const { data: imoveis, error: errImoveis } = await supabase.from('imoveis_simulador').select('*');
        // const { data: veiculos, error: errVeiculos } = await supabase.from('carros_simulador').select('*');
        // se tivermos os dados, podemos formatá-los aqui e retornar.
        
        // Simulação de retorno assíncrono para fins de cache do React Query
        return { categorias: CATEGORIAS, grupos: GRUPOS };
      } catch (err) {
        console.error("Erro ao buscar tabelas do simulador:", err);
        return { categorias: CATEGORIAS, grupos: GRUPOS }; // fallback seguro
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas (invalida apenas manualmente ou após 1 dia)
  });

  useEffect(() => {
    if (data) {
      setValoresTabela(data.categorias, data.grupos);
    }
  }, [data, setValoresTabela]);

  return {
    categorias: data?.categorias || CATEGORIAS,
    grupos: data?.grupos || GRUPOS,
    isLoading,
    error,
  };
}
