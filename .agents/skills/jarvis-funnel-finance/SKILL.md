---
name: jarvis-funnel-finance
description: >-
  Use this skill whenever the user asks Jarvis for the status of clients in the sales funnel, contact history,
  payment reminders, or checking payment status on administrator portals and downloading 2nd via boletos.
  Follows the exact UI steps for Consórcio Magalu Portal: Atendimento -> Posição do Consorciado -> Emissão de Cobrança.
---

# Jarvis Skill: Exact Portal Magalu 2nd Via Flow & Funnel Payment Verification

This skill provides step-by-step UI instructions for Jarvis to navigate the Consórcio Magalu Portal, issue 2nd via boletos, and audit monthly delinquent installments.

## Fluxo Exato de Navegação no Portal Consórcio Magalu (Oficial Fabrício Honorio)

1. **Autenticação Inicial**:
   - Acessar `MAGALU_PORTAL_URL`: https://portal.consorciomagalu.com.br/portal-consorcio/login
   - Informar:
     - **Filial**: `10826` (MAGALU_FILIAL)
     - **Chapa**: `918260` (MAGALU_CHAPA)
     - **Senha**: `Magalu5177*` (MAGALU_SENHA)
   - Clicar em Entrar.

2. **Navegação de Menus**:
   - Menu superior / lateral: **Atendimento**
   - Submenu: **Atendimento**
   - Submenu: **Atendimento a clientes**
   - Opção: **Posição do Consorciado**

3. **Localização do Consorciado**:
   - Preencher **Grupo** e **Cota**, e/ou efetuar **Busca pelo nome** do cliente.
   - Na lista de resultados encontrados, **clicar em cima do nome do cliente**.

4. **Operações de Cobrança**:
   - No menu lateral esquerdo (abaixo de *Operações*), clicar em **Emissão de Cobrança** (abre a tela `frmConCoRelBoletoAvulso.aspx`).

5. **Seleção da Parcela e Geração do Boleto**:
   - Na grade de pendências, **marcar a caixa de seleção (checkbox) do mês atrasado** (parcela do mês vigente).
   - Escolher a ação desejada:
     - **Ação 1 - Gerar código de barras**: Clicar no botão **"Gerar Cód. de barras"** (`#ctl00_Conteudo_btnFormLinhaDigitavel`). Abre a janela com o valor recalculado oficial e a linha digitável registrada no Santander (ex: `03399.75989 99800.002570 64567.501016 8 16090000046745`).
     - **Ação 2 - Emitir cobrança**: Clicar no botão **"Emitir Cobrança"** (`#ctl00_Conteudo_btnEmitir`) para baixar a 2ª via completa do boleto em formato PDF.

6. **Ação Final com o Cliente (Jarvis / CRM)**:
   - Ao gerar o código de barras, copiar a linha oficial e colar diretamente no texto humanizado e empático da régua de cobrança preventiva do cliente.
   - NUNCA efetuar cálculos sintéticos ou estimativas: o código deve ser 100% fiel ao raspado/gerado diretamente no portal oficial do Consórcio Magalu.

7. **Execução Automatizada via Script**:
   - Para raspar automaticamente qualquer cota pelo terminal:
     ```bash
     node scripts/raspar_portal_magalu.mjs <grupo> <cota>
     # Exemplo:
     node scripts/raspar_portal_magalu.mjs 005292 2010
     ```
   - O script retorna um JSON estruturado com `{ success: true, grupo, cota, linhaDigitavel, valor }`.


