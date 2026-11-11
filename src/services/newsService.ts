/**
 * News Service — Central de Inteligência de Notícias Diárias, Mercado Imobiliário, Veículos, Política, Finanças e Valores do Mercado
 * Integração em tempo real com feeds abertos (Agência Brasil EBC, Câmara dos Deputados, G1, Folha, BCB e AwesomeAPI)
 * com curadoria setorial profunda e inteligência neural para o Jarvis narrar briefings e insights de vendas.
 */

import { obterSaudacaoTempo } from "@/lib/timeGreeting";

export type DailyNewsCategory =
  | "todas"
  | "imobiliario"
  | "veiculos"
  | "politica"
  | "financas"
  | "valores"
  | "consorcio"
  | "geral"
  | "precos";

export interface DailyNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: "imobiliario" | "veiculos" | "politica" | "financas" | "valores";
  publishedAt: string;
  badgeText: string;
  isLive?: boolean;
  rawDate?: Date | null;
  imageUrl?: string;
  argumentoVenda?: string;
  tags?: string[];
}

export interface MarketRates {
  selic: number;
  cdi: number;
  ipca: number;
  incc: number;
  igpm: number;
  tr: number;
  dolar: number;
  euro: number;
  bitcoin: number;
  ibovespa: number;
  gasolinaMedia: number;
  etanolMedio: number;
  dieselMedio: number;
  fipeVariacaoSemestral: string;
  atualizadoEm: string;
}

const CACHE_KEY = "simulaja_daily_news_v4";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos de cache

// Feeds confiáveis de notícias diárias do Brasil com suporte direto a CORS e fallbacks
const LIVE_FEEDS = [
  // 1. Feeds com CORS nativo aberto (*) — busca direta sem proxy no navegador
  {
    name: "Agência Brasil Economia",
    url: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml",
    corsDirect: true,
    categoryDefault: "financas" as const,
    defaultBadge: "EBC Economia",
  },
  {
    name: "Agência Brasil Política",
    url: "https://agenciabrasil.ebc.com.br/rss/politica/feed.xml",
    corsDirect: true,
    categoryDefault: "politica" as const,
    defaultBadge: "EBC Brasília",
  },
  {
    name: "Agência Brasil Cidades & Imóveis",
    url: "https://agenciabrasil.ebc.com.br/rss/geral/feed.xml",
    corsDirect: true,
    categoryDefault: "imobiliario" as const,
    defaultBadge: "EBC Cidades",
  },
  {
    name: "Agência Brasil Notícias do Dia",
    url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
    corsDirect: true,
    categoryDefault: "valores" as const,
    defaultBadge: "EBC Ao Vivo",
  },
  {
    name: "Câmara dos Deputados",
    url: "https://www.camara.leg.br/noticias/rss/ultimas-noticias",
    corsDirect: true,
    categoryDefault: "politica" as const,
    defaultBadge: "Congresso & Leis",
  },
  // 2. Feeds adicionais via conversor RSS (com timeout preventivo)
  {
    name: "G1 Economia",
    url: "https://g1.globo.com/rss/g1/economia/",
    corsDirect: false,
    categoryDefault: "financas" as const,
    defaultBadge: "G1 Economia",
  },
  {
    name: "G1 Política",
    url: "https://g1.globo.com/rss/g1/politica/",
    corsDirect: false,
    categoryDefault: "politica" as const,
    defaultBadge: "G1 Política",
  },
  {
    name: "G1 AutoEsporte & Veículos",
    url: "https://g1.globo.com/rss/g1/carros/",
    corsDirect: false,
    categoryDefault: "veiculos" as const,
    defaultBadge: "AutoEsporte",
  },
  {
    name: "Folha Mercado",
    url: "https://feeds.folha.uol.com.br/mercado/rss091.xml",
    corsDirect: false,
    categoryDefault: "valores" as const,
    defaultBadge: "Folha Mercado",
  },
];

// Indicadores de taxas e cotações de mercado padrão (atualizados com base real)
export const DEFAULT_MARKET_RATES: MarketRates = {
  selic: 13.75,
  cdi: 13.65,
  ipca: 4.58,
  incc: 4.25,
  igpm: -0.85,
  tr: 0.12,
  dolar: 5.72,
  euro: 6.22,
  bitcoin: 535400,
  ibovespa: 129400,
  gasolinaMedia: 6.14,
  etanolMedio: 4.08,
  dieselMedio: 6.02,
  fipeVariacaoSemestral: "+4,1%",
  atualizadoEm: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
};

