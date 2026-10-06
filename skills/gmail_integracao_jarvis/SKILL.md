---
name: gmail_integracao_jarvis
description: >-
  Skill do Jarvis para conectar à conta do Gmail do usuário, ler mensagens recentes, identificar e-mails importantes
  (clientes, comprovantes, propostas, alertas de administradoras) e sintetizar resumos humanizados.
category: integracao_email
required_tools:
  - mcp_gmail_list_messages
  - mcp_gmail_get_message
  - mcp_gmail_send_message
---

# Skill: Conexão Gmail e Leitura de E-mails Importantes pelo Jarvis

## 🎯 Objetivo
Habilitar o **Jarvis** a monitorar a caixa de entrada do Gmail, identificar e-mails de alta prioridade (como mensagens de clientes, comprovantes de pagamento de consórcio, avisos de administradoras e oportunidades de negócio) e apresentar um briefing diário ou sob demanda com tom de voz humanizado.

---

## 🛠️ Configuração de Conexão Gmail

O Jarvis se conecta ao Gmail via **Google Workspace API / OAuth 2.0** ou protocolo seguro **IMAP com Senha de App**:

### Método 1: OAuth 2.0 (Recomendado para Google Cloud App)
1. Salve as credenciais `credentials.json` na pasta de configuração do Jarvis (`~/.gemini/config/gmail/` ou `.env`).
2. Execute a autenticação inicial para gerar o `token.json`.

### Método 2: IMAP / App Password (Google Account)
Configurar no `.env`:
```env
GMAIL_USER="seu-email@gmail.com"
GMAIL_APP_PASSWORD="sua-senha-de-app-16-caracteres"
```

---

## 📋 Regras para Identificação de E-mails Importantes

O Jarvis filtra os e-mails com base nas seguintes categorias prioritárias:

1. **Clientes e Propostas:** E-mails recebidos de contatos cadastrados no CRM ou contendo termos como *"Proposta"*, *"Consórcio"*, *"Dúvida"*, *"Contratação"*.
2. **Financeiro e Administradoras:** E-mails de portais como Consórcio Magalu, Porto Seguro, Santander, Caixa com extratos, avisos de assembleia ou confirmação de lance/pagamento.
3. **Urgentes / Ação Necessária:** Mensagens sinalizadas com estrela/importante no Gmail ou que contêm no assunto *"Urgente"*, *"Comprovante"*, *"Segunda Via"*.

---

## 🤖 Formato de Briefing Humanizado gerado pelo Jarvis

Quando o usuário perguntar *"Jarvis, tem algum e-mail importante hoje?"*, o Jarvis responderá com este padrão amigável:

> *"Olá! Analisei sua caixa de entrada do Gmail e selecionei os **3 e-mails mais importantes** para o seu dia:*
> 
> 1. 📬 **Marcos Silva (Cliente Consórcio):** Enviou o comprovante de pagamento da parcela de Outubro. Já atualizei o status no CRM para você!
> 2. 🏦 **Consórcio Magalu:** Confirmou o resultado da última assembleia do Grupo 4050. Temos 2 cotas contempladas!
> 3. 📄 **Juliana Costa:** Solicitou uma simulação atualizada de imóvel.
> 
> *Deseja que eu responda a algum desses e-mails ou prepare a simulação da Juliana?"*

---

## 🚀 Execução em Linha de Comando (Script Auxiliar)

Para listar os e-mails importantes via linha de comando:

```bash
python skills/gmail_integracao_jarvis/scripts/gmail_integration.py --check-important --limit 5
```
