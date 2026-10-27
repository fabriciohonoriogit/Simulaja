import { describe, it, expect } from "vitest";
import { calcularComissaoRecorrenteLead } from "./gamificationUtils";
import { matchLeadToLoja, calculateLojasPerformance } from "./lojasService";
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

    it("deve calcular a comissão para as vendas do gestor (50k e 40k)", () => {
      const leadGestor50k = {
        nome: "Cliente Gestor 50k",
        valor_credito: 50000,
        is_venda_gestor: true,
        administradora: "MAGALU"
      };

      const leadGestor40k = {
        nome: "Cliente Gestor 40k",
        valor_credito: 40000,
        is_venda_gestor: true,
        administradora: "MAGALU"
      };

      // 50.000 * 4.00% = 2.000 / 10 parcelas = 200 recorrente (Gestor)
      const comissao50k = calcularComissaoRecorrenteLead(leadGestor50k);
      expect(comissao50k).toBe(200);

      // 40.000 * 4.00% = 1.600 / 10 parcelas = 160 recorrente (Gestor)
      const comissao40k = calcularComissaoRecorrenteLead(leadGestor40k);
      expect(comissao40k).toBe(160);

      // Total Gestor = 200 + 160 = R$ 360,00/mês
      expect(comissao50k + comissao40k).toBe(360);
    });

    it("deve calcular o total de comissão do mês de setembro (190k total = 560,00/mês)", () => {
      const gestor50k = calcularComissaoRecorrenteLead({ valor_credito: 50000, is_venda_gestor: true });
      const gestor40k = calcularComissaoRecorrenteLead({ valor_credito: 40000, is_venda_gestor: true });
      const filial60k = calcularComissaoRecorrenteLead({ valor_credito: 60000, cidade: "Paranaguá" });
      const filial40k = calcularComissaoRecorrenteLead({ valor_credito: 40000, cidade: "São Mateus do Sul", nome: "Valdinei" });

      expect(gestor50k).toBe(200);
      expect(gestor40k).toBe(160);
      expect(filial60k).toBe(120);
      expect(filial40k).toBe(80);

      const totalMesSetembro = gestor50k + gestor40k + filial60k + filial40k;
      expect(totalMesSetembro).toBe(560);
    });
  });

  describe("Atribuição de Vendas de Gestor vs Loja", () => {
    it("deve excluir as vendas de 50mil e 40mil do gestor das metas da loja", () => {
      const lead50kGestor = {
        nome: "Cliente Gestor 50k",
        valor_credito: 50000,
        cidade: "PARANAGUÁ",
        is_venda_gestor: true
      };

      const lead40kGestor = {
        nome: "Cliente Gestor 40k",
        valor_credito: 40000,
        cidade: "PARANAGUÁ",
        is_venda_gestor: true
      };

      expect(matchLeadToLoja(lead50kGestor, MOCK_LOJAS)).toBeNull(); // Não entra para a loja
      expect(matchLeadToLoja(lead40kGestor, MOCK_LOJAS)).toBeNull(); // Não entra para a loja
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

    it("deve associar corretamente a venda de 60k para a Filial Paranaguá", () => {
      const leadLoja = {
        nome: "Cliente Paranaguá 60k",
        valor_credito: 60000,
        cidade: "PARANAGUÁ"
      };

      const matchedLoja = matchLeadToLoja(leadLoja, MOCK_LOJAS);
      expect(matchedLoja).not.toBeNull();
      expect(matchedLoja?.id).toBe("filial-952");
    });

    it("deve atribuir a venda de 20mil da cliente Elizabeth como VENDA DO GESTOR e NÃO da Loja Paranaguá", () => {
      const leadElizabeth = {
        nome: "Elizabeth",
        valor_credito: 20000,
        cidade: "PARANAGUÁ", // Mesmo que a cidade seja Paranaguá, é venda exclusiva do gestor
        filial_nome: "PARANAGUÁ"
      };

      // Não deve ser associada à loja Paranaguá (deve ser nulo para pontuar apenas como gestor)
      const matchedLoja = matchLeadToLoja(leadElizabeth, MOCK_LOJAS);
      expect(matchedLoja).toBeNull();

      // Comissão recorrente do gestor: (20.000 * 4%) / 10 = R$ 80,00/mês
      const comissaoElizabeth = calcularComissaoRecorrenteLead(leadElizabeth);
      expect(comissaoElizabeth).toBe(80);

      // No desempenho da loja Paranaguá, as vendas fechadas devem ser 0
      const { lojasMetrics } = calculateLojasPerformance([
        { ...leadElizabeth, status: "venda_fechada", created_at: new Date().toISOString() }
      ], MOCK_LOJAS);
      const paranaguaMetric = lojasMetrics.find(m => m.loja.id === "filial-952");
      expect(paranaguaMetric?.realizado).toBe(0);
    });
  });
});
