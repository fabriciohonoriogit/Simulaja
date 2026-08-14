import { describe, it, expect } from "vitest";
import { calcularComissaoRecorrenteLead } from "./gamificationUtils";
import { matchLeadToLoja, LojaConfig } from "./lojasService";

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
  });

  describe("Atribuição de Vendas de Gestor vs Loja", () => {
    it("deve excluir a venda de 200mil ou marcada como Venda do Gestor das metas da loja", () => {
      const lead200kGestor = {
        nome: "Cliente Gestor 200k",
        valor_credito: 200000,
        cidade: "PARANAGUÁ",
        origem: "venda_gestor"
      };

      const leadValdinei = {
        nome: "Valdinei da Silva",
        valor_credito: 200000,
        cidade: "PARANAGUÁ"
      };

      const matchedGestor200k = matchLeadToLoja(lead200kGestor, MOCK_LOJAS);
      expect(matchedGestor200k).toBeNull(); // Não entra para a loja

      const matchedValdinei = matchLeadToLoja(leadValdinei, MOCK_LOJAS);
      expect(matchedValdinei).toBeNull(); // Não entra para a loja
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
