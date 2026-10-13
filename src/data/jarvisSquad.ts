export type AgentDivision = 'vendas' | 'marketing' | 'financeiro' | 'estrategia' | 'tecnologia';

export interface JarvisAgent {
  id: string;
  name: string;
  title: string;
  description: string;
  division: AgentDivision;
  emoji: string;
  color: string;
  vibe: string;
  crmTouchpoint: string;
  triggers: string[];
  capabilities: string[];
  quickPromptPlaceholder?: string;
}

export const JARVIS_SQUAD: JarvisAgent[] = [
  // 01. Vendas
  {
    id: 'sdr_qualificador',
    name: 'SDR Qualificador',
    title: 'Triagem & Primeiro Contato Rápido',
    description: 'Atendimento instantâneo no WhatsApp com qualificação SPIN (urgência, poder de compra, segmento).',
    division: 'vendas',
    emoji: '🎯',
    color: '#2563EB',
    vibe: 'Empático, rápido, focado em perguntas de avanço',
    crmTouchpoint: 'WhatsApp (Evolution API) / Coluna "Novo Lead"',
    triggers: ['Novo lead cadastrado', 'Simulação realizada no portal', 'Lead sem contato'],
    capabilities: [
      'Identificar tipo de consórcio (imóvel, auto, pesado)',
      'Descobrir faixa de parcela confortável',
      'Agendar apresentação com consultor humano'
    ],
    quickPromptPlaceholder: 'Qualificar lead recém-chegado com perguntas SPIN...'
  },
  {
    id: 'closer_negociador',
    name: 'Closer Negociador',
    title: 'Quebra de Objeções & Fechamento',
    description: 'Calcula economia vs financiamento bancário e contorna objeções de prazo, juros e parcelas.',
    division: 'vendas',
    emoji: '🤝',
    color: '#059669',
    vibe: 'Firme, consultivo, cirúrgico na matemática financeira',
    crmTouchpoint: 'LeadChat / Colunas "Negociação" e "Proposta"',
    triggers: ['Cliente disse "vou pensar"', 'Cliente achou parcela alta', 'Cliente tem pressa pelo bem'],
    capabilities: [
      'Comparativo Consórcio x Financiamento bancário (Tabela SAC)',
      'Estratégia de Lance Embutido (30%) e FGTS',
      'Plano de Parcela Reduzida até a contemplação'
    ],
    quickPromptPlaceholder: 'Gerar contra-argumento para a objeção deste lead...'
  },
  {
    id: 'reativador_leads',
    name: 'Reativador de Leads',
    title: 'Resgate de Pipeline Antifrio',
    description: 'Reabre diálogo com contatos parados usando ganchos de assembleia e perguntas de 9 palavras.',
    division: 'vendas',
    emoji: '🔥',
    color: '#EA580C',
    vibe: 'Descontraído, sem pressão de venda, focado em reabertura',
    crmTouchpoint: 'Kanban (Morno, Frio, Perdido)',
    triggers: ['Lead sem contato há mais de 7 dias', 'Proposta sem resposta', 'Lead em status Perdido'],
    capabilities: [
      'Ganchos de assembleia próxima',
      'Mensagem de encerramento amigável (Dean Jackson)',
      'Limpeza de pipeline estagnado'
    ],
    quickPromptPlaceholder: 'Criar mensagem de reativação para este lead...'
  },

  // 02. Marketing
  {
    id: 'copywriter_conversao',
    name: 'Copywriter de Conversão',
    title: 'Redação Persuasiva de Resposta Direta',
    description: 'Cria copys magnéticas para WhatsApp, stories, anúncios e mensagens que geram cliques e respostas.',
    division: 'marketing',
    emoji: '✍️',
    color: '#8B5CF6',
    vibe: 'Magnético, persuasivo, focado em clareza e ação imediata',
    crmTouchpoint: 'Central de Disparos / Redes Sociais / LeadChat',
    triggers: ['Criar post para Instagram', 'Disparo de campanha WhatsApp', 'Criar roteiro de Stories'],
    capabilities: [
      'Frameworks PAS (Problema, Agitação, Solução) e AIDA',
      'Stories com enquetes de engajamento',
      'Scripts de áudio persuasivo para corretores'
    ],
    quickPromptPlaceholder: 'Escrever texto de alta conversão sobre consórcio imobiliário...'
  },
  {
    id: 'estrategista_campanhas',
    name: 'Estrategista de Campanhas',
    title: 'Geração de Demanda & Calendário',
    description: 'Conecta assembleias, sorteios da Loteria Federal e metas mensais em campanhas atrativas.',
    division: 'marketing',
    emoji: '📢',
    color: '#EC4899',
    vibe: 'Estratégico, focado em ROI e timing de mercado',
    crmTouchpoint: 'Dashboard / Planejador Semanal',
    triggers: ['Semana de assembleia Magalu', 'Início de mês', 'Meta mensal distante'],
    capabilities: [
      'Campanhas temáticas de lances',
      'Ações pós-assembleia com consorciados contemplados',
      'Segmentação de público por tíquete de crédito'
    ],
    quickPromptPlaceholder: 'Planejar campanha para a semana da assembleia...'
  },

  // 03. Financeiro
  {
    id: 'analista_fpa',
    name: 'Analista FP&A & Comissões',
    title: 'Projeção de Comissões & Metas',
    description: 'Consolida crédito faturado, calcula comissões à vista/recorrentes e projeta receitas futuras.',
    division: 'financeiro',
    emoji: '📊',
    color: '#10B981',
    vibe: 'Rigoroso, preciso, focado em margem e faturamento líquido',
    crmTouchpoint: 'Dashboard / Gráficos de Produção',
    triggers: ['Contrato fechado', 'Fechamento do mês', 'Auditoria de comissões'],
    capabilities: [
      'Previsão de comissão recorrente da carteira',
      'Análise de tíquete médio e margem por administradora',
      'Diagnóstico de atingimento de metas da equipe'
    ],
    quickPromptPlaceholder: 'Calcular projeção de comissões para este mês...'
  },
  {
    id: 'guardiao_retencao',
    name: 'Guardião da Retenção',
    title: 'Prevenção de Cancelamentos & 2ª Via',
    description: 'Monitora vencimentos, acessa portal da administradora e gera 2ª via com abordagem amigável.',
    division: 'financeiro',
    emoji: '🛡️',
    color: '#14B8A6',
    vibe: 'Cuidadoso, prestativo e resolutivo',
    crmTouchpoint: 'Carteira de Clientes / Inadimplentes',
    triggers: ['Parcela vencendo em 24h', 'Cota com parcela atrasada', 'Cliente pediu 2ª via'],
    capabilities: [
      'Geração automática de 2ª via Magalu',
      'Mensagem amigável com código PIX pronto',
      'Prevenção de cancelamento e perda de cota'
    ],
    quickPromptPlaceholder: 'Verificar status da cota e preparar mensagem de lembrete...'
  },

  // 04. Estratégia
  {
    id: 'jarvis_orquestrador',
    name: 'Jarvis Orquestrador',
    title: 'Maestro Executivo do Sistema',
    description: 'Assistente pessoal de Fabrício Honório, lidera o esquadrão, responde a comandos de voz e consolida relatórios.',
    division: 'estrategia',
    emoji: '🧠',
    color: '#6366F1',
    vibe: 'Nobre, executivo, proativo e antecipador de soluções',
    crmTouchpoint: 'JarvisOrb / Global Voice Listener / Servidor :8008',
    triggers: ['Comando de voz', 'Clique no JarvisOrb', 'Abertura matinal do CRM'],
    capabilities: [
      'Orquestração de subagentes especializados',
      'Memória de longo prazo via 3cerebros e Obsidian',
      'Relatório executivo matinal diário'
    ],
    quickPromptPlaceholder: 'Jarvis, qual o foco de vendas prioritário de hoje?'
  },
  {
    id: 'coach_gamificacao',
    name: 'Coach de Gamificação',
    title: 'Engajamento, Missões & Patentes',
    description: 'Gerencia missões diárias, rankings de excelência (Stone, Gold, Diamante) e celebra conquistas.',
    division: 'estrategia',
    emoji: '🏆',
    color: '#F59E0B',
    vibe: 'Energético, motivador, focado em consistência e vitórias',
    crmTouchpoint: 'DashboardHero / MissoesDiarias / StreakBadge',
    triggers: ['Venda realizada', 'Login matinal', 'Conclusão de missão'],
    capabilities: [
      'Cálculo de volume restante para subir de patente',
      'Distribuição de missões de alto impacto',
      'Disparo de celebrações com confetes e recompensas'
    ],
    quickPromptPlaceholder: 'Quantas vendas faltam para o próximo nível?'
  },

  // 05. Tecnologia
  {
    id: 'auditor_qualidade',
    name: 'Auditor de Qualidade & RLS',
    title: 'Segurança & Integridade de Dados',
    description: 'Audita regras de banco, RLS policies do Supabase e consistência de dados dos clientes.',
    division: 'tecnologia',
    emoji: '🔍',
    color: '#DC2626',
    vibe: 'Analítico, vigilante e metódico',
    crmTouchpoint: 'Supabase / Migrações / Políticas de Acesso',
    triggers: ['Alteração no banco de dados', 'Auditoria de segurança', 'Leads sem consultor'],
    capabilities: [
      'Auditoria de políticas RLS',
      'Detecção de leads duplicados ou órfãos',
      'Validação de integridade financeira'
    ],
    quickPromptPlaceholder: 'Auditar consistência da tabela de leads e fechamentos...'
  },
  {
    id: 'engenheiro_frontend',
    name: 'Engenheiro Frontend & UX',
    title: 'Fluidez Visual & Experiência do Usuário',
    description: 'Garante estética premium, tempo de resposta instantâneo, responsividade mobile e dark mode refinado.',
    division: 'tecnologia',
    emoji: '💻',
    color: '#3B82F6',
    vibe: 'Perfeccionista visual, obcecado por fluidez e UI/UX',
    crmTouchpoint: 'Interface do CRM / Kanban / Mobile Webview',
    triggers: ['Novos componentes no Dashboard', 'Otimização de Drag and Drop', 'Ajuste de acessibilidade'],
    capabilities: [
      'Design System com Tailwind e Radix UI',
      'Otimizações de performance no Kanban',
      'Design responsivo mobile e PWA'
    ],
    quickPromptPlaceholder: 'Otimizar layout e micro-interações do componente...'
  }
];

export const DIVISION_LABELS: Record<AgentDivision, { label: string; emoji: string; color: string }> = {
  vendas: { label: 'Vendas & Fechamento', emoji: '🎯', color: 'text-blue-500 border-blue-500/30 bg-blue-500/10' },
  marketing: { label: 'Marketing & Atração', emoji: '📢', color: 'text-purple-500 border-purple-500/30 bg-purple-500/10' },
  financeiro: { label: 'Financeiro & Retenção', emoji: '💰', color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' },
  estrategia: { label: 'Estratégia & Liderança', emoji: '🧠', color: 'text-indigo-500 border-indigo-500/30 bg-indigo-500/10' },
  tecnologia: { label: 'Tecnologia & Qualidade', emoji: '🛠️', color: 'text-red-500 border-red-500/30 bg-red-500/10' },
};