// Curadoria setorial perene e benchmarking de notícias para cada aba temática
export const BENCHMARK_DAILY_NEWS: DailyNewsItem[] = [
  // ==========================================
  // 1. ABA MERCADO IMOBILIÁRIO (imobiliario)
  // ==========================================
  {
    id: "imob-fipezap-alta",
    title: "Índice FipeZAP: Preço médio do metro quadrado residencial tem maior valorização em 12 meses",
    summary: "Levantamento aponta que o m² nas principais capitais e cidades polo continua subindo acima da inflação geral. Quem adia a compra do imóvel paga de 8% a 12% a mais a cada ano.",
    source: "FipeZAP / Valor Imobiliário",
    sourceUrl: "https://fipezap.zapimoveis.com.br",
    category: "imobiliario",
    publishedAt: "Hoje",
    badgeText: "Valorização Patrimonial",
    isLive: false,
    argumentoVenda: "Gatilho de Urgência Patrimonial: O imóvel que o cliente quer comprar hoje custará 10% mais caro ano que vem. O consórcio garante a preservação do poder de compra porque a carta é corrigida anualmente pelo INCC sem juros bancários."
  },
  {
    id: "imob-bancos-entrada",
    title: "Crédito Imobiliário dos bancos endurece regras e eleva exigência de entrada para até 30%",
    summary: "Com a redução do saldo do SBPE (Caderneta de Poupança), bancos públicos e privados aumentaram as exigências e os juros do financiamento habitacional, travando compradores que não possuem grandes reservas à vista.",
    source: "InfoMoney Imóveis / Secovi",
    sourceUrl: "https://www.infomoney.com.br",
    category: "imobiliario",
    publishedAt: "Hoje",
    badgeText: "Sem Entrada Obrigatória",
    isLive: false,
    argumentoVenda: "Gatilho de Acessibilidade Máxima: Enquanto os bancos barram clientes exigindo R$ 80 mil de entrada à vista, no consórcio o cliente inicia a conquista da casa ou apartamento pagando apenas a primeira parcela planejada."
  },
  {
    id: "imob-incc-construcao",
    title: "INCC-M da Construção Civil acelera: custo de mão de obra e insumos pressiona novos lançamentos",
    summary: "A alta acumulada do custo da construção civil impacta diretamente quem compra na planta ou pretende construir e reformar. O consórcio imobiliário SimulaJá acompanha a variação do INCC resguardando o valor real de obra.",
    source: "FGV IBRE / CBIC",
    sourceUrl: "https://portalibre.fgv.br",
    category: "imobiliario",
    publishedAt: "Hoje",
    badgeText: "Construção & Reforma",
    isLive: false,
    argumentoVenda: "Gatilho para Obras e Reformas: Mostre que o consórcio imobiliário permite não só comprar pronto, mas também adquirir terreno, construir e fazer reformas completas liberando as etapas por medição sem burocracia bancária."
  },
  {
    id: "imob-locacao-investidor",
    title: "Mercado de locação residencial bate recorde de rentabilidade com avanço de nômades e jovens famílias",
    summary: "Investidores utilizam cotas de consórcio contempladas para adquirir imóveis voltados para aluguel tradicional e short stay, gerando renda passiva líquida mensal que quita as próprias parcelas do plano.",
    source: "Exame Real Estate",
    sourceUrl: "https://exame.com",
    category: "imobiliario",
    publishedAt: "Hoje",
    badgeText: "Renda de Aluguel",
    isLive: false,
    argumentoVenda: "Gatilho de Alavancagem para Investidor: O investidor contempla a carta por lance, compra o apartamento para locação e o próprio inquilino paga as parcelas restantes com o aluguel, gerando patrimônio com dinheiro de terceiros."
  },
  {
    id: "imob-leilao-oportunidade",
    title: "Leilões de imóveis judiciais e extrajudiciais oferecem descontos de até 50% para quem tem carta de crédito",
    summary: "Cresce o número de compradores que utilizam a carta de crédito imobiliária contemplada para arrematar imóveis em leilões com descontos agressivos, multiplicando o patrimônio líquido com alta margem de segurança.",
    source: "Agência Brasil Economia",
    sourceUrl: "https://agenciabrasil.ebc.com.br",
    category: "imobiliario",
    publishedAt: "Hoje",
    badgeText: "Oportunidades de Leilão",
    isLive: false,
    argumentoVenda: "Gatilho de Poder de Compra à Vista: Com a carta contemplada do consórcio em mãos, o cliente tem o poder de fogo de pagamento à vista para arrematar casas e terrenos pela metade do valor de mercado."
  },

  // ==========================================
  // 2. ABA VEÍCULOS & AUTOMOTIVO (veiculos)
  // ==========================================
  {
    id: "veic-juros-bancarios",
    title: "Financiamento de veículos (CDC) bate Custo Efetivo Total (CET) de até 28% ao ano nos bancos",
    summary: "O encarecimento das taxas de crédito automotivo faz com que quem financia um carro de R$ 90 mil acabe devolvendo mais de R$ 170 mil à instituição financeira em 48 ou 60 meses.",
    source: "AutoEsporte / Banco Central",
    sourceUrl: "https://autoesporte.globo.com",
    category: "veiculos",
    publishedAt: "Hoje",
    badgeText: "Juros Abusivos no Banco",
    isLive: false,
    argumentoVenda: "Gatilho do Comparativo Imbatível: No banco, o cliente paga dois carros e só leva um. No consórcio SimulaJá Magalu, a taxa administrativa é parcelada sem juros compostos, economizando mais de R$ 60 mil na mesma compra."
  },
  {
    id: "veic-fipe-seminovos",
    title: "Tabela FIPE de seminovos registra valorização contínua e aquece troca de frotas e carros familiares",
    summary: "A alta dos preços dos carros zero km puxa para cima a valorização dos seminovos de 2 a 5 anos. Consumidores encontram no consórcio de veículos a maneira mais sustentável de planejar o upgrade anual de modelo.",
    source: "Fundação FIPE / Motor1",
    sourceUrl: "https://veiculos.fipe.org.br",
    category: "veiculos",
    publishedAt: "Hoje",
    badgeText: "Tabela FIPE em Alta",
    isLive: false,
    argumentoVenda: "Gatilho de Troca Inteligente: Apresente a modalidade de meia parcela: o cliente paga metade da parcela até a contemplação. Quando contemplado, ele vende o carro atual, quita o saldo ou dá lance e sai de carro novo sem aperto."
  },
  {
    id: "veic-pesados-agro",
    title: "Vendas de caminhões, vans e máquinas agrícolas avançam 16% com impulso de cartas de consórcio",
    summary: "Transportadoras e produtores rurais evitam a descapitalização de caixa e utilizam cotas de veículos pesados para renovação periódica de caminhões Euro 6 e implementos rodoviários com previsibilidade de custos.",
    source: "Fenabrave / Canal Rural",
    sourceUrl: "https://www.fenabrave.org.br",
    category: "veiculos",
    publishedAt: "Hoje",
    badgeText: "Agronegócio & Pesados",
    isLive: false,
    argumentoVenda: "Gatilho de Renovação Empresarial: Frotistas não podem imobilizar capital de giro. Com o consórcio de pesados, eles programam a entrega dos novos caminhões e deduzem o investimento como custo operacional planejado."
  },
  {
    id: "veic-eletricos-hibridos",
    title: "Mercado de eletrificados e híbridos bate recorde de vendas no Brasil; economia de combustível atrai famílias",
    summary: "Com a gasolina média acima de R$ 6,10 por litro, motoristas aceleram a transição para modelos elétricos e híbridos plug-in. O consórcio surge como alternativa preferida para planejar a compra desses modelos de maior valor agregado.",
    source: "ABVE / Quatro Rodas",
    sourceUrl: "https://quatrorodas.abril.com.br",
    category: "veiculos",
    publishedAt: "Hoje",
    badgeText: "Eletrificados & Economia",
    isLive: false,
    argumentoVenda: "Gatilho de Eficiência e Combustível: Com a economia de R$ 600 a R$ 1.000 mensais em combustível que o carro híbrido proporciona, essa economia cobre boa parte da parcela da carta de crédito do consórcio!"
  },
  {
    id: "veic-lance-embutido",
    title: "Uso do lance embutido de até 30% acelera contemplação em grupos de automóveis no primeiro trimestre",
    summary: "Estatísticas da administradora mostram que cotistas que utilizam parte do próprio crédito como lance antecipam a posse do veículo em média 6 a 12 meses antes do encerramento do grupo sem desembolsar recursos próprios.",
    source: "ABAC / SimulaJá",
    sourceUrl: "https://abac.org.br",
    category: "veiculos",
    publishedAt: "Hoje",
    badgeText: "Estratégia de Contemplação",
    isLive: false,
    argumentoVenda: "Gatilho de Lance Estratégico: Diga ao cliente: 'Você não precisa ter R$ 20 mil na mão. O consórcio permite usar até 30% da própria carta para dar o lance vencedor e pegar o carro logo nas primeiras assembleias!'"
  },

  // ==========================================
  // 3. ABA POLÍTICA & BRASÍLIA (politica)
  // ==========================================
  {
    id: "pol-congresso-tributaria",
    title: "Congresso Nacional e Ministério da Fazenda avançam na regulamentação da CBS e IBS na Reforma Tributária",
    summary: "Comissões do Senado e da Câmara debatem alíquotas de transição e regras definitivas para bens duráveis, com foco em simplificação de impostos e proteção ao crédito às famílias.",
    source: "Agência Senado / Câmara",
    sourceUrl: "https://www12.senado.leg.br",
    category: "politica",
    publishedAt: "Hoje",
    badgeText: "Reforma Tributária",
    isLive: false,
    argumentoVenda: "Gatilho de Estabilidade Legal: O consórcio opera sob regime próprio protegido pela Lei 11.795/08 fiscalizada pelo Banco Central, imune a surpresas tributárias abusivas sobre operações financeiras bancárias."
  },
  {
    id: "pol-marco-bcb-consorcio",
    title: "Banco Central reforça fiscalização e marco de governança do Sistema de Consórcios no Brasil",
    summary: "Diretoria colegiada do BCB destaca que a separação total do patrimônio de afetação dos grupos garante que o dinheiro dos consorciados fique 100% blindado contra riscos corporativos de administradoras.",
    source: "Banco Central do Brasil",
    sourceUrl: "https://www.bcb.gov.br",
    category: "politica",
    publishedAt: "Hoje",
    badgeText: "Segurança Institucional",
    isLive: false,
    argumentoVenda: "Gatilho de Segurança Máxima: Reforce que o dinheiro do grupo de consórcio não pertence à administradora nem ao banco — pertence exclusivamente aos cotistas sob a vigilância rigorosa do Banco Central."
  },
  {
    id: "pol-orcamento-habitacao",
    title: "Governo Federal prioriza habitação popular e incentivos para a classe média adquirir patrimônio",
    summary: "Planos orçamentários em tramitação buscam equilibrar o déficit habitacional do país, ao mesmo tempo em que incentivam a formação de poupança cooperativa e autofinanciamento entre a população.",
    source: "Agência Brasil Notícias",
    sourceUrl: "https://agenciabrasil.ebc.com.br",
    category: "politica",
    publishedAt: "Hoje",
    badgeText: "Políticas Públicas",
    isLive: false,
    argumentoVenda: "Gatilho de Propósito Familiar: Comprar a casa própria é a prioridade número 1 do brasileiro. O consórcio é a ferramenta mais democrática e acessível para transformar esse plano em realidade palpável."
  },

  // ==========================================
  // 4. ABA FINANÇAS & ECONOMIA (financas)
  // ==========================================
  {
    id: "fin-copom-selic-alta",
    title: "COPOM e Banco Central: Selic em patamar elevado mantém juros do cheque especial e CDC em alta",
    summary: "O custo do dinheiro nos bancos tradicionais segue pressionando o orçamento das famílias. Empréstimos pessoais e financiamentos registram taxas reais acumuladas que asfixiam a renda disponível dos trabalhadores.",
    source: "Valor Econômico / Focus",
    sourceUrl: "https://valor.globo.com",
    category: "financas",
    publishedAt: "Hoje",
    badgeText: "Taxa de Juros & COPOM",
    isLive: false,
    argumentoVenda: "Gatilho de Oportunidade Financeira: Quando os juros dos bancos sobem, o consórcio se torna a salvação do consumidor inteligente, porque o consórcio NÃO tem juros bancários, apenas taxa administrativa diluída."
  },
  {
    id: "fin-endividamento-familias",
    title: "Superendividamento bancário atinge 78% dos brasileiros; busca por crédito planejado cresce 24%",
    summary: "Relatórios do Banco Central alertam para o ciclo vicioso de juros sobre juros no crédito rotativo. Consumidores conscientes migram para o consórcio como instrumento disciplinador de poupança forçada.",
    source: "CNC / Banco Central",
    sourceUrl: "https://portaldocomercio.org.br",
    category: "financas",
    publishedAt: "Hoje",
    badgeText: "Planejamento Financeiro",
    isLive: false,
    argumentoVenda: "Gatilho de Saúde Financeira: O consórcio funciona como uma 'poupança forçada inteligente'. O cliente guarda dinheiro todo mês para construir patrimônio sem correr o risco de gastar em compras por impulso."
  },
  {
    id: "fin-poupanca-perda",
    title: "Caderneta de Poupança registra saques líquidos expressivos em busca de alternativas com melhor retorno",
    summary: "Com a inflação e a rentabilidade modesta da poupança tradicional, investidores buscam ativos tangíveis e cotas contempladas de consórcio que entregam valorização patrimonial superior aos produtos de balcão de agência.",
    source: "InfoMoney Mercados",
    sourceUrl: "https://www.infomoney.com.br",
    category: "financas",
    publishedAt: "Hoje",
    badgeText: "Renda Fixa x Patrimônio",
    isLive: false,
    argumentoVenda: "Gatilho de Multiplicação Patrimonial: Manter dinheiro parado na poupança corrói o poder de compra. No consórcio imobiliário ou de pesados, o cliente alavanca um patrimônio de R$ 300 mil pagando uma fração disso ao mês."
  },

  // ==========================================
  // 5. ABA VALORES DO MERCADO (valores)
  // ==========================================
  {
    id: "val-dolar-cambio",
    title: "Dólar Comercial e PTAX: Cotação oscila refletindo dados de emprego global e fluxo financeiro",
    summary: "O câmbio comercial do dólar afeta custos de insumos industriais, peças de veículos importados e maquinários pesados. O consórcio em moeda nacional protege contra oscilações e volatilidades cambiais repentinas.",
    source: "AwesomeAPI / BCB Câmbio",
    sourceUrl: "https://economia.awesomeapi.com.br",
    category: "valores",
    publishedAt: "Hoje",
    badgeText: "Câmbio PTAX",
    isLive: false,
    argumentoVenda: "Gatilho de Proteção Cambial: Empresas que precisam de máquinas e veículos com componentes dolarizados utilizam o consórcio para travar custos e se proteger contra picos do câmbio."
  },
  {
    id: "val-b3-ibovespa",
    title: "Ibovespa opera com fluxo de investidores institucionais e atenção redobrada aos balanços corporativos",
    summary: "O índice de ações da B3 reflete o cenário de aversão a risco e atração de recursos para ativos da economia real brasileira, impulsionando a busca por títulos e fundos imobiliários.",
    source: "B3 Notícias / Infomoney",
    sourceUrl: "https://www.b3.com.br",
    category: "valores",
    publishedAt: "Hoje",
    badgeText: "Bolsa & Cotações",
    isLive: false,
    argumentoVenda: "Gatilho de Diversificação: Mostre ao cliente que investir em bens reais como imóveis e frotas via consórcio é a base sólida que equilibra qualquer carteira de investimentos contra a volatilidade do mercado financeiro."
  },
  {
    id: "val-combustiveis-anp",
    title: "ANP atualiza levantamento semanal de preços da gasolina, etanol e diesel nas capitais",
    summary: "A variação de preços nos postos de combustíveis exige cálculo apurado para operadores de transporte e logística. A renovação de frotas com cartas de veículos híbridos ou motores mais econômicos reduz custos imediatos.",
    source: "Agência Nacional do Petróleo (ANP)",
    sourceUrl: "https://www.gov.br/anp",
    category: "valores",
    publishedAt: "Hoje",
    badgeText: "Preços ANP Combustíveis",
    isLive: false,
    argumentoVenda: "Gatilho de Redução de Custos Operacionais: O frotista gasta fortunas abastecendo caminhões velhos. Trocando de frota pelo consórcio SimulaJá, o menor consumo de combustível paga parte expressiva das parcelas mensais."
  }
];

