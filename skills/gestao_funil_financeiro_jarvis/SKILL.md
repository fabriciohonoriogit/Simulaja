---
name: gestao_funil_financeiro_jarvis
description: >-
  Skill do Jarvis para consultar a situação de cada cliente no funil de vendas, histórico de interações,
  lembretes de pagamento, verificação de adimplência nos portais das administradoras e emissão/envio de 2ª via de boletos.
  Segue o fluxo exato do Portal Consórcio Magalu (Atendimento -> Posição do Consorciado -> Emissão de Cobrança).
category: vendas_financeiro
required_tools:
  - mcp_crm_search_leads
  - mcp_crm_get_funnel_status
  - mcp_administradora_check_payment
  - mcp_administradora_download_boleto
  - mcp_whatsapp_send_text
  - browser_subagent
---

# Skill: Emissão de 2ª Via no Portal Magalu e Gestão de Funil (Jarvis)

## 🎯 Objetivo
Permitir que o **Jarvis** navegue com precisão pelo Portal do Consórcio Magalu para extrair a Posição do Consorciado e emitir a 2ª via do boleto em PDF, seguindo o passo a passo exato da interface do portal.

---

## 🧭 Passo a Passo Exato de Navegação no Portal Magalu

```mermaid
flowchart TD
    A[Login no Portal: Filial 10826 / Chapa 918260] --> B[Menu Principal: Clicar em 'Atendimento']
    B --> C[Submenu: Clicar em 'Posição do Consorciado']
    C --> D[Digitar Grupo e Cota do Cliente]
    D --> E[Tela 'Posição do Consorciado' - Menu 'Operações' à esquerda]
    E --> F[Clicar em 'Emissão de Cobrança']
    F --> G[Selecionar o Mês da Parcela / Cobrança]
    G --> H[Clicar no Botão 'Emitir Cobrança']
    H --> I[Gerar e Baixar PDF do Boleto / Copiar Linha Digitável]
    I --> J[Enviar Mensagem Humanizada ao Cliente via WhatsApp/Email]
```

### Detalhes das Telas e Menus:

1. **Acesso Inicial:**
   - **URL:** `https://portal.consorciomagalu.com.br/portal-consorcio/login`
   - **Filial:** `10826` | **Chapa:** `918260` | **Senha:** `Magalu5177*`

2. **Navegação de Atendimento:**
   - Acesse a aba **Atendimento** no topo.
   - Selecione **Posição do Consorciado**.

3. **Busca de Carteira:**
   - Preencha o **Grupo** (ex: `006042`) e **Cota** (ex: `0782-00`) ou busque pelo **CPF** no CRM.

4. **Operações de Cobrança (Menu Lateral Esquerdo):**
   Na tela da *Posição do Consorciado*, localize o menu lateral esquerdo **Operações** e execute:
   - Clicar na 3ª opção: **`Emissão de Cobrança`**.
   - Selecionar o mês vigente da parcela.
   - Clicar em **`Emitir Cobrança`**.
   - O sistema gerará o arquivo **PDF** atualizado com o boleto.

---

## 💬 Diálogo Interativo do Jarvis

Caso os dados de Grupo e Cota não estejam identificados na carteira do cliente, o Jarvis dirá:

> *"Com certeza! Para eu acessar a aba **Atendimento > Posição do Consorciado** no Portal Magalu e emitir a cobrança, por favor me informe:*
> 
> 1. 👤 **CPF do Cliente** (ou Grupo e Cota)
> 2. 🗓️ **Mês de referência** da cobrança que deseja emitir
> 
> *Assim que me passar, acerto a emissão e trago o boleto em PDF para você!"*
