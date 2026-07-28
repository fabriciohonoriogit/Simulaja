---
name: agendar_notificacao_aviso
description: "Agenda lembretes e notificações com data e hora específicas no CRM ou envios automáticos de avisos por WhatsApp."
category: crm
required_tools:
  - mcp_lembrete_agendar
  - mcp_whatsapp_schedule_message
---

# Skill: Agendamento de Avisos e Notificações com Data e Hora

## Objetivo
Interpretar solicitações do usuário para agendamento de compromissos, avisos, lembretes internos ou disparos automáticos de avisos de WhatsApp com data e hora marcadas.

## Passos do Procedimento

1. **Extração da Data e Hora:**
   - Interpretar expressões relativas (ex: *"amanhã às 15h"*, *"segunda-feira que vem às 09:00"*, *"dia 30/07 às 14:30"*).
   - Converter para o formato ISO completo (ex: `2026-07-30T14:30:00Z`).

2. **Decisão do Canal de Notificação:**
   - **Caso 1 (Lembrete Interno/CRM):** Usar `mcp_lembrete_agendar` para criar um aviso no painel do CRM para o consultor.
   - **Caso 2 (Aviso Externo ao Cliente via WhatsApp):** Usar `mcp_whatsapp_schedule_message` para programar o disparo do aviso direto no WhatsApp do cliente no horário agendado.

3. **Confirmação:**
   - Confirmar o agendamento em tom amigável e direto, informando a data, horário e o canal cadastrado.
