import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { text: "Mock response" }, error: null })
    }
  }
}));

import {
  findAuthoritativeSimulatorQuote,
  formatConciseBudgetQuote,
  getSimulatorAuthoritativeContext,
  getSystemAuthoritativeContext,
} from "./aiService";

describe("Jarvis OS — Autoridade e Consciência de Dados do Simulador e CRM", () => {
  describe("findAuthoritativeSimulatorQuote", () => {
    it("deve encontrar a cotação oficial exata de R$ 300.000 para imóvel (Grupo 6030)", () => {
      const quote = findAuthoritativeSimulatorQuote("Simule 300 mil para imóvel");
      expect(quote).not.toBeNull();
      expect(quote).toContain("6030");
      expect(quote).toContain("R$ 300.000,00");
      expect(quote).toContain("1.239,29"); // 50/50 com seguro
      expect(quote).toContain("1.146,60"); // 50/50 sem seguro
      expect(quote).toContain("2.024,63"); // Linear com seguro
      expect(quote).toContain("77.6%"); // Média de lances do Grupo 6030
      expect(quote).toContain("25%"); // Lance embutido
    });

    it("deve encontrar a cotação oficial exata de R$ 500.000 para imóvel (Grupo 6042)", () => {
      const quote = findAuthoritativeSimulatorQuote("Qual a parcela de 500 mil no imóvel?");
      expect(quote).not.toBeNull();
      expect(quote).toContain("6042");
      expect(quote).toContain("R$ 500.000,00");
      expect(quote).toContain("1.572,92"); // 50/50 com seguro no 6042
      expect(quote).toContain("1.425,53"); // 50/50 sem seguro no 6042
      expect(quote).toContain("2.636,75"); // Linear com seguro no 6042
      expect(quote).toContain("98.97%"); // Média de lances do Grupo 6042
    });

    it("deve encontrar a cotação oficial exata de R$ 80.000 para veículo", () => {
      const quote = findAuthoritativeSimulatorQuote("Simular consórcio de carro de 80 mil");
      expect(quote).not.toBeNull();
      expect(quote).toContain("R$ 80.000,00");
      expect(quote).toContain("Meia Parcela");
    });

    it("deve encontrar a cotação oficial exata de R$ 25.000 para moto (Grupo 5296)", () => {
      const quote = findAuthoritativeSimulatorQuote("Simular moto de 25 mil");
      expect(quote).not.toBeNull();
      expect(quote).toContain("5296");
      expect(quote).toContain("R$ 25.000,00");
      expect(quote).toContain("244,75"); // 50/50 com seguro
    });

    it("deve encontrar a cotação oficial exata de R$ 200.000 para pesados (Grupo 5996)", () => {
      const quote = findAuthoritativeSimulatorQuote("Simular consórcio de caminhão de 200 mil");
      expect(quote).not.toBeNull();
      expect(quote).toContain("5996");
      expect(quote).toContain("R$ 200.000,00");
      expect(quote).toContain("1.130,27"); // 50/50 com seguro
    });

    it("não deve inventar valores quando o crédito não é tabelado (ex: 330 mil), e sim indicar as cotas mais próximas", () => {
      const quote = findAuthoritativeSimulatorQuote("Simule 330 mil para imóvel");
      expect(quote).not.toBeNull();
      expect(quote).toContain("Não existe cota única de exatamente");
      expect(quote).toContain("Cota Oficial Imediatamente Abaixo");
      expect(quote).toContain("Cota Oficial Imediatamente Acima");
      expect(quote).toContain("320.000,00"); // 6030
      expect(quote).toContain("340.000,00"); // 6035
    });
  });

  describe("formatConciseBudgetQuote — Resposta Concisa e Foco em Parcelas e Prazo", () => {
    it("deve responder APENAS o valor das parcelas e o prazo, sem detalhes do grupo ou taxas de administração", () => {
      const quote = formatConciseBudgetQuote("quanto fica 500 mil de imóvel");
      expect(quote).not.toBeNull();
      // Deve conter o valor do crédito, parcelas e prazo
      expect(quote).toContain("500.000,00");
      expect(quote).toContain("235 meses");
      expect(quote).toContain("Meia Parcela (50/50)");
      expect(quote).toContain("Parcela Integral");

      // NÃO deve conter detalhes burocráticos de grupo ou taxas
      expect(quote).not.toContain("Taxa de ADM");
      expect(quote).not.toContain("Fundo de Reserva");
      expect(quote).not.toContain("Média Histórica");
      expect(quote).not.toContain("Lance Embutido Permitido");
      expect(quote).not.toContain("Grupo 6042");
    });

    it("deve responder orçamento conciso para automóvel", () => {
      const quote = formatConciseBudgetQuote("orçamento de 80 mil para carro");
      expect(quote).not.toBeNull();
      expect(quote).toContain("80.000,00");
      expect(quote).toContain("Meia Parcela (50/50)");
      expect(quote).toContain("Parcela Integral");
      expect(quote).not.toContain("Taxa de ADM");
      expect(quote).not.toContain("Grupo 5297");
    });
  });

  describe("getSystemAuthoritativeContext — Consciência do CRM e Vendas", () => {
    it("deve conter estritamente as vendas de Outubro (R$ 20k da Elizabeth) e Doroty como mês passado da Loja Paranaguá", () => {
      const context = getSystemAuthoritativeContext();
      expect(context).toContain("Total de Vendas Realizadas no Mês Atual (Outubro/2026): R$ 20.000,00");
      expect(context).toContain("Elizabeth: R$ 20.000,00");
      expect(context).toContain("10 parcelas mensais de R$ 80,00");
      expect(context).toContain("Doroty foi venda do MÊS PASSADO");
      expect(context).toContain("Loja Paranaguá");
    });

    it("deve atestar com clareza absoluta que a Loja Paranaguá tem R$ 0,00 em vendas e 0.0% de conversão", () => {
      const context = getSystemAuthoritativeContext();
      expect(context).toContain("Performance da Loja Paranaguá no Mês de Outubro/2026:");
      expect(context).toContain("Vendas Realizadas em Outubro: R$ 0,00");
      expect(context).toContain("Taxa de Conversão da Loja em Outubro: 0.0%");
      expect(context).toContain("A Loja Paranaguá NÃO possui participação");
    });

    it("deve conter a matriz completa do simulador para Imóvel, Veículo, Pesados e Serviços", () => {
      const context = getSystemAuthoritativeContext();
      expect(context).toContain("=== TABELA OFICIAL DE IMÓVEIS ===");
      expect(context).toContain("=== TABELA OFICIAL DE VEÍCULOS / AUTOMÓVEIS E MOTOS ===");
      expect(context).toContain("=== TABELA OFICIAL DE PESADOS / CAMINHÕES / AGRÍCOLA ===");
      expect(context).toContain("=== TABELA OFICIAL DE SERVIÇOS E ELETRO ===");
      expect(context).toContain("6044");
      expect(context).toContain("6043");
      expect(context).toContain("6042");
      expect(context).toContain("5296");
      expect(context).toContain("5297");
      expect(context).toContain("5996");
      expect(context).toContain("4150");
      expect(context).toContain("7120");
    });
  });
});
