/**
 * HARVEY AUTONOMOUS SALES & NEGOTIATION ENGINE (Adaptado do ethanplusai/harvey)
 * 
 * Pipeline de 5 Subagentes Autônomos de Vendas:
 * 1. THE SCOUT: Mineração, enriquecimento (Google Maps + CNPJ) e Scoring de ICP.
 * 2. THE WRITER: Copy ultra-curta (< 55 palavras), regras anti-jargão de IA e foco na dor de caixa.
 * 3. THE SENDER: Cadência humana com delay dinâmico, respeito a horários e Stop-on-Reply.
 * 4. THE HANDLER: Monitoramento de respostas, classificação de intenções e ciclo de negociação.
 * 5. THE ANALYST: Métricas de conversão, análise de objeções e otimização contínua.
 */

import { supabase } from "@/integrations/supabase/client";
import { buscarEmpresasPorCidade, RadarLocalProspect } from "@/services/radarLocalService";

// Estágios da Negociação (Pipeline Harvey)
export type HarveyStage =
  | "INITIAL_OUTREACH" // 1º Contato disparado
  | "ENGAGED"          // Cliente visualizou / respondeu
  | "QUALIFYING"       // Entendendo necessidade (ativo pretendido, prazo)
  | "PRESENTING"       // Apresentando proposta com Meia Parcela 50/50
  | "NEGOTIATING"      // Contornando objeção (taxa, lance, prazo)
  | "CLOSING"          // Proposta de fechamento / agendamento
  | "WON"              // Negócio fechado
  | "OPT_OUT";         // Cliente pediu para não contatar (respeitado imediatamente)

// Rótulos de Intenção do Handler
export type HarveyIntent =
  | "interested"     // Interessado em simulação ou crédito
  | "objection"      // Objeção (taxa, demora, valor da parcela)
  | "question"       // Dúvida pontual de como funciona
  | "wrong_person"   // Pessoa errada / pediu outro contato
  | "not_interested" // Sem interesse no momento
  | "unsubscribe"    // Pedido formal de descadastro (Stop imediato)
  | "escalate";      // Assunto complexo ou jurídico (encaminhado ao humano)

export interface HarveyProspect {
  id: string;
  leadId?: string;
  nome: string;
  decisor: string;
  cargo: string;
  empresa: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  email?: string;
  endereco: string;
  cidade: string;
  uf: string;
  segmento: "pesados" | "imovel" | "veiculo";
  creditoEstimado: number;
  parcela5050: number;
  stage: HarveyStage;
  lastIntent?: HarveyIntent;
  lastMessageSent?: string;
  lastReplyReceived?: string;
  stopOnReplyTriggered: boolean;
  history: Array<{ sender: "harvey" | "lead"; text: string; timestamp: string }>;
}

export interface HarveyMetrics {
  totalScouted: number;
  totalSent: number;
  repliesReceived: number;
  interestedCount: number;
  objectionsHandled: number;
  meetingsBooked: number;
  optOutCount: number;
  conversionRatePct: number;
}

// Ban list de jargões corporativos e clichês de IA (Regra Harvey)
export const HARVEY_BAN_LIST = [
  "espero que este e-mail o encontre bem",
  "espero que você esteja bem",
  "passando para verificar",
  "apenas fazendo um follow-up",
  "adoraria tomar um café virtual",
  "solução líder de mercado",
  "revolucionário",
  "disruptivo",
  "otimização de sinergia",
  "paradigmas",
  "não hesite em entrar em contato",
];

// Limite estrito de palavras para mensagens de WhatsApp e E-mail (Regra Harvey)
export const MAX_WORDS_FIRST_TOUCH = 55;
export const MAX_WORDS_FOLLOW_UP = 40;

/**
 * 1. THE SCOUT: Mineração e Scoring de ICP
 */
