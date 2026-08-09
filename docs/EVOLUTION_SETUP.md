# Guia de Configuração da Evolution API (WhatsApp)

Este documento explica como configurar e conectar a **Evolution API** ao sistema CRM SimulaJá de forma pública e segura.

---

## 1. Requisitos do Servidor Evolution API

A **Evolution API** é o serviço responsável pela automação de envio e recebimento de mensagens do WhatsApp em segundo plano.

> [!IMPORTANT]
> **Em ambiente de produção, NUNCA utilize `http://localhost:8080`.**
> O endereço `localhost` aponta para a própria máquina onde o código está rodando (o navegador do cliente ou o ambiente isolado de Edge Functions do Supabase). Em produção, a Evolution API deve estar hospedada em uma VPS ou servidor de nuvem (ex: DigitalOcean, AWS, Hetzner, EasyPanel) com um **IP Público** ou **Domínio com HTTPS**.

### Exemplo de subida via Docker (Docker Compose):

```yaml
version: '3.3'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://whatsapp.seu-dominio.com
      - DOCKER_ENV_CI=true
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=SEU_TOKEN_GLOBAL_SEGURO_AQUI
```

---

## 2. Configurando Secrets no Projeto Supabase

Para que as **Edge Functions** do Supabase (ex: `evolution-create-instance`, `webhook-evolution`) consigam se comunicar com o seu servidor da Evolution API, você deve definir as variáveis de ambiente nos **Secrets do Supabase**.

### Via Supabase CLI:

Execute no seu terminal:

```bash
supabase secrets set EVOLUTION_API_URL="https://whatsapp.seu-dominio.com"
supabase secrets set EVOLUTION_GLOBAL_KEY="SEU_TOKEN_GLOBAL_SEGURO_AQUI"
```

### Via Painel do Supabase Web:

1. Acesse o painel do seu projeto no Supabase.
2. Vá em **Project Settings** > **Edge Functions** > **Secrets**.
3. Adicione as chaves:
   - `EVOLUTION_API_URL`: A URL completa do seu servidor Evolution API (ex: `https://whatsapp.seu-dominio.com`).
   - `EVOLUTION_GLOBAL_KEY`: A chave global definida na variável `AUTHENTICATION_API_KEY` do seu servidor.

---

## 3. Configurando no Painel de Configurações do CRM

Para que as chamadas diretas do painel (geração de QR Code e teste de conexão) funcionem no navegador dos operadores:

1. Acesse o CRM SimulaJá como Administrador.
2. Vá no menu **Configurações** > seção **Integração WhatsApp**.
3. Selecione o modo **⚡ Evolution API (Robô)**.
4. Preencha os campos:
   - **Server URL**: URL pública do seu servidor (ex: `https://whatsapp.seu-dominio.com`).
   - **Global API Key**: A mesma chave de API configurada no servidor.
   - **Nome da Instância**: Nome da sua instância (ex: `simulaja`).
5. Clique no botão **Salvar & Testar**.
6. Em seguida, clique em **Provisionar / QR Code**.
7. Abra o WhatsApp no seu celular > **Aparelhos Conectados** > **Conectar um Aparelho** e escaneie o QR Code exibido na tela (ou utilize o código de pareamento de 8 dígitos).

---

## 4. Modo de Fallback: WhatsApp Web (Direto)

Caso você não possua um servidor Evolution API rodando:
- Altere o modo para **📱 WhatsApp Web (Direto)** na tela de Configurações.
- As mensagens serão abertas diretamente no WhatsApp Web ou App do operador com o texto pré-preenchido, sem necessidade de servidor ou de pareamento via QR Code.