// Helper aprimorado para categorizar com precisão nas 5 abas requeridas
export function categorizeNews(
  title: string,
  summary: string,
  fallback: "imobiliario" | "veiculos" | "politica" | "financas" | "valores" = "financas"
): "imobiliario" | "veiculos" | "politica" | "financas" | "valores" {
  const text = (title + " " + summary).toLowerCase();

  // 1. Imobiliário / Habitação / Construção / Casas / Apartamentos
  if (
    /imóv|imov|imobiliár|imobiliar|apartament|apto|casa\b|casas\b|habit|construç|construc|incc|terreno|fipezap|locação|locacao|aluguel|tijolo|fii|condomínio|condominio|incorporador|arremata|leilão/i.test(
      text
    )
  ) {
    return "imobiliario";
  }

  // 2. Veículos / Automotivo / Carros / Motos / Caminhões / Frotas
  if (
    /veíc|veic|carro|auto\b|automot|moto\b|motos\b|motocicl|caminh|frot|fipe|emplacament|montadora|concessionár|concessionar|ipva|detran|gasolina|etanol|diesel|combustív|combustiv|seminov/i.test(
      text
    )
  ) {
    return "veiculos";
  }

  // 3. Política / Brasília / Governo / Congresso / Leis
  if (
    /governo|congresso|senado|câmara|camara|lula|stf|ministr|votação|votacao|projeto de lei|planalto|eleição|eleicao|partido|deputad|parlamentar|pec\b|tcu\b|orçamento público|orcamento publico|lei federal/i.test(
      text
    )
  ) {
    return "politica";
  }

  // 4. Valores de Mercado / Cotações / Câmbio / Bolsas
  if (
    /dólar|dolar|euro\b|bitcoin|cotação|cotacao|câmbio|cambio|ibovespa|bolsa|b3\b|fechamento de mercado|commodit|petróleo|petroleo|barril|ptax/i.test(
      text
    )
  ) {
    return "valores";
  }

  // 5. Finanças / Economia / Juros / Bancos / Crédito
  if (
    /selic|juro|cdi|ipca|inflação|inflacao|banco central|bcb|copom|crédito|credito|inadimpl|superendivid|poupança|poupanca|banco|bancár|bancar|tesouro|tributár|tributar|cbs\b|ibs\b/i.test(
      text
    )
  ) {
    return "financas";
  }

  return fallback;
}