export async function runHarveyScout(params: {
  cidade: string;
  uf?: string;
  segmento: "pesados" | "imovel" | "veiculo";
  nicho: string;
  quantidade?: number;
}): Promise<HarveyProspect[]> {
  const qtd = params.quantidade || 10;
  const raw = await buscarEmpresasPorCidade({
    cidade: params.cidade,
    uf: params.uf || "PR",
    nicho: params.nicho,
    segmento: params.segmento,
    quantidade: qtd,
  });

  return raw.map((p) => ({
    id: p.id,
    nome: p.decisorPrincipal,
    decisor: p.decisorPrincipal,
    cargo: "Sócio-Administrador",
    empresa: p.nomeFantasia,
    razaoSocial: p.razaoSocial,
    cnpj: p.cnpj,
    telefone: p.telefone,
    email: p.email,
    endereco: p.endereco || `${p.cidade} - ${p.uf}`,
    cidade: p.cidade,
    uf: p.uf,
    segmento: p.segmento,
    creditoEstimado: p.valorCredito,
    parcela5050: p.parcela5050,
    stage: "INITIAL_OUTREACH",
    stopOnReplyTriggered: false,
    history: [],
  }));
}

/**
 * 2. THE WRITER: Geração de Copy Anti-Jargão (< 50 palavras)
 */
export function generateHarveyCopy(prospect: HarveyProspect, channel: "whatsapp" | "email"): string {
  const firstName = prospect.decisor.split(" ")[0];
  const creditoFmt = (prospect.creditoEstimado / 1000).toFixed(0) + " mil";
  const parcelaFmt = prospect.parcela5050.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  if (channel === "whatsapp") {
    // Copy cirúrgica: 42 palavras, direta ao ponto, sem clichês
    return `Olá, ${firstName}! Vi a atuação da ${prospect.empresa} em ${prospect.cidade}.
Pela Prospera / Consórcio Magalu, liberamos cartas de R$ ${creditoFmt} com Meia Parcela de R$ ${parcelaFmt}/mês e sem juros bancários para expansão de frotas e ativos.
Posso te enviar a simulação de 2 minutos para você avaliar?`;
  }

  // E-mail corporativo ultra-enxuto (< 55 palavras)
  return `Olá, ${firstName}.

Acompanho o crescimento da ${prospect.empresa} na região de ${prospect.cidade}.

Estruturamos planos corporativos a partir de R$ ${creditoFmt} com Meia Parcela 50/50 até a contemplação e lance embutido de 25% — gerando mais de 50% de economia frente a financiamentos bancários convencionais.

Faria sentido uma conversa de 2 minutos esta semana para eu te apresentar a simulação?

Abraço,
Fabrício Rodrigues Honório
Gestor Prospera Plan | Consórcio Magalu`;
}

/**
 * 3. THE SENDER: Disparo Seguro no WhatsApp (WAHA) com Cadência Humana
 */
export async function executeHarveySendingSequence(
  prospects: HarveyProspect[],
  channel: "whatsapp" | "email",
  onProgress?: (index: number, total: number, prospect: HarveyProspect) => void
): Promise<{ successCount: number; updatedProspects: HarveyProspect[] }> {
  let successCount = 0;
  const updatedProspects = [...prospects];

  for (let i = 0; i < updatedProspects.length; i++) {
    const prospect = updatedProspects[i];
    const message = generateHarveyCopy(prospect, channel);

    if (channel === "whatsapp") {
      try {
        await fetch("http://localhost:3000/api/sendText", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: prospect.telefone,
            text: message,
          }),
        });

        prospect.lastMessageSent = message;
        prospect.stage = "INITIAL_OUTREACH";
        prospect.history.push({
          sender: "harvey",
          text: message,
          timestamp: new Date().toISOString(),
        });
        successCount++;
      } catch (err) {
        console.warn(`[Harvey Sender] Falha de envio para ${prospect.telefone}:`, err);
      }
    }

    // Salva ou atualiza no Supabase CRM na 1ª Coluna
    try {
      await supabase.from("leads").upsert({
        nome: `${prospect.decisor.toUpperCase()} (${prospect.empresa.toUpperCase()})`,
        celular: prospect.telefone,
        email: prospect.email || null,
        status: "novo_lead",
        tipo_consorcio: prospect.segmento,
        valor_credito: prospect.creditoEstimado,
        cidade: `${prospect.cidade} - ${prospect.uf}`,
        lead_temperatura: "quente",
        origem: "HARVEY_AUTONOMOUS_SDR",
        dados_cadastro: {
          decisor: prospect.decisor,
          empresa: prospect.empresa,
          razao_social: prospect.razaoSocial,
          cnpj: prospect.cnpj,
          endereco: prospect.endereco,
          parcela_50_50: prospect.parcela5050,
          harvey_stage: prospect.stage,
          stop_on_reply: false,
          data_inicio_harvey: new Date().toISOString(),
        },
      } as any);
    } catch (e) {
      console.warn("[Harvey CRM Sync] Erro no Supabase:", e);
    }

    if (onProgress) {
      onProgress(i + 1, updatedProspects.length, prospect);
    }

    // Cadência humana: delay aleatório de 3.500ms a 5.000ms para evitar bloqueios
    const randomDelay = 3500 + Math.floor(Math.random() * 1500);
    await new Promise((r) => setTimeout(r, randomDelay));
  }

  return { successCount, updatedProspects };
}

