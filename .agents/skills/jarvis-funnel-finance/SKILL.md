---
name: jarvis-funnel-finance
description: >-
  Use this skill whenever the user asks Jarvis for the status of clients in the sales funnel, contact history,
  payment reminders, or checking payment status on administrator portals and downloading 2nd via boletos.
  Follows the exact UI steps for Consórcio Magalu Portal: Atendimento -> Posição do Consorciado -> Emissão de Cobrança.
---

# Jarvis Skill: Exact Portal Magalu 2nd Via Flow & Funnel Payment Verification

This skill provides step-by-step UI instructions for Jarvis to navigate the Consórcio Magalu Portal, issue 2nd via boletos, and audit monthly delinquent installments.

## Exact Portal Navigation Flow (Emissão de 2ª Via & Auditoria Dia 21)

1. **Login**:
   - Access `MAGALU_PORTAL_URL` with `MAGALU_FILIAL` (10826), `MAGALU_CHAPA` (918260), and `MAGALU_SENHA` (`Magalu5177%`).

2. **Navigation (Acesso ao Consorciado)**:
   - Click top menu or sidebar: **Atendimento** -> **Atendimento a Clientes**
   - Click submenu under Operações: **Posição do Consorciado**
   - Input **Grupo** (ex: 006043) and **Cota** (ex: 3221-00), or click **Busca avançada...** to search by Name/CPF.
   - Click **Localizar** and click on the client's name.

3. **Operações Menu (Left Sidebar) -> Emissão de Cobrança**:
   - On the left sidebar under **Operações**, click on **Emissão de Cobrança**.
   - The screen **"Emissão Boleto Avulso"** opens (`frmConCoRelBoletoAvulso.aspx`).

4. **Auditoria de Pendências (Regra do Dia 21)**:
   - Check the **"Pendências"** table:
     - Columns: `# Cota | Pcl | Histórico | Vencimento | Valor | Multa | Juros | Vl. devido | Vl. receber`.
     - Se o vencimento do dia 20 possuir `Vl. devido > 0` (ex: `002 001-0 RECBTO. PARCELA - Vencimento 20/XX - Vl. devido: R$ 354,86`), a parcela está **em aberto / inadimplente**.
     - Se `Vl. devido == 0`, a cota está em dia.

5. **Opções de Geração no Portal (Seleção do Checkbox da Parcela)**:
   - Marque o checkbox da parcela desejada na grade (`ctl00_Conteudo_grdBoleto_Avulso`).
   - **Opção A - Gerar Código de Barras / Linha Digitável**:
     - Clicar no botão **"Gerar Cód. de barras"** (`#ctl00_Conteudo_btnFormLinhaDigitavel`).
     - Abre a tela com a linha digitável oficial (ex: `03399.75989 99800.002570 17275.001018 1 16050000035486`).
     - Ideal para inclusão imediata na mensagem humanizada de WhatsApp.
   - **Opção B - Emitir Cobrança (PDF Completo)**:
     - Clicar no botão **"Emitir Cobrança"** (`#ctl00_Conteudo_btnEmitir`).
     - Gera o boleto bancário oficial em PDF para download ou envio por e-mail.

6. **Ações do Jarvis se Inadimplente**:
   - Cadastra/atualiza o registro na aba `/admin/inadimplentes` do CRM.
   - Captura a linha digitável real e prepara a mensagem humanizada e empática.
   - Apresenta na tela do CRM como **"Pendente de Confirmação do Gestor"** para aprovação em 1 clique antes do envio via WhatsApp/Email.


