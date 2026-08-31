import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$0,00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$0,00";
  
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/\u00a0/g, "").replace("R$", "R$");
}

/**
 * Especial para Leads: Trata o valor 1 como 0.
 * Comum em dados importados que usam 1 como placeholder.
 */
export function formatLeadValue(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value || 0);
  if (num === 1) return formatCurrency(0);
  return formatCurrency(num);
}

/** Converte valor formatado em BRL (ex: "R$ 110.000,00") para number */
export function parseBRLValue(v: unknown): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Verifica se um status ou lead possui estado de venda fechada/ganha */
export function isClosedStatus(status: string | null | undefined, lead?: any): boolean {
  if (lead?.dados_cadastro?.data_venda || lead?.dados_cadastro?.data_fechamento || lead?.data_adesao) {
    return true;
  }
  if (!status) return false;
  const s = String(status).toLowerCase().replace(/_/g, " ").replace(/-/g, " ").trim();
  const closedTerms = [
    "fechado", "fechada", "venda fechada", "venda_fechada", "contrato assinado", 
    "contrato_assinado", "comissao paga", "comissao_paga", "ganho", "venda realizada", 
    "venda", "vendas", "concluido", "concluida", "finalizado", "finalizada", "contrato"
  ];
  return closedTerms.some(term => s === term || s.includes(term));
}

/** Extrai e converte o valor numérico do crédito/venda do lead de forma segura */
export function getLeadValue(lead: any): number {
  if (!lead) return 0;
  const dc = lead.dados_cadastro || {};
  const raw = lead.valor_credito ?? lead.valor_venda ?? lead.valor_estimado ?? dc.valor_credito ?? dc.valor_venda ?? dc.valor_estimado ?? 0;
  return parseBRLValue(raw);
}

/**
 * Verifica se um lead representa uma venda realizada no mês de referência.
 * Exclui vendas retroativas, rascunhos, shadow e verifica a data real de fechamento.
 */
export function isVendaRealizadaNoMes(lead: any, targetMonthStr: string): boolean {
  if (!lead) return false;
  
  const dc = lead.dados_cadastro || {};
  if (!isClosedStatus(lead.status, lead)) return false;

  const isShadow = lead.origem === "carteira_shadow";
  if (isShadow) return false;

  // Se houver data explícita de venda cadastrada (data_venda ou data_fechamento), valida a data
  if (dc.data_venda || dc.data_fechamento) {
    const explicitDate = dc.data_venda || dc.data_fechamento;
    const saleMonth = String(explicitDate).substring(0, 7);
    return saleMonth === targetMonthStr || !targetMonthStr;
  }

  // Leads com status de venda fechada no CRM são considerados vendas ativas no mês
  return true;
}