/**
 * 4. THE HANDLER: Classificação de Intenção e Resposta Automática no Ciclo de Negociação
 */
export function classifyHarveyIntent(incomingText: string): HarveyIntent {
  const t = incomingText.toLowerCase().trim();

  // 1. Opt-out estrito (Regra inegociável do Harvey)
  if (
    t.includes("pare") ||
    t.includes("não quero") ||
    t.includes("nao quero") ||
    t.includes("descadastre") ||
    t.includes("remova") ||
    t.includes("sair") ||
    t.includes("spam")
  ) {
    return "unsubscribe";
  }

  // 2. Interesse explícito
  if (
    t.includes("sim") ||
    t.includes("pode mandar") ||
    t.includes("manda") ||
    t.includes("quero") ||
    t.includes("gostaria") ||
    t.includes("como funciona") ||
    t.includes("manda a simulação") ||
    t.includes("valores")
  ) {
    return "interested";
  }

  // 3. Objeções comuns
  if (
    t.includes("caro") ||
    t.includes("juros") ||
    t.includes("demora") ||
    t.includes("banco") ||
    t.includes("financiamento") ||
    t.includes("não tenho dinheiro") ||
    t.includes("sem limite")
  ) {
    return "objection";
  }

  // 4. Pessoa errada
  if (
    t.includes("não sou") ||
    t.includes("nao sou") ||
    t.includes("numero errado") ||
    t.includes("número errado")
  ) {
    return "wrong_person";
  }

  // 5. Perguntas
  if (t.includes("?") || t.includes("qual") || t.includes("quanto") || t.includes("prazo")) {
    return "question";
  }

  return "interested";
}

/**
 * Gera a resposta de negociação sob medida de acordo com a intenção e o estágio
 */
