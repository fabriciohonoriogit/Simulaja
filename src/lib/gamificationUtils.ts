import { Patente, PATENTES_CONFIG } from '../types/gamification';
import { isLeadIndicacao } from './lojasService';

/**
 * Calcula a comissão recorrente mensal baseada na fórmula fornecida
 * Comissão Mensal = (Valor Vendido × Taxa de Comissão) ÷ 10
 */
export function calcularComissaoMensal(valorVendido: number, taxaComissaoPercentual: number): number {
  if (!valorVendido || !taxaComissaoPercentual) return 0;
  const taxaDecimal = taxaComissaoPercentual / 100;
  return (valorVendido * taxaDecimal) / 10;
}

/**
 * Calcula a comissão recorrente mensal de um único lead,
 * aplicando regras específicas de administradoras (ex: Indicação Filial Magalu, Ademicon).
 */
export function calcularComissaoRecorrenteLead(lead: any): number {
  const valorVendido = Number(lead.valor_credito || lead.valor_estimado || 0);
  if (!valorVendido) return 0;

  const dc = lead.dados_cadastro || {};
  const administradora = (lead.administradora || dc.administradora || "").toUpperCase();
  const tipo = (lead.tipo_consorcio || dc.tipo_consorcio || "").toLowerCase();
  const regra = (lead.comissao_regra || lead.regra_comissao || dc.comissao_regra || dc.regra_comissao || "").toUpperCase();
  const clienteNome = (lead.nome || lead.cliente_nome || dc.nome_cliente || dc.nome || "").toLowerCase();
  const filialInfo = (dc.filial || dc.filial_nome || dc.loja || dc.unidade || lead.origem || dc.origem || "").toLowerCase();
  const cidadeInfo = (lead.cidade || dc.cidade || "").toLowerCase();

  // Detecção de Indicação de Filial Magalu (0.80% em 4x linear)
  // Inclui: regra explícita INDICACAO_MAGALU, cliente Valdinei, filial/cidade São Mateus do Sul (927) ou indicações Magalu
  const isIndicacaoFilial = 
    regra === "INDICACAO_MAGALU" ||
    clienteNome.includes("valdinei") ||
    filialInfo.includes("sao mateus") || filialInfo.includes("são mateus") || filialInfo.includes("927") ||
    cidadeInfo.includes("sao mateus") || cidadeInfo.includes("são mateus") ||
    (administradora === "MAGALU" && isLeadIndicacao(lead));

  if (isIndicacaoFilial) {
    const comissaoTotal = valorVendido * 0.008; // 0.80%
    return comissaoTotal / 4;
  }

  // Se o lead possui taxa_comissao e parcelas_comissao gravados explicitamente no objeto
  if (lead.taxa_comissao && lead.parcelas_comissao) {
    const comissaoTotal = (valorVendido * Number(lead.taxa_comissao)) / 100;
    return comissaoTotal / Number(lead.parcelas_comissao);
  }

  // Regra Específica: ADEMICON
  if (administradora === "ADEMICON") {
    const comissaoTotal = valorVendido * 0.025; // 2.5%
    // 13x para Veículos (inclui moto, pesados, agricolas)
    if (["veiculo", "moto", "pesados", "agricolas"].includes(tipo)) {
      return comissaoTotal / 13;
    }
    // 15x para Imóveis e Investimentos
    return comissaoTotal / 15;
  }

  // Regra Padrão: 4% em 10x
  return calcularComissaoMensal(valorVendido, 4);
}

/**
/**
 * Retorna a patente com base no valor da venda mensal
 */
export function obterPatentePorVenda(vendaMensal: number): Patente {
  if (vendaMensal < PATENTES_CONFIG['GOLD'].min) return 'STONE';
  if (vendaMensal < PATENTES_CONFIG['CROMO'].min) return 'GOLD';
  if (vendaMensal < PATENTES_CONFIG['TITÂNIO'].min) return 'CROMO';
  if (vendaMensal < PATENTES_CONFIG['PLATINA'].min) return 'TITÂNIO';
  if (vendaMensal < PATENTES_CONFIG['DIAMANTE'].min) return 'PLATINA';
  return 'DIAMANTE';
}

/**
 * Mantém compatibilidade com funções antigas baseadas em comissão
 */
export function obterPatentePorComissao(comissaoMensal: number): Patente {
  // Conversão aproximada para manter retrocompatibilidade
  return obterPatentePorVenda(comissaoMensal * 250);
}

/**
 * Retorna o progresso (0 a 100) para a próxima patente
 */
export function calcularProgressoProximaPatente(vendaMensal: number, patenteAtual: Patente): number {
  const config = PATENTES_CONFIG[patenteAtual] || PATENTES_CONFIG['STONE'];
  if (!config.next) return 100; // DIAMANTE (Max level)

  const min = config.min;
  const max = config.max;
  
  // Tratamento para evitar divisão por zero se algo estiver errado
  if (max === min) return 100;

  let progressoBase = vendaMensal - min;
  if (progressoBase < 0) progressoBase = 0;
  
  const intervalo = (max + 1) - min;
  
  let percentual = (progressoBase / intervalo) * 100;
  
  if (percentual > 100) percentual = 100;
  if (percentual < 0) percentual = 0;
  
  return Math.round(percentual);
}

/**
 * Analisa leads e retorna estimativa de dinheiro deixado na mesa.
 * Aqui simulamos uma busca simples. Em produção, isso iteraria sobre os leads reais.
 */
export function analisarDinheiroNaMesa(leadsSemContato: any[] = []) {
  const leadsQuentes = leadsSemContato.filter(l => {
    // Exclui fechados, perdidos e mortos
    if (['fechado', 'venda_fechada', 'perdido', 'morto'].includes(l.status)) return false;

    // Considera "dinheiro na mesa" leads quentes ou em fases quentes
    const isHotStatus = ['proposta', 'simulacao_enviada', 'negociacao'].includes(l.status);
    const isHotTemp = l.lead_temperatura === 'quente';
    
    // Consideramos "esquecidos" (na mesa) leads sem interacao nos ultimos 2 dias
    let isEsquecido = false;
    if (l.last_interaction_at) {
      const diasSemContato = (Date.now() - new Date(l.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24);
      isEsquecido = diasSemContato > 2;
    } else if (l.created_at) {
      const diasCriado = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
      isEsquecido = diasCriado > 2;
    } else {
      isEsquecido = true;
    }

    return (isHotStatus || isHotTemp) && isEsquecido;
  });
  
  const potencialVendas = leadsQuentes.reduce((acc, l) => acc + Number(l.valor_credito || l.valor_estimado || 0), 0);
  
  // Agora calcula a comissão potencial iterando por cada lead e suas regras
  const potencialComissaoMensal = leadsQuentes.reduce((acc, l) => acc + calcularComissaoRecorrenteLead(l), 0);

  return {
    quantidadeLeads: leadsQuentes.length,
    potencialVendas,
    potencialComissaoMensal
  };
}
