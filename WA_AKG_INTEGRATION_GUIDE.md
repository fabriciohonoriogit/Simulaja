# 🚀 Guia de Integração WA-AKG & Safe Broadcast no Simulajá

Este guia documenta a implantação do repositório **WA-AKG** e as melhorias de **Safe Broadcast (Anti-Ban)** aplicadas no CRM do **Simulajá**.

---

## 1. 🛡️ Melhorias Implantadas no CRM (Simulajá)

As melhores práticas do WA-AKG foram incorporadas diretamente na tela de **Disparo em Massa da Carteira** (`BulkWhatsAppModal.tsx`) e na Edge Function de envio (`evolution-send-message`):

### A. Tecnologia Spintax Interativa
* **O que faz:** Permite usar `{opção 1|opção 2|opção 3}` no texto para gerar mensagens com vocabulário alternado para cada cliente.
* **Benefício:** Elimina a repetição de hash idêntico perante os servidores da Meta, blindando o chip contra bloqueios automáticos.
* **Botões Rápidos no Modal:**
  * `+ Saudação Variada`: `{Olá|Oi|Tudo bem|Como vai,}`
  * `+ Abertura Variada`: `{Passei rapidinho para te avisar que|Gostaria de te lembrar sobre|Trago uma novidade sobre}`
  * `+ Pergunta/Fechamento`: `{Qualquer dúvida me avise aqui!|Me confirma se recebeu certinho?|Um abraço e boa semana!}`
* **Simulador de Variação (Preview WhatsApp):** Botão para testar e ver em tempo real o balão verde do WhatsApp renderizado com um cliente real da lista.

### B. Perfis de Proteção Anti-Ban com Jitter
* **Reativação Segura (Recomendado para o seu caso):**
  * Delays aleatórios de **12s a 22s** entre mensagens.
  * Pausa de respiro de **40s** a cada 8 mensagens enviadas.
  * Ideal para chips antigos que estavam sem disparos frequentes.
* **Equilibrado / Padrão:**
  * Delays de **8s a 16s**, com pausas de 30s a cada 10 envios.
* **Acelerado:**
  * Delays curtos de **4s a 8s**, para bases hiper-engajadas.
* **Estimador de Tempo Total:** O modal calcula automaticamente o tempo previsto (ex: *~4 a 6 minutos para 20 contatos*).

### C. Monitor de Envio ao Vivo (Live Broadcast Monitor)
* **Barra de Progresso e Contadores:** Acompanhe em tempo real `Enviados`, `Falhas` e `Restantes`.
* **Contagem Regressiva Transparente:** Exibe na tela `⏳ Cadência segura para João (9s restantes)...` e `⌨️ Simulando digitação...`.
* **Pausa e Cancelamento:** Botão de **Pausar/Retomar** e botão de **Cancelar Restantes** a qualquer momento.
* **Histórico Recente:** Lista de todos os clientes processados na sessão atual.

---

## 2. 🖥️ Repositório WA-AKG Local (Pasta `wa-akg/`)

O repositório completo do **WA-AKG** está clonado na pasta `./wa-akg`. Ele é uma aplicação **Next.js 16 + Baileys + Prisma + Shadcn UI**.

### Como Iniciar o Painel do WA-AKG (Opcional):
Caso você queira rodar o painel visual do WA-AKG separadamente para conectar múltiplos números ou testar a interface:

1. Acesse a pasta:
   ```bash
   cd wa-akg
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env`:
   ```bash
   cp .env.example .env
   ```
4. Inicie o servidor:
   ```bash
   npm run dev
   ```
5. O painel estará disponível em `http://localhost:3000` (Swagger em `http://localhost:3000/docs`).
