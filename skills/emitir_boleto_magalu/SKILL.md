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

## Passos do Procedimento

1. **Identificar Consorciado:**
   - Buscar no CRM pelo `nome` ou `cpf_cnpj` do cliente usando a ferramenta `mcp_crm_search_leads`.
   - Obter o número do `grupo` e `cota`.

2. **Consultar Portal Magalu (Playwright Worker / API):**
   - Invocação segura do worker com autenticação mútua isolada (sem exposição da senha).
   - Extrair a `linha_digitavel`, `valor_parcela` e `vencimento`.

3. **Registrar no CRM:**
   - Adicionar o evento no `historico_contatos` do lead com a data e valor do boleto emitido.

4. **Enviar ao Cliente via WhatsApp:**
   - Formatar a mensagem amigável com a linha digitável.
   - Disparar via `mcp_whatsapp_send_text`.
