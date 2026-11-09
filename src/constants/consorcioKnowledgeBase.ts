/**
 * ==============================================================================
 * BASE DE CONHECIMENTO ESPECIALIZADA EM CONSÓRCIOS — SIMULAJA & PROSPERA PLAN
 * ==============================================================================
 * Conhecimento técnico, financeiro, regulatório e estratégico para especializar
 * todos os agentes de IA do CRM (Jarvis, Harvey, SDR, Closer, Reativador, etc.).
 */

export interface ConsorcioKnowledgeTopic {
  id: string;
  title: string;
  summary: string;
  arguments: string[];
}

export const CONSORCIO_KNOWLEDGE_BASE: ConsorcioKnowledgeTopic[] = [
  {
    id: "comparativo_sac_vs_consorcio",
    title: "Matemática Financeira: Consórcio vs Financiamento Bancário (SAC / PRICE)",
    summary: "No financiamento imobiliário ou de pesados, o cliente paga entre 1,8x e 2,4x o valor do bem em juros compostos. No consórcio, o custo total é apenas a taxa de administração diluída (média de 1,2% a 1,8% ao ano).",
    arguments: [
      "Juros Bancários: Financiamento de R$ 500.000 na Caixa custa ao final cerca de R$ 1,2 a R$ 1,4 milhão (juros compostos acumulados).",
      "Consórcio Planejado: O mesmo crédito de R$ 500.000 no Consórcio Magalu com taxa de adm de 15% diluída em 200 meses custa apenas R$ 575.000 no total — economia de mais de R$ 600.000.",
      "Custo Efetivo Total (CET): O CET do consórcio é infinitamente menor porque a taxa incide de forma simples sobre o crédito, sem juros bancários sobre o saldo devedor.",
      "Poder de Compra à Vista: O consorciado contemplado compra como dinheiro na mão, permitindo negociar descontos de 5% a 15% com o vendedor do imóvel ou concessionária."
    ]
  },
  {
    id: "meia_parcela_alavancagem",
    title: "Estratégia de Meia Parcela (Parcela 50/50 até a Contemplação)",
    summary: "Permite ao cliente entrar no consórcio pagando 50% da parcela mensal até a contemplação. Ideal para quem já paga aluguel ou financia outro bem e precisa de fôlego financeiro.",
    arguments: [
      "Como Funciona: O cliente paga apenas metade da parcela normal até ser contemplado por sorteio ou lance.",
      "Após a Contemplação: O cliente pode escolher abater os 50% restantes do próprio saldo devedor ou integralizar nas parcelas futuras.",
      "Alavancagem Inteligente: Investidores usam a meia parcela para manter 2 a 3 cotas em andamento gastando o valor de apenas 1 parcela inteira, multiplicando as chances de contemplação rápida."
    ]
  },
  {
    id: "lance_embutido_fgts",
    title: "Lances Inteligentes: Lance Embutido (30%) e FGTS",
    summary: "O cliente não precisa ter dinheiro em mãos para ofertar um lance competitivo. No Consórcio Magalu, é possível utilizar até 30% do próprio crédito como lance.",
    arguments: [
      "Lance Embutido: Em um crédito de R$ 300.000, o cliente pode ofertar R$ 90.000 (30%) do próprio crédito. Ao ser contemplado, retira R$ 210.000 líquidos e amortiza as parcelas ou o prazo.",
      "Combinação de Recursos: O cliente pode somar Lance Embutido (30%) + Recursos Próprios + FGTS (para imóveis), elevando sua oferta para 50% a 70% e garantindo contemplação nos primeiros meses.",
      "Lance Livre vs Lance Fixo: Grupos maduros possuem faixas previsíveis de lance livre (médias cadastradas na matriz do simulador) e cotas por sorteio mensal pela Loteria Federal."
    ]
  },
  {
    id: "reajuste_incc_ipca",
    title: "Atualização Patrimonial: Reajuste pelo INCC e IPCA",
    summary: "O consórcio protege o poder de compra. Se o imóvel ou o caminhão subir de preço no mercado, a carta de crédito do consorciado aumenta na mesma proporção.",
    arguments: [
      "Consórcio Imobiliário: Corrigido anualmente pelo INCC (Índice Nacional de Custo da Construção). O crédito sobe e as parcelas acompanham, garantindo que o cliente compre o mesmo imóvel planejado.",
      "Pesados e Automóveis: Corrigidos por IPCA ou pela tabela do fabricante (FIPE / Montadora).",
      "Segurança Jurídica: Todo consórcio é fiscalizado e garantido pelo Banco Central do Brasil (Lei 11.795/2008 e Circular BACEN 3.432)."
    ]
  },
  {
    id: "consorcio_empresarial_frotas",
    title: "Consórcio Corporativo: Frotas, Expansão e Capital de Giro Estratégico",
    summary: "Grandes empresas utilizam o consórcio de pesados e maquinários como linha de renovação contínua de frotas sem descapitalizar o fluxo de caixa.",
    arguments: [
      "Renovação Programada: Empresas de transporte adquirem pacotes de cotas de pesados (R$ 300k a R$ 600k) programando contemplações anuais com lance embutido.",
      "Substituição de Garantia: Ao vender o veículo antigo, o caminhão novo entra no lugar com custo de juros zero.",
      "Benefício Tributário: As parcelas do consórcio podem ser lançadas como despesas operacionais no Lucro Real, gerando abatimento de IRPJ e CSLL."
    ]
  }
];

export function getConsorcioKnowledgePrompt(): string {
  return `
# BASE DE CONHECIMENTO TÉCNICO E ESTRATÉGICO EM CONSÓRCIOS (SIMULAJA / MAGALU):
1. CONSÓRCIO VS FINANCIAMENTO (SAC/PRICE):
   - Financiamento bancário tradicional quase triplica o valor do bem devido a juros compostos.
   - O Consórcio Magalu possui taxa administrativa fixa diluída ao longo de todo o prazo (custo médio diluído de apenas 1,2% a 1,8% a.a.), gerando economia real de até 50% a 65% em comparação a qualquer banco.
2. MEIA PARCELA (50/50):
   - O proponente paga apenas 50% da parcela até o momento da contemplação.
   - Excelente para quem está pagando aluguel ou quer manter liquidez.
3. LANCE EMBUTIDO (30%):
   - O cliente pode usar até 30% da própria carta para dar lance sem tirar nada do bolso.
   - Para imóveis, é permitido somar o saldo do FGTS.
4. SEGURANÇA E REGULAMENTAÇÃO:
   - Fiscalizado pelo Banco Central do Brasil (Lei Federal 11.795/2008).
   - Administradora: Consórcio Magalu (parceira Prospera Plan).
`;
}