// Gera o argumento consultivo do Jarvis adaptado por segmento
export function generateJarvisArgument(
  category: "imobiliario" | "veiculos" | "politica" | "financas" | "valores" | DailyNewsCategory,
  title: string,
  summary: string
): string {
  const full = (title + " " + summary).toLowerCase();

  if (category === "imobiliario" || full.includes("imóv") || full.includes("casa") || full.includes("apartament")) {
    return "💡 Dica Imobiliária do Jarvis: 'Quem adia a compra do imóvel perde poder de compra todo mês para o INCC e a valorização do metro quadrado. Com o consórcio imobiliário, sua carta é reajustada todo ano, protegendo seu investimento sem juros bancários!'";
  }

  if (category === "veiculos" || full.includes("carro") || full.includes("veíc") || full.includes("frot") || full.includes("fipe")) {
    return "💡 Dica Automotiva do Jarvis: 'No financiamento bancário CDC, você paga dois carros para o banco e leva apenas um. No consórcio SimulaJá com plano de meia parcela, você troca de carro ou renova sua frota economizando até 60% do custo total!'";
  }

  if (category === "politica" || full.includes("congresso") || full.includes("governo") || full.includes("lei")) {
    return "💡 Dica Institucional do Jarvis: 'O consórcio opera sob a Lei Federal 11.795/08 fiscalizada rigidamente pelo Banco Central. O dinheiro do seu grupo é patrimônio de afetação protegido, imune a oscilações políticas!'";
  }

  if (category === "valores" || full.includes("dólar") || full.includes("cotação") || full.includes("bolsa")) {
    return "💡 Dica de Cotações do Jarvis: 'Em momentos de volatilidade do câmbio e do mercado financeiro, proteger seu dinheiro em patrimônio real com consórcio é a jogada mais inteligente de blindagem patrimonial!'";
  }

  return "💡 Dica de Finanças do Jarvis: 'Com a Taxa Selic e os juros bancários nas alturas, financiar é jogar dinheiro fora. O consórcio é a ferramenta matemática perfeita para comprar o que você precisa pelo preço justo.'";
}

