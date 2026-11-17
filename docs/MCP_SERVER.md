# Servidor MCP SimulaJá & Integração Dewiar (Voice AI)

Este módulo expõe o motor de cálculo, matriz de grupos e o sentinela de vagas do **SimulaJá** como um servidor oficial **Model Context Protocol (MCP)** via `stdio`, permitindo que assistentes de voz externos como o **Dewiar App** (`github.com/dwr-git/dewiar-app`), Claude Desktop, Cursor e outros agentes consultem o consórcio em tempo real.

---

## 🚀 Como Iniciar o Servidor MCP

```bash
# Via script direto
node scripts/simulaja-mcp-server.mjs

# Ou via npm
npm run mcp:server
```

---

## 🛠️ Ferramentas Disponíveis (MCP Tools)

### 1. `simular_consorcio`
Simula as parcelas oficiais do Consórcio Magalu com as regras do SimulaJá:
- **Reduzida 50/50** (com e sem seguro de vida prestamista)
- **Linear / Integral** (com e sem seguro de vida prestamista)
- Prazo, Taxa de Administração e Fundo de Reserva
- **Média histórica de lances** do grupo selecionado
- Regras de contemplação e lance embutido (25%)

**Exemplo de Chamada JSON-RPC:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "simular_consorcio",
    "arguments": {
      "categoria": "imovel",
      "credito": 350000,
      "plano": "reduzido",
      "comSeguro": true
    }
  }
}
```

---

### 2. `consultar_grupo`
Consulta detalhes cadastrais e status operacional de qualquer grupo (ex: `6042`, `6039`, `6045`, `5298`):
- Assembleia e data do próximo sorteio
- Índice de reajuste (ex: INCC)
- Quantidade de cotas vagas mapeadas
- Média histórica percentual de lances contemplados

**Exemplo:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "consultar_grupo",
    "arguments": {
      "grupo": "6042"
    }
  }
}
```

---

### 3. `checar_vagas_6042`
Aciona o Sentinela Jarvis no portal Consórcio Magalu para verificar se surgiu cota no Grupo 6042 (R$ 350.000,00 a 16%). Caso haja vaga, dispara notificação de alta prioridade via Make.com para o Telegram e WhatsApp do gestor.

**Argumentos:**
- `forcar_notificacao_teste` (*boolean*): Se `true`, dispara imediatamente uma notificação de teste no Telegram via Make.

---

### 4. `obter_resumo_simulador`
Retorna as faixas de crédito ativas, categorias (imóveis, veículos, pesados, serviços) e total de grupos cadastrados.

---

## 🎙️ Lógica de Interrupção Instantânea (Barge-In) no Microfone

No **Jarvis HUD** (`src/pages/admin/JarvisHUDPage.tsx`) e **Jarvis Mobile** (`JarvisMobileAssistant.tsx`), foi implementada a arquitetura de **Barge-In** com resposta inferior a **30 milissegundos**:

1. **Gatilhos de Detecção Imediata:**
   - Eventos `onspeechstart` e `onsoundstart` do reconhecimento de fala cortam o áudio antes mesmo de processar o texto.
   - O primeiro fragmento/fonema de áudio (*interim transcript*) aciona `triggerBargeIn()`.
2. **Corte e Fade-Out Web Audio:**
   - A função `stopVoice()` aplica uma rampa de atenuação de 40ms no `GainNode` e cancela a síntese local (`speechSynthesis.cancel()`), eliminando qualquer eco ou sobreposição na fala.
3. **Sincronia de Estados do Orbe:**
   - O orbe quântico transiciona imediatamente de `speaking` para `listening` assim que o microfone é ativado ou a voz do gestor é detectada.
