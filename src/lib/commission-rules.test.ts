import { describe, it, expect } from "vitest";
import { calcularComissaoRecorrenteLead } from "./gamificationUtils";
import { matchLeadToLoja } from "./lojasService";
import { LojaConfig } from "@/constants/lojas";

const MOCK_LOJAS: LojaConfig[] = [
  {
    id: "filial-952",
    codigo: "952",
    cidade: "PARANAGUÁ",
    nome: "PARANAGUÁ - MAGALU FILIAL 952",
    metaMensal: 108464,
    corHex: "#3b82f6"
  },
  {
    id: "filial-927",
    codigo: "927",
    cidade: "SÃO MATEUS DO SUL",
    nome: "SÃO MATEUS DO SUL - MAGALU FILIAL 927",
    metaMensal: 103502,
    corHex: "#10b981"
  }
];

describe("Regras de Comissionamento e Vendas de Gestor vs Loja", () => {
  describe("Comissão de Filial Magalu (0.80%)", () => {
    it("deve calcular 0.80% de comissão para regra INDICACAO_MAGALU em qualquer segmento", () => {
      const leadImovel = {
        valor_credito: 500000,
        tipo_consorcio: "imovel",
        comissao_regra: "INDICACAO_MAGALU",
        administradora: "MAGALU"
      };

      const leadVeiculo = {
        valor_credito: 100000,
        tipo_consorcio: "veiculo",
        comissao_regra: "INDICACAO_MAGALU",
        administradora: "ADEMICON" // Administradora diferente não altera a taxa de 0.80%
      };

      // 500.000 * 0.80% = 4.000 / 4 parcelas = 1.000 recorrente
      const comissaoImovelRecorrente = calcularComissaoRecorrenteLead(leadImovel);
      expect(comissaoImovelRecorrente).toBe(1000);

      // 100.000 * 0.80% = 800 / 4 parcelas = 200 recorrente
      const comissaoVeiculoRecorrente = calcularComissaoRecorrenteLead(leadVeiculo);
      expect(comissaoVeiculoRecorrente).toBe(200);
    });

    it("deve calcular a comissão de 0.80% para a venda do cliente Valdinei (40mil em São Mateus do Sul)", () => {
      const leadValdinei40k = {
        nome: "Valdinei",
        valor_credito: 40000,
        cidade: "São Mateus do Sul",
        administradora: "MAGALU"
      };

      // 40.000 * 0.80% = 320 / 4 parcelas = 80 recorrente
      const comissaoValdinei = calcularComissaoRecorrenteLead(leadValdinei40k);
      expect(comissaoValdinei).toBe(80);

      // Venda de 200 mil (padrão 4% em 10x) -> 200.000 * 4% / 10 = 800 recorrente
      const lead200k = { valor_credito: 200000 };
      const comissao200k = calcularComissaoRecorrenteLead(lead200k);
      expect(comissao200k).toBe(800);

      // Comissão recorrente total no Dashboard = 800 + 80 = R$ 880,00/mês
      expect(comissao200k + comissaoValdinei).toBe(880);
    });
  });

  describe("Atribuição de Vendas de Gestor vs Loja", () => {
    it("deve excluir a venda de 200mil das metas da loja e manter como venda do gestor", () => {
      const lead200kGestor = {
        nome: "Cliente Gestor 200k",
        valor_credito: 200000,
        cidade: "PARANAGUÁ",
        origem: "venda_gestor"
      };

      const lead200k = {
        nome: "Outro Cliente 200k",
        valor_credito: 200000,
        cidade: "PARANAGUÁ"
      };

      expect(matchLeadToLoja(lead200kGestor, MOCK_LOJAS)).toBeNull(); // Não entra para a loja
      expect(matchLeadToLoja(lead200k, MOCK_LOJAS)).toBeNull(); // Não entra para a loja
    });

    it("deve atribuir a venda de 40mil do Valdinei para a Filial São Mateus do Sul", () => {
      const leadValdinei40k = {
        nome: "Valdinei da Silva",
        valor_credito: 40000,
        cidade: "São Mateus do Sul"
      };

      const matchedValdinei = matchLeadToLoja(leadValdinei40k, MOCK_LOJAS);
      expect(matchedValdinei).not.toBeNull();
      expect(matchedValdinei?.id).toBe("filial-927"); // São Mateus do Sul
      expect(matchedValdinei?.cidade).toBe("SÃO MATEUS DO SUL");
    });

    it("deve associar corretamente vendas comuns de loja", () => {
      const leadLoja = {
        nome: "Cliente Comum Loja",
        valor_credito: 80000,
        cidade: "PARANAGUÁ"
      };

      const matchedLoja = matchLeadToLoja(leadLoja, MOCK_LOJAS);
      expect(matchedLoja).not.toBeNull();
      expect(matchedLoja?.id).toBe("filial-952");
    });
  });
});
