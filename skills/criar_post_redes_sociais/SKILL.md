---
name: criar_post_redes_sociais
description: "Acessa as contas de redes sociais conectadas (Instagram, Facebook, LinkedIn, Canais do WhatsApp), gera a imagem publicitária de consórcio e publica diretamente sob comando do usuário."
category: marketing
required_tools:
  - mcp_marketing_generate_image
  - mcp_marketing_post_social
  - mcp_consorcio_simular
---

# Skill: Acesso Direto & Publicação em Redes Sociais pelo Jarvis

## Objetivo
Permitir que o Jarvis acesse diretamente as contas das redes sociais da empresa (Instagram, Facebook, LinkedIn e Canais do WhatsApp) e realize postagens imediatas ou agendadas conforme os comandos do usuário.

## Formas de Execução

### Rota 1: Postagem Imediata via API de Conexão Direta (Meta Graph / LinkedIn API)
1. O usuário envia o comando: *"Jarvis, publique no meu Instagram uma imagem de consórcio de automóveis com uma legenda sobre parcelas que cabem no bolso"*.
2. O Jarvis aciona `mcp_marketing_generate_image` para criar a arte publicitária.
3. Em seguida, aciona `mcp_marketing_post_social` passando as redes de destino (`instagram`, `facebook`, etc.), a imagem e a legenda com hashtags e CTA.
4. O post é publicado instantaneamente no perfil oficial conectado.

### Rota 2: Automação via Navegador (Playwright Agent / Computer Use)
- Caso o canal não possua token de API ativo, o Jarvis aciona o worker autônomo de navegação para entrar na conta, fazer o upload do conteúdo e publicar de forma automatizada e segura.
