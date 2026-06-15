import { Patente, PATENTES_CONFIG } from '../types/gamification';

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
 * Retorna a patente com base no valor da comissão mensal
 */
export function obterPatentePorComissao(comissaoMensal: number): Patente {
  if (comissaoMensal < PATENTES_CONFIG['JÚNIOR'].min) return 'BABY';
  if (comissaoMensal < PATENTES_CONFIG['PRO'].min) return 'JÚNIOR';
  if (comissaoMensal < PATENTES_CONFIG['ESPECIALISTA'].min) return 'PRO';
  if (comissaoMensal < PATENTES_CONFIG['ELITE'].min) return 'ESPECIALISTA';
  if (comissaoMensal < PATENTES_CONFIG['LENDA'].min) return 'ELITE';
  return 'LENDA';
}

/**
 * Retorna o progresso (0 a 100) para a próxima patente
 */
export function calcularProgressoProximaPatente(comissaoMensal: number, patenteAtual: Patente): number {
  const config = PATENTES_CONFIG[patenteAtual];
  if (!config.next) return 100; // LENDA (Max level)

  const min = config.min;
  const max = config.max;
  
  // Tratamento para evitar divisão por zero se algo estiver errado
  if (max === min) return 100;

  let progressoBase = comissaoMensal - min;
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
  // Assumindo taxa média de 4% se não tivermos no lead
  const potencialComissaoMensal = calcularComissaoMensal(potencialVendas, 4); 

  return {
    quantidadeLeads: leadsQuentes.length,
    potencialVendas,
    potencialComissaoMensal
  };
}