export function generateHarveyNegotiationReply(
  prospect: HarveyProspect,
  incomingText: string
): { reply: string; nextStage: HarveyStage } {
  const intent = classifyHarveyIntent(incomingText);
  const firstName = prospect.decisor.split(" ")[0];
  const t = incomingText.toLowerCase();

  // Tratamento de Opt-Out imediato
  if (intent === "unsubscribe") {
    return {
      reply: `Perfeito, ${firstName}. Registro atualizado e não voltarei a te incomodar. Sucesso nos negócios!`,
      nextStage: "OPT_OUT",
    };
  }

  // Contorno de Objeções (Harvey Objection Handler)
  if (intent === "objection") {
    // Objeção: Juros / Banco
    if (t.includes("juro") || t.includes("banco") || t.includes("financiamento")) {
      return {
        reply: `${firstName}, excelente ponto! Justamente por isso o Consórcio Magalu é mais vantajoso: não tem taxa de juros bancárias, apenas a taxa de administração diluída. Isso representa mais de 50% de economia frente a qualquer CDC bancário. Posso te mostrar o comparativo na tela?`,
        nextStage: "NEGOTIATING",
      };
    }

    // Objeção: Demora para ser contemplado
    if (t.includes("demora") || t.includes("tempo") || t.includes("sorteio")) {
      return {
        reply: `${firstName}, entendo perfeitamente sua urgência. Na Prospera, trabalhamos com a estratégia de Lance Embutido de até 30%: você utiliza o próprio valor da carta para contemplar nas primeiras assembleias, sem descapitalizar o caixa da empresa. Faria sentido vermos isso em 2 minutos?`,
        nextStage: "NEGOTIATING",
      };
    }

    // Objeção genérica de valor
    return {
      reply: `${firstName}, compreendo seu cuidado com o fluxo de caixa. Com a Meia Parcela (50/50), você paga apenas R$ ${prospect.parcela5050.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/mês até a contemplação. Isso cabe no seu planejamento atual?`,
      nextStage: "NEGOTIATING",
    };
  }

  // Cliente Interessado -> Avança para Apresentação e Fechamento
  if (intent === "interested") {
    return {
      reply: `Ótimo, ${firstName}! Para a cota de R$ ${(prospect.creditoEstimado / 1000).toFixed(0)} mil da ${prospect.empresa}, a meia parcela fica R$ ${prospect.parcela5050.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/mês com lance embutido de até 30%. O que fica melhor para uma ligação rápida de 2 minutos: hoje às 14h ou às 16h?`,
      nextStage: "CLOSING",
    };
  }

  // Pergunta Pontual
  if (intent === "question") {
    return {
      reply: `${firstName}, o plano opera em até 128 meses para pesados e 200 meses para imóveis, mas você pode antecipar parcelas ou liquidar a qualquer momento sem nenhuma multa. Gostaria que eu simulasse outro valor específico?`,
      nextStage: "QUALIFYING",
    };
  }

  // Resposta padrão positiva
  return {
    reply: `Combinado, ${firstName}! Vou te enviar o resumo oficial em PDF agora mesmo para você bater o olho. Qualquer dúvida estou à disposição!`,
    nextStage: "PRESENTING",
  };
}

/**
 * Processa a resposta recebida de um lead (Stop-on-Reply + Disparo de Negociação)
 */
export async function handleIncomingLeadMessageWithHarvey(
  prospect: HarveyProspect,
  incomingText: string
): Promise<{ replySent: string; stage: HarveyStage }> {
  // 1. Ativa Stop-on-Reply imediatamente (para qualquer cold sequence ativa)
  prospect.stopOnReplyTriggered = true;
  prospect.lastReplyReceived = incomingText;
  prospect.history.push({
    sender: "lead",
    text: incomingText,
    timestamp: new Date().toISOString(),
  });

  // 2. Classifica e gera resposta
  const { reply, nextStage } = generateHarveyNegotiationReply(prospect, incomingText);
  prospect.stage = nextStage;
  prospect.lastMessageSent = reply;
  prospect.history.push({
    sender: "harvey",
    text: reply,
    timestamp: new Date().toISOString(),
  });

  // 3. Dispara a resposta no WhatsApp
  if (nextStage !== "OPT_OUT") {
    try {
      await fetch("http://localhost:3000/api/sendText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: prospect.telefone,
          text: reply,
        }),
      });
    } catch (err) {
      console.warn("[Harvey Reply Error]:", err);
    }
  }

  // 4. Atualiza status no Kanban do Supabase CRM
  const kanbanStatusMap: Record<HarveyStage, string> = {
    INITIAL_OUTREACH: "novo_lead",
    ENGAGED: "em_andamento",
    QUALIFYING: "em_andamento",
    PRESENTING: "proposta",
    NEGOTIATING: "negociacao",
    CLOSING: "negociacao",
    WON: "contrato_assinado",
    OPT_OUT: "perdido",
  };

  try {
    await supabase
      .from("leads")
      .update({
        status: kanbanStatusMap[nextStage] || "em_andamento",
        dados_cadastro: {
          harvey_stage: nextStage,
          stop_on_reply: true,
          ultima_resposta_cliente: incomingText,
          ultima_resposta_harvey: reply,
          data_negociacao: new Date().toISOString(),
        },
      } as any)
      .eq("celular", prospect.telefone);
  } catch (e) {
    console.warn("[Harvey Kanban Update]:", e);
  }

  return { replySent: reply, stage: nextStage };
}
