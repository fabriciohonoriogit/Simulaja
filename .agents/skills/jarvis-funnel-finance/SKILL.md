---
name: jarvis-funnel-finance
description: >-
  Use this skill whenever the user asks Jarvis for the status of clients in the sales funnel, contact history,
  payment reminders, or checking payment status on administrator portals and downloading 2nd via boletos.
  Follows the exact UI steps for Consórcio Magalu Portal: Atendimento -> Posição do Consorciado -> Emissão de Cobrança.
---

# Jarvis Skill: Exact Portal Magalu 2nd Via Flow & Funnel Payment Verification

This skill provides step-by-step UI instructions for Jarvis to navigate the Consórcio Magalu Portal and issue 2nd via boletos.

## Exact Portal Navigation Flow

1. **Login**:
   - Access `MAGALU_PORTAL_URL` with `MAGALU_FILIAL` (10826), `MAGALU_CHAPA` (918260), and `MAGALU_SENHA`.

2. **Navigation**:
   - Click top menu: **Atendimento**
   - Click submenu: **Posição do Consorciado**
   - Input **Grupo** and **Cota** (or search by CPF in client wallet)

3. **Operações Menu (Left Sidebar)**:
   - On the *Posição do Consorciado* view, look at the left sidebar under **Operações**.
   - Click on **Emissão de Cobrança**.
   - Select the target month for the installment.
   - Click **Emitir Cobrança**.

4. **Output**:
   - Download generated PDF to `/scratch/boletos/`.
   - Extract line digitável and PIX string.
   - Present humanized response to user / send via WhatsApp.
