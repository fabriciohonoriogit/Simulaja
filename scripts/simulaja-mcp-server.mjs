/**
 * ==============================================================================
 * SIMULAJÁ • MCP SERVER (Model Context Protocol) v1.0.0
 * ==============================================================================
 * Servidor MCP via stdio compatível com a especificação JSON-RPC 2.0.
 * Permite que assistentes de voz externos (ex: Dewiar App, Claude Desktop, Cursor,
 * agentes locais e pipelines de áudio) consultem diretamente o simulador oficial,
 * dados de grupos de consórcio e o sentinela de vagas em tempo real.
 * 
 * USO:
 *   node scripts/simulaja-mcp-server.mjs
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    process.stderr.write(`[SimulaJá MCP] Erro ao inicializar cliente Supabase: ${err.message}\n`);
  }
}

// 1. Carregar base de dados do Simulador
let GRUPOS = {};
let GRUPO_CARACTERISTICAS = {};
let MEDIA_LANCES_GRUPOS = {};
let ESTATISTICAS_LANCES = {};

function carregarDadosSimulador() {
  try {
    const filePath = path.join(ROOT_DIR, 'src', 'constants', 'simulador.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    // Grupos
    const gruposMatch = content.match(/export const GRUPOS:\s*Record<string,\s*GrupoItem\[\]>\s*=\s*(\{[\s\S]*?\n\};)/);
    if (gruposMatch) {
      const code = gruposMatch[1].replace(/;\s*$/, '');
      GRUPOS = eval('(' + code + ')');
    }

    // Características
    const caracMatch = content.match(/export const GRUPO_CARACTERISTICAS:\s*Record<string,\s*GrupoCaracteristicas>\s*=\s*(\{[\s\S]*?\n\};)/);
    if (caracMatch) {
      const code = caracMatch[1].replace(/;\s*$/, '');
      GRUPO_CARACTERISTICAS = eval('(' + code + ')');
    }

    // Médias de Lances
    const mediasMatch = content.match(/export const MEDIA_LANCES_GRUPOS:\s*Record<string,\s*number>\s*=\s*(\{[\s\S]*?\n\};)/);
    if (mediasMatch) {
      const code = mediasMatch[1].replace(/;\s*$/, '');
      MEDIA_LANCES_GRUPOS = eval('(' + code + ')');
    }

    // Estatísticas Detalhadas
    const statsMatch = content.match(/export const ESTATISTICAS_LANCES:\s*Record<string,\s*\{[\s\S]*?\}\s*=\s*(\{[\s\S]*?\n\};)/);
    if (statsMatch) {
      const code = statsMatch[1].replace(/;\s*$/, '');
      ESTATISTICAS_LANCES = eval('(' + code + ')');
    }

    process.stderr.write(`[SimulaJá MCP] Dados carregados com sucesso: ${Object.keys(GRUPOS).length} categorias, ${Object.keys(GRUPO_CARACTERISTICAS).length} grupos mapeados.\n`);
  } catch (err) {
    process.stderr.write(`[SimulaJá MCP] Erro ao carregar dados do simulador: ${err.message}\n`);
  }
}

carregarDadosSimulador();

// Helper de Formatação BRL
function formatBRL(valor) {
  if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 2. Implementação das Ferramentas
function executarSimulacao({ categoria = 'imovel', credito, plano = 'reduzido', comSeguro = true }) {
  const catKey = (categoria || 'imovel').toLowerCase().trim();
  const itens = GRUPOS[catKey] || GRUPOS['imovel'] || [];

  if (!itens || itens.length === 0) {
    return {
      sucesso: false,
      mensagem: `Nenhum plano encontrado para a categoria '${categoria}'. Categorias válidas: imovel, veiculo, pesados, servicos.`
    };
  }

  const numCredito = Number(credito);
  if (!numCredito || isNaN(numCredito)) {
    return {
      sucesso: false,
      mensagem: 'Valor de crédito inválido. Forneça um número (ex: 350000 para R$ 350 mil).'
    };
  }

  // Filtragem e busca pelo crédito exato ou mais próximo
  const isGold = plano === 'gold';
  let candidatos = itens.filter(g => (isGold ? g.isPlanoGold : !g.isPlanoGold));
  if (candidatos.length === 0) candidatos = itens;

  // Busca correspondência exata
  let item = candidatos.find(g => g.credito === numCredito);

  // Se não encontrar exato, busca o mais próximo
  if (!item) {
    candidatos.sort((a, b) => Math.abs(a.credito - numCredito) - Math.abs(b.credito - numCredito));
    item = candidatos[0];
  }

  if (!item) {
    return {
      sucesso: false,
      mensagem: `Não foi possível encontrar cota para o valor de ${formatBRL(numCredito)}.`
    };
  }

  const grupoId = String(item.grupo);
  const carac = GRUPO_CARACTERISTICAS[grupoId] || {};
  const mediaLance = MEDIA_LANCES_GRUPOS[grupoId] || (ESTATISTICAS_LANCES[grupoId]?.lanceMedia) || 45.0;

  // Dados das Parcelas
  const parcela50ComSeguro = item.r50 || 0;
  const parcela50SemSeguro = item.r50SemSeguro || (item.r50 ? item.r50 * 0.906 : 0);
  const parcelaLinearComSeguro = item.linear || (item.r50 ? item.r50 * 2 : 0);
  const parcelaLinearSemSeguro = item.linearSemSeguro || (parcelaLinearComSeguro * 0.906);

  const respostaHumana = `🎯 *SIMULAÇÃO OFICIAL SIMULAJÁ CONSÓRCIO MAGALU*
--------------------------------------------------
💰 *Crédito:* ${formatBRL(item.credito)}
🏷️ *Grupo:* ${item.grupo} | *Prazo:* ${item.prazo} meses
📋 *Taxa Adm:* ${item.tx5050 || item.txLinear || carac.taxaAdm || 16}% | *Fundo Reserva:* ${carac.fundoReserva || 1}%
${item.isPlanoGold ? '⭐ *Plano Especial:* Gold' : ''}

💳 *VALORES DE PARCELAS:*
• *Reduzida 50/50 (Até Contemplação):*
  - Com Seguro de Vida: ${formatBRL(parcela50ComSeguro)}
  - Sem Seguro de Vida: ${formatBRL(parcela50SemSeguro)}
• *Linear (Integral):*
  - Com Seguro de Vida: ${formatBRL(parcelaLinearComSeguro)}
  - Sem Seguro de Vida: ${formatBRL(parcelaLinearSemSeguro)}

📊 *MÉDIA HISTÓRICA DE LANCES:*
• Média de lances do Grupo ${item.grupo}: *${mediaLance.toFixed(2)}%*
• Lance Embutido permitido: *25%* (pode abater do próprio crédito)
• Modalidades: Sorteio, Lance Livre, Fixo 25% e Fixo 45%

📌 *STATUS DO GRUPO:*
• Status: ${carac.status || 'Ativo'}
• Reajuste: ${carac.reajuste || 'INCC'}
• Próxima Assembleia: ${carac.proximaAssembleia || '25/11/2026'}
• Observações: ${carac.caracteristicas || 'Grupo oficial com contemplações mensais regulares.'}`;

  return {
    sucesso: true,
    credito: item.credito,
    creditoFormatado: formatBRL(item.credito),
    grupo: item.grupo,
    prazo: item.prazo,
    taxaAdm: item.tx5050 || carac.taxaAdm || 16,
    fundoReserva: carac.fundoReserva || 1,
    parcelas: {
      reduzida5050: {
        comSeguro: parcela50ComSeguro,
        comSeguroFormatado: formatBRL(parcela50ComSeguro),
        semSeguro: parcela50SemSeguro,
        semSeguroFormatado: formatBRL(parcela50SemSeguro)
      },
      linear: {
        comSeguro: parcelaLinearComSeguro,
        comSeguroFormatado: formatBRL(parcelaLinearComSeguro),
        semSeguro: parcelaLinearSemSeguro,
        semSeguroFormatado: formatBRL(parcelaLinearSemSeguro)
      }
    },
    mediaLancesPct: mediaLance,
    caracteristicasGrupo: carac,
    textoFormatado: respostaHumana
  };
}

function consultarGrupo({ grupo }) {
  const gId = String(grupo).trim();
  const carac = GRUPO_CARACTERISTICAS[gId];
  const media = MEDIA_LANCES_GRUPOS[gId] || ESTATISTICAS_LANCES[gId]?.lanceMedia;
  const stats = ESTATISTICAS_LANCES[gId];

  if (!carac) {
    return {
      sucesso: false,
      mensagem: `Grupo ${gId} não encontrado no catálogo atual. Grupos disponíveis: ${Object.keys(GRUPO_CARACTERISTICAS).join(', ')}`
    };
  }

  const resposta = `📋 *DETALHES DO GRUPO ${gId} (CONSÓRCIO MAGALU)*
--------------------------------------------------
• Status: ${carac.status || 'Ativo'}
• Reajuste: ${carac.reajuste || 'INCC'}
• Próxima Assembleia: ${carac.proximaAssembleia || '25/11/2026'}
• Prazo Restante: ${carac.prazoRestante || carac.prazoOriginal || 'N/A'} meses
• Taxa de Administração: ${carac.taxaAdm || 16}% | Fundo Reserva: ${carac.fundoReserva || 1}%
• Cotas Vagas Mapeadas: ${carac.cotasVagas || 'Sob consulta'}
• Lance Embutido: 25%
• Média Histórica de Lance: ${media ? `${media.toFixed(2)}%` : 'Sem histórico de lances'}
• Regras de Contemplação: ${carac.ordemContemplacao || 'Sorteio e Lances'}
• Descrição Completa: ${carac.caracteristicas || 'Sem descrição cadastrada.'}`;

  return {
    sucesso: true,
    grupo: gId,
    dados: carac,
    mediaLance: media,
    estatisticas: stats,
    textoFormatado: resposta
  };
}

async function checarVagas6042({ forcar_notificacao_teste = false } = {}) {
  try {
    const sentinelaPath = path.join(ROOT_DIR, 'scripts', 'sentinela_vagas_6042.mjs');
    if (fs.existsSync(sentinelaPath)) {
      if (forcar_notificacao_teste) {
        // Disparar via webhook Make.com de teste
        const res = await fetch('https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: 'teste_notificacao_jarvis',
            nome: 'Fabrício Honório (Teste MCP SimulaJá)',
            celular: '41997925357',
            tipo_consorcio: 'Teste de Notificação MCP Jarvis',
            mensagem: '✅ Teste do Servidor MCP SimulaJá recebido com sucesso!',
            timestamp: new Date().toISOString()
          })
        });
        return {
          sucesso: true,
          mensagem: 'Notificação de teste enviada para o Telegram via Make.com!',
          statusWebhook: res.status
        };
      }

      // Importar dinamicamente e executar sentinela
      const sentinelaModule = await import('./sentinela_vagas_6042.mjs');
      if (sentinelaModule.checarVagasGrupo6042) {
        const resultado = await sentinelaModule.checarVagasGrupo6042();
        return {
          sucesso: true,
          resultado,
          mensagem: resultado.vagaEncontrada
            ? '🚨 Vaga encontrada e notificação disparada com sucesso!'
            : 'ℹ️ Monitoramento concluído: nenhuma vaga vaga no momento para 350k a 16%.'
        };
      }
    }
    return {
      sucesso: false,
      mensagem: 'Módulo sentinela_vagas_6042.mjs não encontrado.'
    };
  } catch (err) {
    return {
      sucesso: false,
      erro: err.message
    };
  }
}

function obterResumoSimulador({ categoria } = {}) {
  const categorias = ['imovel', 'veiculo', 'pesados', 'servicos'];
  const catsParaConsultar = categoria ? [categoria.toLowerCase()] : categorias;

  const resumo = {};
  for (const cat of catsParaConsultar) {
    const lista = GRUPOS[cat] || [];
    const creditosUnicos = [...new Set(lista.map(g => g.credito))].sort((a, b) => a - b);
    const gruposUnicos = [...new Set(lista.map(g => g.grupo))];
    resumo[cat] = {
      totalOpcoes: lista.length,
      menorCredito: creditosUnicos[0],
      maiorCredito: creditosUnicos[creditosUnicos.length - 1],
      creditosDisponiveis: creditosUnicos,
      gruposAtivos: gruposUnicos
    };
  }

  return {
    sucesso: true,
    totalGruposCaracteristicas: Object.keys(GRUPO_CARACTERISTICAS).length,
    categorias: resumo
  };
}

// 2.1 Ferramentas de CRM & Jarvis Squad integradas com Dewiar App
async function buscarLeads({ nome, status, limite = 10 } = {}) {
  if (!supabase) {
    return { sucesso: false, mensagem: 'Conexão com Supabase não inicializada ou indisponível.' };
  }
  try {
    let query = supabase.from('leads').select('id, nome, telefone, status, valor_credito, tipo_consorcio, created_at');
    if (nome) {
      query = query.ilike('nome', `%${nome}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    query = query.order('created_at', { ascending: false }).limit(limite);
    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        sucesso: true,
        leads: [],
        textoFormatado: 'Nenhum lead encontrado com os filtros informados.'
      };
    }

    let texto = `📋 *LEADS ENCONTRADOS NO SIMULAJÁ (${data.length}):*\n`;
    data.forEach((lead, i) => {
      texto += `${i + 1}. *${lead.nome || 'Sem nome'}* | Status: ${lead.status || 'N/A'} | Crédito: ${lead.valor_credito ? formatBRL(lead.valor_credito) : 'N/A'} | Tel: ${lead.telefone || 'N/A'}\n`;
    });

    return { sucesso: true, leads: data, textoFormatado: texto };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

async function obterMetricasDashboard() {
  if (!supabase) {
    return { sucesso: false, mensagem: 'Conexão com Supabase não inicializada ou indisponível.' };
  }
  try {
    const { data: leads, error: errLeads } = await supabase.from('leads').select('id, status, valor_credito');
    if (errLeads) throw errLeads;

    const totalLeads = leads ? leads.length : 0;
    const statusCount = {};
    let valorNegociacao = 0;

    (leads || []).forEach(lead => {
      const s = lead.status || 'novo';
      statusCount[s] = (statusCount[s] || 0) + 1;
      if (['em_andamento', 'proposta', 'negociacao'].includes(s)) {
        valorNegociacao += Number(lead.valor_credito || 0);
      }
    });

    let inadimplentesTotal = 0;
    try {
      const { count } = await supabase.from('inadimplentes').select('*', { count: 'exact', head: true });
      inadimplentesTotal = count || 0;
    } catch {}

    const texto = `📊 *MÉTRICAS CONSOLIDADAS DO CRM SIMULAJÁ*
--------------------------------------------------
👥 *Total de Leads Cadastrados:* ${totalLeads}
💼 *Volume em Negociação:* ${formatBRL(valorNegociacao)}
⚠️ *Inadimplentes Monitorados:* ${inadimplentesTotal}
📈 *Distribuição no Funil:*
${Object.entries(statusCount).map(([k, v]) => `  • ${k}: ${v} lead(s)`).join('\n')}`;

    return {
      sucesso: true,
      totalLeads,
      valorNegociacao,
      inadimplentesTotal,
      distribuicao: statusCount,
      textoFormatado: texto
    };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

async function consultarInadimplentes({ limite = 10 } = {}) {
  if (!supabase) {
    return { sucesso: false, mensagem: 'Conexão com Supabase não inicializada ou indisponível.' };
  }
  try {
    const { data, error } = await supabase.from('inadimplentes').select('*').limit(limite);
    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        sucesso: true,
        inadimplentes: [],
        textoFormatado: 'Nenhum cliente inadimplente registrado no momento.'
      };
    }

    let texto = `⚠️ *CLIENTES INADIMPLENTES NO SIMULAJÁ (${data.length}):*\n`;
    data.forEach((c, i) => {
      texto += `${i + 1}. *${c.nome || c.cliente || 'Cliente'}* | Grupo: ${c.grupo || 'N/A'} | Cota: ${c.cota || 'N/A'} | Atraso: ${c.parcelas_atraso || 'N/A'} parcela(s) | Valor: ${c.valor_atraso ? formatBRL(c.valor_atraso) : 'N/A'}\n`;
    });

    return { sucesso: true, inadimplentes: data, textoFormatado: texto };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

const JARVIS_SQUAD_MCP = [
  { id: 'sdr_qualificador', name: 'SDR Qualificador', division: 'vendas', role: 'Triagem rápida no WhatsApp e qualificação SPIN (urgência, poder de compra, segmento).' },
  { id: 'closer_negociador', name: 'Closer Negociador', division: 'vendas', role: 'Quebra de objeções, comparativo Consórcio x Financiamento SAC e lance embutido de 25-30%.' },
  { id: 'reativador_leads', name: 'Reativador de Leads', division: 'vendas', role: 'Resgate de contatos parados usando ganchos de assembleia e perguntas de 9 palavras.' },
  { id: 'copywriter_conversao', name: 'Copywriter de Conversão', division: 'marketing', role: 'Redação persuasiva para WhatsApp, stories e scripts de áudio.' },
  { id: 'estrategista_campanhas', name: 'Estrategista de Campanhas', division: 'marketing', role: 'Geração de demanda alinhada às datas de assembleia do Consórcio Magalu.' },
  { id: 'analista_fpa', name: 'Analista FP&A & Comissões', division: 'financeiro', role: 'Projeção de comissões à vista e recorrentes, métricas e margem líquida.' },
  { id: 'guardiao_retencao', name: 'Guardião da Retenção', division: 'financeiro', role: 'Prevenção de cancelamentos, cobrança preventiva e 2ª via com código PIX.' },
  { id: 'jarvis_orquestrador', name: 'Jarvis Orquestrador', division: 'estrategia', role: 'Maestro Executivo do Fabrício Honório, voz contínua e comando da equipe.' },
  { id: 'coach_gamificacao', name: 'Coach de Gamificação', division: 'estrategia', role: 'Missões diárias, pontuação e rankings comerciais.' }
];

function consultarSquadJarvis({ agente_id } = {}) {
  if (agente_id) {
    const agente = JARVIS_SQUAD_MCP.find(a => a.id.toLowerCase() === agente_id.toLowerCase() || a.name.toLowerCase().includes(agente_id.toLowerCase()));
    if (!agente) {
      return { sucesso: false, mensagem: `Agente '${agente_id}' não encontrado no Jarvis Squad.` };
    }
    return {
      sucesso: true,
      agente,
      textoFormatado: `🤖 *AGENTE: ${agente.name}* [${agente.division.toUpperCase()}]\n• Papel: ${agente.role}`
    };
  }

  let texto = `👥 *EQUIPE DE AGENTES JARVIS SQUAD (DEWIAR & SIMULAJÁ):*\n`;
  JARVIS_SQUAD_MCP.forEach((a, i) => {
    texto += `${i + 1}. *${a.name}* [${a.division}] - ${a.role}\n`;
  });
  return { sucesso: true, squad: JARVIS_SQUAD_MCP, textoFormatado: texto };
}

async function perguntarAoJarvis({ pergunta, agente_id } = {}) {
  if (!geminiApiKey) {
    return {
      sucesso: false,
      mensagem: 'Chave GEMINI_API_KEY não configurada no arquivo .env.'
    };
  }

  try {
    const agente = agente_id ? JARVIS_SQUAD_MCP.find(a => a.id === agente_id || a.name.toLowerCase().includes(agente_id.toLowerCase())) : null;
    const personaPrompt = agente
      ? `Você é o agente especialista '${agente.name}' do Jarvis Squad no SimulaJá CRM (${agente.role}). Responda com assertividade, foco técnico e em português claro.`
      : `Você é o Jarvis / Bella, assistente de inteligência e voz executivo do SimulaJá CRM e Consórcio Magalu de Fabrício Honório. Responda de forma nobre, executiva, direta e resolutiva.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${personaPrompt}\n\nComando ou pergunta do usuário: ${pergunta}` }]
        }
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const resposta = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta gerada pelo modelo.';

    return {
      sucesso: true,
      resposta,
      agente: agente ? agente.name : 'Jarvis',
      textoFormatado: resposta
    };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

// 3. Definição do Esquema de Ferramentas MCP
const TOOLS_DEFINITIONS = [
  {
    name: 'simular_consorcio',
    description: 'Simula parcelas oficiais do Consórcio SimulaJá (Reduzida 50/50 e Linear, com e sem seguro), prazo, grupo, taxas e médias de lance.',
    inputSchema: {
      type: 'object',
      properties: {
        categoria: {
          type: 'string',
          enum: ['imovel', 'veiculo', 'pesados', 'servicos'],
          description: 'Categoria do consórcio (ex: imovel, veiculo, pesados, servicos). Padrão: imovel.'
        },
        credito: {
          type: 'number',
          description: 'Valor desejado do crédito em Reais (ex: 350000 para R$ 350 mil).'
        },
        plano: {
          type: 'string',
          enum: ['reduzido', 'linear', 'gold'],
          description: 'Tipo de plano da simulação (reduzido, linear ou gold). Padrão: reduzido.'
        },
        comSeguro: {
          type: 'boolean',
          description: 'Se verdadeiro, calcula as parcelas incluindo o seguro prestamista. Padrão: true.'
        }
      },
      required: ['credito']
    }
  },
  {
    name: 'consultar_grupo',
    description: 'Consulta detalhes e regras de um grupo de consórcio (ex: 6042, 6045, 6039, 5298): regras de lance, lance embutido, vagas raspadas, status e assembleia.',
    inputSchema: {
      type: 'object',
      properties: {
        grupo: {
          type: 'string',
          description: 'Número do grupo de consórcio (ex: "6042", "6045", "6039", "5298").'
        }
      },
      required: ['grupo']
    }
  },
  {
    name: 'checar_vagas_6042',
    description: 'Aciona o Sentinela de monitoramento do Grupo 6042 (cota de R$ 350.000,00 a 16% de taxa de administração) e envia alerta via Telegram/WhatsApp.',
    inputSchema: {
      type: 'object',
      properties: {
        forcar_notificacao_teste: {
          type: 'boolean',
          description: 'Se true, dispara uma notificação de teste imediatamente no Telegram do gestor.'
        }
      }
    }
  },
  {
    name: 'obter_resumo_simulador',
    description: 'Lista as faixas de crédito disponíveis, grupos ativos e categorias do SimulaJá.',
    inputSchema: {
      type: 'object',
      properties: {
        categoria: {
          type: 'string',
          enum: ['imovel', 'veiculo', 'pesados', 'servicos'],
          description: 'Categoria opcional para filtrar o resumo.'
        }
      }
    }
  },
  {
    name: 'buscar_leads',
    description: 'Busca leads no banco de dados do CRM SimulaJá por nome ou status do funil.',
    inputSchema: {
      type: 'object',
      properties: {
        nome: {
          type: 'string',
          description: 'Nome do lead para pesquisar.'
        },
        status: {
          type: 'string',
          description: 'Status no funil (novo, em_andamento, proposta, negociacao, fechado, perdido).'
        },
        limite: {
          type: 'number',
          description: 'Quantidade máxima de resultados a retornar (padrão: 10).'
        }
      }
    }
  },
  {
    name: 'obter_metricas_dashboard',
    description: 'Obtém métricas agregadas do CRM: total de leads, volume em negociação, total de inadimplentes e distribuição por fase do funil.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'consultar_inadimplentes',
    description: 'Lista clientes em atraso/inadimplentes com dados de parcelas vencidas, grupo, cota e valor em atraso.',
    inputSchema: {
      type: 'object',
      properties: {
        limite: {
          type: 'number',
          description: 'Quantidade máxima de clientes a retornar (padrão: 10).'
        }
      }
    }
  },
  {
    name: 'consultar_squad_jarvis',
    description: 'Lista ou detalha os agentes especializados da equipe de IA (SDR Qualificador, Closer Negociador, Reativador, Copywriter, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        agente_id: {
          type: 'string',
          description: 'ID ou nome do agente para consultar (ex: "sdr_qualificador", "closer_negociador", "reativador_leads"). Deixe vazio para listar todos.'
        }
      }
    }
  },
  {
    name: 'perguntar_ao_jarvis',
    description: 'Envia um comando ou pergunta diretamente para o cérebro do Jarvis / Bella (ou direcionado a um agente especialista do Squad) via Gemini.',
    inputSchema: {
      type: 'object',
      properties: {
        pergunta: {
          type: 'string',
          description: 'Texto do comando, dúvida de vendas, simulação ou análise desejada.'
        },
        agente_id: {
          type: 'string',
          description: 'ID opcional do agente para responder (ex: "closer_negociador", "copywriter_conversao", "sdr_qualificador").'
        }
      },
      required: ['pergunta']
    }
  }
];

// 4. Dispatcher de Chamadas JSON-RPC 2.0
async function processarChamadaRPC(req) {
  const { id, method, params } = req;

  // Handshake Inicial MCP
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'simulaja-mcp-server',
          version: '1.0.0'
        }
      }
    };
  }

  // Notificações MCP (sem resposta)
  if (method === 'notifications/initialized' || method === 'initialized') {
    return null;
  }

  // Ping / Healthcheck
  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  // Listagem de Ferramentas
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS_DEFINITIONS
      }
    };
  }

  // Execução de Ferramenta
  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params || {};
    let resultado = null;

    try {
      if (name === 'simular_consorcio') {
        resultado = executarSimulacao(args);
      } else if (name === 'consultar_grupo') {
        resultado = consultarGrupo(args);
      } else if (name === 'checar_vagas_6042') {
        resultado = await checarVagas6042(args);
      } else if (name === 'obter_resumo_simulador') {
        resultado = obterResumoSimulador(args);
      } else if (name === 'buscar_leads') {
        resultado = await buscarLeads(args);
      } else if (name === 'obter_metricas_dashboard') {
        resultado = await obterMetricasDashboard(args);
      } else if (name === 'consultar_inadimplentes') {
        resultado = await consultarInadimplentes(args);
      } else if (name === 'consultar_squad_jarvis') {
        resultado = consultarSquadJarvis(args);
      } else if (name === 'perguntar_ao_jarvis') {
        resultado = await perguntarAoJarvis(args);
      } else {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Ferramenta desconhecida: ${name}`
          }
        };
      }

      const texto = typeof resultado === 'string'
        ? resultado
        : resultado.textoFormatado || JSON.stringify(resultado, null, 2);

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: texto
            }
          ],
          isError: !resultado.sucesso && resultado.sucesso !== undefined
        }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ferramenta ${name}: ${err.message}`
            }
          ],
          isError: true
        }
      };
    }
  }

  // Método não suportado
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Método não suportado: ${method}`
    }
  };
}

// 5. Loop Principal stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed);
    const response = await processarChamadaRPC(request);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (err) {
    process.stderr.write(`[SimulaJá MCP] Erro no parsing JSON-RPC: ${err.message}\n`);
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${err.message}`
      }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

process.stderr.write('[SimulaJá MCP] Servidor iniciado e aguardando comandos via stdio (JSON-RPC 2.0)...\n');
