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
  },
  {
    id: "circulares_transferencia_titularidade",
    title: "Circulares Oficiais Consórcio Magalu: Transferência de Titularidade e Isenção da Taxa",
    summary: "Normas das Circulares Oficiais nº 02, 10, 19, 23, 29, 37, 46 e 59 sobre cessão de cotas contempladas e não contempladas, isenções de taxa e assinatura GOV.BR.",
    arguments: [
      "Cota Não Contemplada: Transferência simplificada por cessão de direitos e obrigações. Cota deve estar rigorosamente em dia. Não há exigência de comprovação de renda complexa do cessionário.",
      "Cota Contemplada: Exige aprovação cadastral e análise de crédito prévia do cessionário (parcela não pode exceder 30% da renda bruta comprovada). Se o bem já estiver alienado, exige vistoria e repasse de gravame.",
      "Política de Isenção da Taxa (Circular #2): Isenção total para 1º grau de parentesco (pais, filhos, cônjuges com união estável) e mesmo grupo societário (entre sócios do contrato social ou transferência PF para PJ e vice-versa). Demais casos pagam taxa de transferência sobre o saldo devedor.",
      "Assinatura GOV.BR (Circulares #10 e #23): Validade jurídica plena via portal GOV.BR (níveis Prata ou Ouro), dispensando reconhecimento de firma em cartório.",
      "Digitalização e Prazos (Circulares #19, #29 e #59): Emissão do termo direto pelo portal, envio digitalizado e conclusão em 48h a 72h úteis para não contempladas e até 5 dias para contempladas."
    ]
  },
  {
    id: "circular_lance_caucao_magalu",
    title: "Circular Oficial Consórcio Magalu (CIRC/ADM/001/2026): Regras do Lance Caução",
    summary: "Normas completas da Circular Oficial CIRC/ADM/001/2026 da Gestão de Grupos do Consórcio Magalu para oferta e baixa de Lance Caução em veículos e imóveis.",
    arguments: [
      "O que é o Lance Caução: Permite ao consorciado que já possui um bem (veículo ou imóvel) oferecê-lo como parte do pagamento (lance) na compra de um novo bem, SEM precisar vendê-lo antes da contemplação (vende somente após ser contemplado).",
      "Limite Máximo de Oferta: No Imóvel e no Veículo, o lance caução é limitado a até 70,0000% do lance ofertado em todos os grupos. Não pode ultrapassar (70,0001% é recusado). Eletro e Serviços NÃO possuem caução.",
      "Regra do Valor do Novo Bem: O bem a ser adquirido deve ter valor no MÍNIMO igual à soma do Crédito Líquido + Lance Caução Ofertado. Se vender o bem abaixo da FIPE, o consorciado complementa a diferença com recursos próprios.",
      "Documentos & Baixa do Lance: Prazo de até 3 dias úteis após a contemplação via formulário oficial. Veículos: CRLV no nome do titular ou cônjuge (com certidão de casamento/união estável) + Print da FIPE. Imóveis: Matrícula atualizada + Laudo de avaliação de engenheiro.",
      "Troca entre Subsegmentos: Permitido trocar moto por carro, carro por caminhão (mesmo segmento de veículos). Pode ofertar o mesmo veículo em mais de uma cota do mesmo segmento.",
      "Vedações Absolutas: Proibido usar crédito contemplado com lance caução para reforma ou construção; proibido receber crédito em espécie; proibido usar garantia substitutiva em imóvel; e não há estorno de caução para pagamento em recursos próprios."
    ]
  }
];

export function getConsorcioKnowledgePrompt(): string {
  return `
# BASE DE CONHECIMENTO TÉCNICO, REGULATÓRIO E CIRCULARES OFICIAIS MAGALU:
1. CONSÓRCIO VS FINANCIAMENTO (SAC/PRICE):
   - Financiamento tradicional quase triplica o valor do bem em juros compostos.
   - O Consórcio Magalu possui taxa administrativa fixa diluída ao longo de todo o prazo (custo médio diluído de apenas 1,2% a 1,8% a.a.), gerando economia real de até 50% a 65% em comparação a qualquer banco.
2. MEIA PARCELA (50/50):
   - O proponente paga apenas 50% da parcela até o momento da contemplação.
   - Excelente para quem está pagando aluguel ou quer manter liquidez.
3. LANCE EMBUTIDO (30%):
   - O cliente pode usar até 30% da própria carta para dar lance sem tirar nada do bolso.
   - Para imóveis, é permitido somar o saldo do FGTS.
4. LANCE CAUÇÃO (CIRCULAR OFICIAL MAGALU CIRC/ADM/001/2026):
   - Finalidade: O consorciado oferece o próprio carro, moto, caminhão ou imóvel como lance sem precisar vender antes da assembleia.
   - Limite de Oferta: Até 70,0000% do lance ofertado em Imóveis e Veículos (em todos os grupos). Não há caução para eletro e serviços.
   - Regra do Bem Adquirido: O valor do novo bem DEVE ser no mínimo a soma: Crédito Líquido + Valor Ofertado como Caução.
   - Documentos e Prazo: Envio em até 3 dias úteis após a contemplação via formulário Magalu. Veículo exige CRLV (titular ou cônjuge) + print FIPE. Imóvel exige matrícula atualizada + laudo de engenheiro.
   - Vedações: Proibido receber em dinheiro/espécie; proibido usar em construção/reforma do imóvel caucionado; não permite garantia substitutiva para imóvel; e não permite estorno para dinheiro próprio.
5. TRANSFERÊNCIA DE TITULARIDADE (CIRCULARES #2, #10, #19, #23, #37, #46, #59):
   - Cota Não Contemplada: Cessão rápida de direitos e obrigações. Cota 100% em dia. Não exige comprovação de renda complexa.
   - Cota Contemplada: Exige análise prévia de crédito do novo titular (cessionário) com renda compatível (parcela ≤ 30% da renda bruta) e sem restrições (Serasa/SPC). Se o bem já estiver alienado, exige vistoria e transferência do gravame.
   - Isenção da Taxa de Transferência (Circular #2): ISENÇÃO TOTAL para 1º grau de parentesco (pais, filhos e cônjuges) e mesmo grupo societário (sócios da mesma empresa ou PF para sua própria PJ).
   - Assinatura Eletrônica GOV.BR (Circulares #10 e #23): Aceite formal com validade jurídica via GOV.BR (nível Prata ou Ouro), dispensando ida ao cartório e reconhecimento de firma.
6. SEGURANÇA E REGULAMENTAÇÃO:
   - Fiscalizado pelo Banco Central do Brasil (Lei Federal 11.795/2008).
   - Administradora: Consórcio Magalu (parceira Prospera Plan).
`;
}