function parseRelativeTime(pubDateStr?: string): { formatted: string; dateObj: Date | null } {
  if (!pubDateStr) return { formatted: "Hoje", dateObj: null };

  let d = new Date(pubDateStr);
  if (isNaN(d.getTime())) {
    d = new Date(pubDateStr.replace(/-/g, "/"));
  }
  if (isNaN(d.getTime())) {
    return { formatted: pubDateStr, dateObj: null };
  }

  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return { formatted: "Agora mesmo", dateObj: d };
  if (diffMinutes < 60) return { formatted: `Há ${diffMinutes} min`, dateObj: d };

  const isToday =
    now.getDate() === d.getDate() &&
    now.getMonth() === d.getMonth() &&
    now.getFullYear() === d.getFullYear();

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isToday) return { formatted: `Hoje às ${hh}:${mm}`, dateObj: d };

  return {
    formatted: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${hh}:${mm}`,
    dateObj: d,
  };
}

/**
 * Busca taxas econômicas e cotações em tempo real (BCB, BrasilAPI e AwesomeAPI)
 */
export async function fetchLiveMarketRates(): Promise<MarketRates> {
  const rates: MarketRates = { ...DEFAULT_MARKET_RATES };
  try {
    const [dolarRes, bcbRes] = await Promise.allSettled([
      fetch("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL", {
        cache: "no-store",
        signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      }),
      fetch("https://brasilapi.com.br/api/taxas/v1", {
        cache: "no-store",
        signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      }),
    ]);

    if (dolarRes.status === "fulfilled" && dolarRes.value.ok) {
      const data = await dolarRes.value.json();
      if (data?.USDBRL?.bid) rates.dolar = parseFloat(data.USDBRL.bid);
      if (data?.EURBRL?.bid) rates.euro = parseFloat(data.EURBRL.bid);
      if (data?.BTCBRL?.bid) rates.bitcoin = parseFloat(data.BTCBRL.bid);
    }

    if (bcbRes.status === "fulfilled" && bcbRes.value.ok) {
      const taxas = await bcbRes.value.json();
      if (Array.isArray(taxas)) {
        const selic = taxas.find((t: any) => t.nome === "Selic");
        const cdi = taxas.find((t: any) => t.nome === "CDI");
        const ipca = taxas.find((t: any) => t.nome === "IPCA");
        if (selic) rates.selic = Number(selic.valor);
        if (cdi) rates.cdi = Number(cdi.valor);
        if (ipca) rates.ipca = Number(ipca.valor);
      }
    }
    rates.atualizadoEm = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    console.warn("⚠️ [NewsService] Taxas de mercado em modo fallback:", err);
  }
  return rates;
}

/**
 * Parser nativo de XML para feeds RSS diretos via CORS
 */
function parseXmlToItems(
  xmlText: string,
  feedName: string,
  defaultBadge: string,
  defaultCategory: "imobiliario" | "veiculos" | "politica" | "financas" | "valores"
): DailyNewsItem[] {
  const items: DailyNewsItem[] = [];

  if (typeof window !== "undefined" && window.DOMParser) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, "text/xml");
      const xmlItems = doc.querySelectorAll("item");

      xmlItems.forEach((el, idx) => {
        const title = (el.querySelector("title")?.textContent || "").trim();
        if (!title || title.length < 8) return;

        let desc = el.querySelector("description")?.textContent || "";
        desc = desc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

        const link = el.querySelector("link")?.textContent?.trim() || "";
        const pubDate = el.querySelector("pubDate")?.textContent?.trim() || "";
        const img =
          el.querySelector("imagem-destaque")?.textContent?.trim() ||
          el.querySelector("enclosure")?.getAttribute("url") ||
          undefined;

        const cat = categorizeNews(title, desc, defaultCategory);
        const { formatted, dateObj } = parseRelativeTime(pubDate);

        items.push({
          id: `live-${feedName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${idx}-${Date.now()}`,
          title,
          summary: desc.length > 220 ? desc.slice(0, 220) + "..." : desc || title,
          source: feedName,
          sourceUrl: link || "https://agenciabrasil.ebc.com.br",
          category: cat,
          publishedAt: formatted,
          badgeText: defaultBadge,
          isLive: true,
          rawDate: dateObj,
          imageUrl: img,
          argumentoVenda: generateJarvisArgument(cat, title, desc),
        });
      });
      return items;
    } catch (e) {
      console.warn("⚠️ Falha ao analisar XML via DOMParser:", e);
    }
  }

  // Fallback com regex
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    const title = (titleMatch ? titleMatch[1] || titleMatch[2] : "").trim();
    if (!title || title.length < 8) continue;

    const descMatch = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);
    const desc = (descMatch ? descMatch[1] || descMatch[2] : "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

    const linkMatch = block.match(/<link>(.*?)<\/link>/);
    const link = (linkMatch ? linkMatch[1] : "").trim();

    const pubDateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = (pubDateMatch ? pubDateMatch[1] : "").trim();

    const cat = categorizeNews(title, desc, defaultCategory);
    const { formatted, dateObj } = parseRelativeTime(pubDate);

    items.push({
      id: `live-${feedName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${idx++}-${Date.now()}`,
      title,
      summary: desc.length > 220 ? desc.slice(0, 220) + "..." : desc || title,
      source: feedName,
      sourceUrl: link || "https://agenciabrasil.ebc.com.br",
      category: cat,
      publishedAt: formatted,
      badgeText: defaultBadge,
      isLive: true,
      rawDate: dateObj,
      argumentoVenda: generateJarvisArgument(cat, title, desc),
    });
  }

  return items;
}

/**
 * Busca notícias ao vivo com alta vazão de feeds e curadoria profunda de mercado
 */
export async function fetchDailyNews(forceRefresh = false): Promise<{
  items: DailyNewsItem[];
  rates: MarketRates;
  lastUpdated: Date;
}> {
  // 1. Tentar ler do Cache local se não for forçado
  if (!forceRefresh && typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < CACHE_TTL_MS && Array.isArray(parsed.items) && parsed.items.length > 15) {
          return {
            items: parsed.items,
            rates: parsed.rates || DEFAULT_MARKET_RATES,
            lastUpdated: new Date(parsed.timestamp),
          };
        }
      }
    } catch (e) {
      console.warn("⚠️ Falha ao ler cache local de notícias:", e);
    }
  }

  // 2. Buscar Feeds RSS (combinando feeds diretos com CORS e secundários)
  const liveItems: DailyNewsItem[] = [];
  const seenTitles = new Set<string>();

  const feedPromises = LIVE_FEEDS.map(async (feed) => {
    try {
      if (feed.corsDirect) {
        // Fetch direto sem proxy (Agência Brasil EBC e Câmara dos Deputados)
        const res = await fetch(feed.url, {
          cache: "no-store",
          signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(4500) : undefined,
        });
        if (!res.ok) return [];
        const xmlText = await res.text();
        return parseXmlToItems(xmlText, feed.name, feed.defaultBadge, feed.categoryDefault);
      } else {
        // Fetch via proxy conversor com timeout curto
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
        const res = await fetch(proxyUrl, {
          cache: "no-store",
          signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
        });
        if (!res.ok) return [];
        const json = await res.json();
        if (!json || !Array.isArray(json.items)) return [];

        return json.items.slice(0, 8).map((raw: any, idx: number) => {
          const title = (raw.title || "").trim();
          const rawDesc = (raw.description || "").replace(/<[^>]*>?/gm, " ").trim();
          const cat = categorizeNews(title, rawDesc, feed.categoryDefault);
          const { formatted, dateObj } = parseRelativeTime(raw.pubDate);

          return {
            id: `live-${feed.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${idx}-${Date.now()}`,
            title,
            summary: rawDesc.length > 220 ? rawDesc.slice(0, 220) + "..." : rawDesc,
            source: feed.name,
            sourceUrl: raw.link || "https://g1.globo.com",
            category: cat,
            publishedAt: formatted,
            badgeText: feed.defaultBadge,
            isLive: true,
            rawDate: dateObj,
            imageUrl: raw.enclosure?.link || raw.thumbnail || undefined,
            argumentoVenda: generateJarvisArgument(cat, title, rawDesc),
          } as DailyNewsItem;
        });
      }
    } catch {
      return [];
    }
  });

  const [settledFeeds, liveRates] = await Promise.all([
    Promise.allSettled(feedPromises),
    fetchLiveMarketRates(),
  ]);

  for (const result of settledFeeds) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      for (const item of result.value) {
        const normalized = item.title.toLowerCase().trim();
        if (!seenTitles.has(normalized) && normalized.length > 8) {
          seenTitles.add(normalized);
          liveItems.push(item);
        }
      }
    }
  }

  // Ordenar notícias ao vivo pelas mais recentes
  liveItems.sort((a, b) => {
    const timeA = a.rawDate ? a.rawDate.getTime() : 0;
    const timeB = b.rawDate ? b.rawDate.getTime() : 0;
    return timeB - timeA;
  });

  // Mesclar notícias ao vivo com toda a curadoria rica de benchmarks
  const finalItems = [...liveItems, ...BENCHMARK_DAILY_NEWS];

  const now = new Date();

  // Salvar no localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: now.getTime(),
          items: finalItems,
          rates: liveRates,
        })
      );
    } catch (e) {
      // ignore storage quota error
    }
  }

  return {
    items: finalItems,
    rates: liveRates,
    lastUpdated: now,
  };
}

/**
 * Monta o roteiro em áudio do Briefing Executivo diário para o Jarvis narrar
 * Personalizado conforme a aba ativa ou visão geral
 */
export function getDailyBriefingScript(
  items: DailyNewsItem[],
  rates: MarketRates = DEFAULT_MARKET_RATES,
  userName = "Fabrício",
  category: DailyNewsCategory = "todas"
): string {
  const saudacao = obterSaudacaoTempo().saudacaoCapitalizada;
  const firstName = userName.split(" ")[0] || "Fabrício";

  // Briefing específico de Mercado Imobiliário
  if (category === "imobiliario") {
    const imobNews = items.filter((i) => i.category === "imobiliario");
    const manchete = imobNews[0]?.title || "a valorização do metro quadrado e do INCC segue acelerando nas capitais";
    return `
      Fala, ${firstName}! ${saudacao}. Jarvis na área com o radar exclusivo do Mercado Imobiliário.
      Hoje o INCC está em torno de ${rates.incc.toFixed(2).replace(".", ",")} por cento ao ano.
      A principal manchete do setor é: ${manchete}.
      A sua grande sacada comercial para os clientes que querem comprar, construir ou reformar é clara: os bancos estão exigindo até 30% de entrada à vista e cobrando juros que dobram o valor do imóvel. Com o consórcio imobiliário SimulaJá, o cliente começa pagando apenas a parcela planejada, tem o crédito corrigido todo ano pelo INCC e não joga dinheiro no lixo bancário. Excelente dia de vendas no setor imobiliário!
    `.replace(/\s+/g, " ").trim();
  }

  // Briefing específico de Veículos & Automotivo
  if (category === "veiculos") {
    const veicNews = items.filter((i) => i.category === "veiculos");
    const manchete = veicNews[0]?.title || "as taxas de financiamento bancário CDC encarecem a troca de carros e frotas";
    return `
      Fala, ${firstName}! ${saudacao}. Jarvis com o boletim especial de Veículos e Frotas.
      A variação da Tabela FIPE está em ${rates.fipeVariacaoSemestral}, com a gasolina comum cotada em média a ${rates.gasolinaMedia.toFixed(2).replace(".", ",")} reais por litro.
      O destaque automotivo do dia: ${manchete}.
      O seu argumento de ouro na mesa do cliente é o plano de meia parcela do consórcio automotivo: o cliente paga metade da parcela até a contemplação para trocar de carro sem sufocar o bolso, economizando mais de 50 mil reais comparado a qualquer financiamento bancário. Vamos acelerar os fechamentos!
    `.replace(/\s+/g, " ").trim();
  }

  // Briefing de Política & Congresso
  if (category === "politica") {
    const polNews = items.filter((i) => i.category === "politica");
    const manchete = polNews[0]?.title || "em Brasília o Congresso e ministérios debatem regulamentações tributárias e crédito sustentável";
    return `
      Fala, ${firstName}! ${saudacao}. Jarvis com o radar político de Brasília.
      Nos corredores do Congresso Nacional e do Planalto, a manchete em destaque é: ${manchete}.
      Para a nossa consultoria, a mensagem de confiança é total: o consórcio opera sob regime especial protegido pela Lei Federal 11.795 fiscalizada pelo Banco Central do Brasil, garantindo solidez jurídica absoluta para os seus clientes investirem sem sustos.
    `.replace(/\s+/g, " ").trim();
  }

  // Briefing de Finanças & Valores do Mercado
  if (category === "financas" || category === "valores") {
    const finNews = items.filter((i) => i.category === "financas" || i.category === "valores");
    const manchete = finNews[0]?.title || "o mercado financeiro monitora as decisões do COPOM sobre juros e inflação";
    return `
      Fala, ${firstName}! ${saudacao}. Jarvis trazendo as cotações e o radar financeiro de hoje.
      A Taxa Selic está em ${rates.selic.toFixed(2).replace(".", ",")} por cento ao ano, com o dólar comercial girando em ${rates.dolar.toFixed(2).replace(".", ",")} reais e o IPCA em ${rates.ipca.toFixed(2).replace(".", ",")}.
      O principal movimento econômico de hoje: ${manchete}.
      Com o dinheiro caro nos bancos, o consórcio é a alavanca matemática mais inteligente para fugir dos juros e construir patrimônio sólido.
    `.replace(/\s+/g, " ").trim();
  }

  // Briefing Geral Executivo
  const imob = items.filter((i) => i.category === "imobiliario")[0]?.title || "o mercado imobiliário mantém valorização contínua do metro quadrado";
  const veic = items.filter((i) => i.category === "veiculos")[0]?.title || "os juros de financiamento bancário automotivo pesam no bolso dos motoristas";
  const pol = items.filter((i) => i.category === "politica")[0]?.title || "o Congresso Nacional foca na pauta de reformas e crédito";

  return `
    Fala, ${firstName}! ${saudacao}. Jarvis por aqui com o Briefing Executivo Geral do Dia.
    
    Olhando para os números agora: Taxa Selic em ${rates.selic.toFixed(2).replace(".", ",")} por cento ao ano, dólar comercial cotado a ${rates.dolar.toFixed(2).replace(".", ",")} reais e a gasolina média nacional em ${rates.gasolinaMedia.toFixed(2).replace(".", ",")} reais.
    
    No Mercado Imobiliário: ${imob}.
    No Setor Automotivo: ${veic}.
    E em Brasília na Política: ${pol}.
    
    A grande sacada comercial pra você hoje é direta: com os juros bancários cobrando o dobro do bem, o consórcio com meia parcela e sem juros compostos é o seu maior trunfo para fechar clientes em imóveis e veículos. Vamos pra cima e ótimos negócios!
  `.replace(/\s+/g, " ").trim();
}

/**
 * Responde perguntas pontuais do usuário no Jarvis HUD sobre notícias, imóveis, veículos, preços e política
 */
export function getNewsAnswerForJarvis(
  query: string,
  items: DailyNewsItem[],
  rates: MarketRates = DEFAULT_MARKET_RATES
): string {
  const lower = query.toLowerCase();

  // Imóveis / Mercado Imobiliário
  if (lower.includes("imóvel") || lower.includes("imoveis") || lower.includes("imobiliário") || lower.includes("imobiliario") || lower.includes("construção") || lower.includes("incc")) {
    const newsImob = items.filter((i) => i.category === "imobiliario");
    const manchete = newsImob[0]?.title || "Valorização contínua do metro quadrado e avanço do INCC";
    return `Fabrício, no radar do Mercado Imobiliário de hoje: o INCC está acumulado em ${rates.incc.toFixed(2).replace(".", ",")}% e a manchete mais quente é: "${manchete}". O gatilho para os seus clientes é pontual: quem adia a compra paga 10% mais caro ano que vem. Com o consórcio imobiliário, a carta acompanha o INCC todo ano e preserva o poder de compra integral sem juros bancários.`;
  }

  // Veículos / Automotivo / FIPE / Carros
  if (lower.includes("carro") || lower.includes("veículo") || lower.includes("veiculo") || lower.includes("frot") || lower.includes("fipe") || lower.includes("gasolina") || lower.includes("etanol")) {
    const newsVeic = items.filter((i) => i.category === "veiculos");
    const manchete = newsVeic[0]?.title || "Juros do financiamento CDC bancário ultrapassam 24% ao ano";
    return `Fabrício, no setor automotivo hoje: a Tabela Fipe tem variação de ${rates.fipeVariacaoSemestral} e a gasolina comum média no país está em R$ ${rates.gasolinaMedia.toFixed(2).replace(".", ",")}/L. O destaque do dia é: "${manchete}". O consórcio automotivo com meia parcela até a contemplação é o seu maior trunfo para o cliente trocar de carro sem jogar dinheiro fora no CDC bancário.`;
  }

  // Preços, taxas, inflação, dólar, selic
  if (
    lower.includes("preço") ||
    lower.includes("preco") ||
    lower.includes("taxa") ||
    lower.includes("selic") ||
    lower.includes("inflação") ||
    lower.includes("inflacao") ||
    lower.includes("dolar") ||
    lower.includes("dólar") ||
    lower.includes("cotação")
  ) {
    return `Olha só, Fabrício: falando de valores de mercado e indicadores hoje, a Selic se mantém em ${rates.selic.toFixed(2).replace(".", ",")}% ao ano, e o dólar comercial tá girando em torno de R$ ${rates.dolar.toFixed(2).replace(".", ",")}, com o euro em R$ ${rates.euro.toFixed(2).replace(".", ",")}. Com esse patamar, os bancos cobram CET abusivo nos financiamentos tradicionais, tornando o consórcio SimulaJá a alternativa matemática mais vantajosa para o cliente.`;
  }

  // Política
  if (lower.includes("politica") || lower.includes("política") || lower.includes("governo") || lower.includes("congresso") || lower.includes("brasília") || lower.includes("brasilia")) {
    const newsPolitica = items.filter((i) => i.category === "politica").slice(0, 2);
    const titulos = newsPolitica.map((n) => `"${n.title}"`).join(". E também: ");
    return `Fabrício, no radar político de hoje os principais destaques são: ${titulos || "as votações e negociações orçamentárias no Congresso Nacional"}. No nosso setor de consórcios, a regulamentação pelo Banco Central segue 100% sólida e garante total segurança aos consorciados.`;
  }

  // Briefing geral
  return getDailyBriefingScript(items, rates, "Fabrício", "todas");
}
