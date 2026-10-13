# 🛡️ Jarvis Squad: Esquadrão Executivo de Especialistas do CRM
**Prospera Planejamento & Consultoria | Simulaja CRM**

Este diretório contém a especificação oficial de todas as **Personas e Especialistas de IA** integrados ao CRM Simulaja e ao **Jarvis**. Cada agente possui papel, tom de voz, gatilhos de acionamento e pontos de contato definidos no sistema.

O ecossistema é baseado na biblioteca global [`agency-agents`](../agency-agents/) adaptada especificamente para o mercado de **Consórcios, Planejamento Financeiro e Vendas**.

---

## 🗺️ Matriz Geral de Especialistas (RACI & Touchpoints)

| Divisão | Especialista | Emoji | Ponto de Atuação no CRM | Gatilho de Ativação |
| :--- | :--- | :---: | :--- | :--- |
| **01. Vendas** | **SDR Qualificador** | 🎯 | WhatsApp (Evolution API) / Novos Leads | Entrada de novo lead via simulador/indicação |
| **01. Vendas** | **Closer Negociador** | 🤝 | LeadChat / Modal de Lead / Proposta | Objeção do cliente (parcela, juros, prazo) |
| **01. Vendas** | **Reativador de Leads** | 🔥 | Kanban (Colunas Morno, Frio, Perdido) | Lead sem interação há mais de 5 a 7 dias |
| **02. Marketing** | **Copywriter de Conversão** | ✍️ | LeadChat / Disparos / Redes Sociais | Criação de mensagens persuasivas e roteiros |
| **02. Marketing** | **Estrategista de Campanhas**| 📢 | Dashboard / Planejamento Semanal | Semanas de assembleia, promoções de taxas |
| **03. Financeiro** | **Analista FP&A** | 📊 | Dashboard / Relatório Financeiro | Fechamento mensal, projeção de comissões |
| **03. Financeiro** | **Guardião da Retenção** | 🛡️ | Carteira de Clientes / Inadimplentes | Parcela próxima do vencimento ou em atraso |
| **04. Estratégia**| **Jarvis Orquestrador** | 🧠 | Sistema Global / Jarvis Orb / Voice | Comandos gerais de voz e texto do gestor |
| **04. Estratégia**| **Coach de Gamificação** | 🏆 | Dashboard Hero / Missões Diárias | Acompanhamento de metas, patentes e badges |
| **05. Tecnologia** | **Auditor de Qualidade** | 🔍 | Supabase / Migrations / RLS | Alterações estruturais no banco e segurança |
| **05. Tecnologia** | **Engenheiro Frontend** | 💻 | Código do CRM (React + Tailwind) | Otimizações de UI/UX, acessibilidade e fluidez |

---

## 📂 Organização das Pastas

```text
agentes/
├── README.md                      # Esta matriz geral de responsabilidades
├── 01-vendas/
│   ├── sdr_qualificador.md        # Atendimento inicial e qualificação SPIN
│   ├── closer_negociador.md       # Quebra de objeções e fechamento
│   └── reativador_leads.md        # Resgate de oportunidades estagnadas
├── 02-marketing/
│   ├── copywriter_conversao.md    # Copywriting persuasivo de resposta direta
│   └── estrategista_campanhas.md  # Campanhas sazonais e de assembleia
├── 03-financeiro-retencao/
│   ├── analista_fpa.md            # Rentabilidade, metas e comissões
│   └── guardiao_retencao.md       # Prevenção de cancelamento e 2ª via
├── 04-estrategia-coaching/
│   ├── jarvis_orquestrador.md     # Maestro executivo mestre (Jarvis)
│   └── coach_gamificacao.md       # Missões diárias, desafios e patentes
└── 05-tecnologia-auditoria/
    ├── auditor_qualidade_crm.md   # Auditoria de consistência e RLS
    └── engenheiro_frontend.md     # Padrões visuais, design e performance
```

---

## 🔗 Integração com o Código do CRM

Todos os metadados dos agentes definidos nesta pasta estão mapeados em código TypeScript em:
- **Catálogo de Dados:** [`src/data/jarvisSquad.ts`](../src/data/jarvisSquad.ts)
- **Servidor Jarvis Brain (Python):** [`jarvis_brain_server.py`](../jarvis_brain_server.py)
- **Skills do Antigravity IDE:** [`.agents/skills/`](../.agents/skills/)
