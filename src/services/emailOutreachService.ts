/**
 * ==============================================================================
 * SIMULAJÁ CRM • SERVIÇO DE PROSPECÇÃO & CADÊNCIA POR E-MAIL
 * ==============================================================================
 */

import { Lead } from "@/types/funil";
import { formatCurrency } from "@/lib/utils";

export interface CadenciaStep {
  step: 1 | 2 | 3;
  name: string;
  tag: string;
  delayDays: number;
  subject: string;
  body: string;
}

export const CADENCIA_EMAIL_STEPS: Record<number, CadenciaStep> = {
  1: {
    step: 1,
    name: "Passo 1: Abertura Consultiva & Alavancagem",
    tag: "D+0 (Abertura)",
    delayDays: 0,
    subject: "{Oportunidade para|Estratégia de} alavancagem patrimonial em {{cidade}}?",
    body: `Olá, {{nome_primeiro}}, {tudo bem?|como vai?|espero que esteja tendo uma ótima semana!}

{Acompanho o mercado imobiliário e empresarial|Identifiquei o perfil da sua empresa/atuação} na região de {{cidade}} e percebo que muitos empresários e investidores ainda utilizam financiamento bancário tradicional para aquisição de imóveis, frotas ou capital para expansão, pagando taxas e CET que quase dobram o custo final do projeto.

Na Prospera Plan (parceira autorizada Consórcio Magalu), estruturamos operações de crédito a partir de {{valor_credito}} com custo financeiro médio diluído de apenas 1,2% a 1,8% ao ano — representando frequentemente uma economia de mais de 50% em comparação com qualquer linha bancária tradicional.

Faria sentido nos falarmos rapidamente por 5 minutinhos nesta semana para eu te apresentar um comparativo objetivo para o seu momento?

{Um grande abraço|Atenciosamente},
Fabrício Honorio
Gestor de Planejamento Patrimonial | Prospera Plan & Consórcio Magalu
WhatsApp: (11) 98765-4321
E-mail: gn_prosperaplan@consorciomagalu.com.br`,
  },
  2: {
    step: 2,
    name: "Passo 2: Estudo de Caso & Matemática de Economia",
    tag: "D+3 (Follow-up de Valor)",
    delayDays: 3,
    subject: "Re: {{nome_primeiro}}, {comparativo prático|estudo de caso}: Consórcio vs Financiamento",
    body: `Olá, {{nome_primeiro}}, {tudo bem por aí?|espero que esteja tudo bem!}

{Passei rapidamente apenas para compartilhar|Quis te enviar um número rápido e direto}:

Recentemente, desenhamos uma operação de crédito no valor de {{valor_credito}} para um cliente aqui no estado. Ao invés do financiamento bancário padrão (com CET na casa de 12,8% a.a.), ele utilizou nossa estratégia de contemplação planejada com lance embutido no Consórcio Magalu.

O resultado? Uma economia real calculada em mais de R$ 130.000 em juros que não saíram do caixa dele.

Preparei uma lâmina executiva de 1 página com esse comparativo passo a passo. Gostaria que eu te enviasse uma cópia em PDF por aqui ou pelo WhatsApp?

{Um grande abraço|Cordialmente},
Fabrício Honorio
Prospera Plan | Consórcio Magalu
(11) 98765-4321`,
  },
  3: {
    name: "Passo 3: Break-up Elegante & Última Tentativa",
    step: 3,
    tag: "D+7 (Break-up)",
    delayDays: 4,
    subject: "{Devo encerrar meu contato por aqui|Encerrando meus contatos}, {{nome_primeiro}}?",
    body: `Olá, {{nome_primeiro}}, {tudo bem?|como vai?}

Imagino que sua rotina esteja bastante corrida ou que alavancagem patrimonial e consórcio estratégico não sejam sua prioridade neste momento — e está tudo bem!

Como prezo pelo respeito à sua caixa de entrada, este será meu último e-mail sobre o assunto para não ser inconveniente.

Se mais adiante fizer sentido analisar uma compra planejada de imóvel, veículo ou investimento empresarial com juro zero, minhas informações de contato direto ficam registradas abaixo.

{Desejo muito sucesso e excelentes negócios!|Desejo ótimos resultados na sua jornada!}

Atenciosamente,
Fabrício Honorio
Gestor Comercial | Prospera Plan & Consórcio Magalu
gn_prosperaplan@consorciomagalu.com.br`,
  },
};

export function parseSpintaxClient(text: string): string {
  if (!text) return "";
  let result = text;
  const regex = /\{([^{}]+?\|[^{}]+?)\}/;
  let match;
  let iterations = 0;
  while ((match = regex.exec(result)) !== null && iterations < 30) {
    iterations++;
    const options = match[1].split("|");
    const chosen = options[Math.floor(Math.random() * options.length)].trim();
    result = result.replace(match[0], chosen);
  }
  return result;
}

export function renderOutreachEmail(template: string, lead: Lead): string {
  const nomePrimeiro = lead.nome ? lead.nome.trim().split(/\s+/)[0] : "Prezado(a)";
  const cidade = lead.cidade?.trim() || "sua região";
  const valorCredito = lead.valor_credito
    ? formatCurrency(typeof lead.valor_credito === "number" ? lead.valor_credito : parseFloat(String(lead.valor_credito)) || 500000)
    : "R$ 500.000";

  const raw = template
    .replace(/\{\{nome_primeiro\}\}/g, nomePrimeiro)
    .replace(/\{\{nome\}\}/g, lead.nome || "Cliente")
    .replace(/\{\{cidade\}\}/g, cidade)
    .replace(/\{\{valor_credito\}\}/g, valorCredito);

  return parseSpintaxClient(raw);
}

/**
 * Calcula a fila de prospecção com base nos leads fornecidos
 */
export function calculateOutreachQueue(leads: Lead[]) {
  const step1: Lead[] = [];
  const step2: Lead[] = [];
  const step3: Lead[] = [];
  const completed: Lead[] = [];

  for (const lead of leads) {
    if (!lead.email || !lead.email.includes("@")) continue;
    if (["venda_fechada", "fechado", "perdido", "descartado"].includes(lead.status || "")) continue;

    // Se não tem último contato registrado, entra no Passo 1
    if (!lead.ultimo_contato) {
      step1.push(lead);
      continue;
    }

    const lastDate = new Date(lead.ultimo_contato).getTime();
    const daysSince = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);

    if (daysSince >= 7) {
      step3.push(lead);
    } else if (daysSince >= 3) {
      step2.push(lead);
    } else {
      completed.push(lead); // aguardando janela de tempo
    }
  }

  return { step1, step2, step3, completed, totalEligible: step1.length + step2.length + step3.length };
}

/**
 * Exporta a lista de leads em formato CSV para a pasta de automação diária
 */
export function exportLeadsToCSV(leads: Lead[]): string {
  const valid = leads.filter((l) => l.email && l.email.includes("@"));
  const header = "nome,email,cidade,valor_credito,tipo_consorcio,celular\n";
  const rows = valid
    .map((l) => {
      const nome = `"${(l.nome || "").replace(/"/g, '""')}"`;
      const email = `"${(l.email || "").replace(/"/g, '""')}"`;
      const cidade = `"${(l.cidade || "").replace(/"/g, '""')}"`;
      const valor = l.valor_credito || 500000;
      const tipo = `"${(l.tipo_consorcio || "IMOBILIARIO").replace(/"/g, '""')}"`;
      const celular = `"${(l.celular || "").replace(/"/g, '""')}"`;
      return `${nome},${email},${cidade},${valor},${tipo},${celular}`;
    })
    .join("\n");

  return header + rows;
}
