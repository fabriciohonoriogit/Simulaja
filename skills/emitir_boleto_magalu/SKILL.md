---
name: emitir_boleto_magalu
description: "Procedimento padronizado para consulta de cota, geração de 2ª via de boleto no Portal Consórcio Magalu e envio ao cliente via WhatsApp."
category: consorcio_magalu
required_tools:
  - mcp_consorcio_consultar_cota
  - mcp_consorcio_gerar_boleto
  - mcp_whatsapp_send_text
  - mcp_crm_mover_etapa
---

# Skill: Emissão de 2ª Via de Boleto - Consórcio Magalu

## Objetivo
Localizar o boleto atualizado do consorciado no portal oficial, efetuar o upload seguro no bucket do CRM e disponibilizar a linha digitável e PDF para o cliente via WhatsApp.

## Passos do Procedimento Oficial (Portal Consórcio Magalu)

1. **Autenticação**:
   - Login no Portal Magalu com Filial `10826`, Chapa `918260` e Senha `Magalu5177*`.

2. **Navegação de Menus**:
   - Menu: **Atendimento** ➔ **Atendimento** ➔ **Atendimento a clientes** ➔ **Posição do Consorciado**.

3. **Localizar Cliente**:
   - Inserir **Grupo e Cota** ou efetuar **Busca pelo nome**.
   - Clicar sobre o nome do cliente na grade de resultados.

4. **Acesso à Cobrança**:
   - No menu lateral esquerdo sob *Operações*, clicar em **Emissão de Cobrança**.

5. **Geração**:
   - Marcar o checkbox do mês em atraso.
   - Clicar em **"Gerar Cód. de barras"** (para linha digitável) e/ou **"Emitir Cobrança"** (para baixar o boleto oficial em PDF).

6. **Envio**:
   - Ao gerar o código de barras, copiar a linha oficial e colar no texto humanizado e empático para envio ao cliente via WhatsApp/Email.
   - Nunca calcular ou simular linhas digitáveis sintéticas.
