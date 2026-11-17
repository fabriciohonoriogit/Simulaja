# 🎙️ INTEGRAÇÃO DEWIAR APP + SIMULAJÁ CRM (JARVIS OS)

Este guia documenta a integração entre o **Dewiar App** (assistente nativo de voz multiplataforma) e o ecossistema de inteligência comercial do **SimulaJá CRM**.

---

## 🏗️ Arquitetura da Solução

```
┌────────────────────────────────────────────────────────┐
│            DEWIAR APP (Desktop & Android)              │
│  • Escuta de voz global no Windows em 2º plano         │
│  • Personas de IA configuráveis                        │
│  • Suporte a Modelos Locais (Ollama) & Nuvem           │
└──────────────────────────┬─────────────────────────────┘
                           │ Protocolo MCP (JSON-RPC stdio)
                           ▼
┌────────────────────────────────────────────────────────┐
│          SIMULAJÁ MCP SERVER (v1.1.0)                  │
│       (scripts/simulaja-mcp-server.mjs)                │
│  • simular_consorcio (Cálculo 50/50 e Linear Magalu)   │
│  • consultar_grupo (6042, 6045, regras de lance)       │
│  • checar_vagas_6042 (Sentinela de vagas e Telegram)   │
│  • buscar_leads (Pesquisa no CRM por nome/status)      │
│  • obter_metricas_dashboard (Volume e total no funil)  │
│  • consultar_inadimplentes (Atrasos e cotas)           │
│  • consultar_squad_jarvis (SDR, Closer, Reativador)    │
│  • perguntar_ao_jarvis (Cérebro Gemini e personas)     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             BANCO SUPABASE & SIMULADOR OFICIAL         │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Iniciar

### 1. Iniciar Tudo com 1 Clique (Automático)
Basta dar dois cliques em:
```cmd
scripts\iniciar_tudo.bat
```
Ou de forma 100% silenciosa (sem nenhuma tela preta na tela):
```cmd
scripts\iniciar_silencioso.vbs
```

### 2. Iniciar Automaticamente ao Ligar o Windows (Autostart)
Para que o **Dewiar + MCP do SimulaJá** abra sozinho toda vez que você ligar o computador:
* Dê dois cliques em: `scripts\ativar_inicializacao_com_windows.bat`
* Para desativar quando quiser: `scripts\desativar_inicializacao_com_windows.bat`

### 3. Iniciar Separadamente (Manual)
Dê dois cliques no arquivo:
```cmd
scripts\iniciar_mcp.bat
```
Ou no terminal dentro de `Projetos/simulaja`:
```bash
npm run mcp:server
```

### 2. Iniciar o Dewiar App Integrado
Dê dois cliques em:
```cmd
scripts\iniciar_dewiar.bat
```
Ou no terminal do Dewiar:
```cmd
cd C:\Users\Samsung\Documents\Projetos\dewiar-app
venv\Scripts\python ui/app.py
```

### 2. Configurar o Dewiar App Automaticamente
Execute o script resiliente que preparamos (ele verifica Python, Git, cria o ambiente virtual isolado e vincula o MCP sem fechar a janela em caso de erro):
```cmd
scripts\configurar_dewiar.bat
```

O script irá:
1. Clonar o repositório oficial do Dewiar (`dwr-git/dewiar-app`) em `C:\Users\Samsung\Documents\Projetos\dewiar-app`;
2. Criar um ambiente virtual isolado (`venv`);
3. Instalar os pacotes necessários;
4. Copiar a configuração `dewiar-mcp-config.json` para o Dewiar.

---

## 🛠️ Ferramentas Disponíveis para o Dewiar

| Ferramenta | Descrição |
|---|---|
| `simular_consorcio` | Calcula parcelas 50/50 reduzidas e lineares, seguro e média de lance de qualquer crédito. |
| `consultar_grupo` | Retorna taxas, prazo e assembleia dos grupos (ex: Grupo 6042). |
| `checar_vagas_6042` | Aciona o sentinela e alerta no Telegram do gestor Fabrício Honório. |
| `buscar_leads` | Localiza clientes e propostas pelo nome ou fase do funil no Supabase. |
| `obter_metricas_dashboard` | Retorna volume total em negociação, quantidade de leads e inadimplência. |
| `consultar_inadimplentes` | Lista clientes com parcelas vencidas para cobrança amigável. |
| `consultar_squad_jarvis` | Lista ou consulta os especialistas da equipe (SDR, Closer, Reativador, etc.). |
| `perguntar_ao_jarvis` | Encaminha comandos de voz diretamente para a inteligência Gemini. |

---

## 🎙️ Palavras de Ativação Reconhecidas (Hotwords)

No navegador (`GlobalJarvisVoiceListener.tsx`), o microfone agora acorda ao ouvir:
* **"Jarvis"** ou **"Fala Jarvis"**
* **"Bella"** ou **"Oi Bella"**
* **"Dewiar"** ou **"Ei Dewiar"**
* **"Closer"**, **"SDR"** ou **"Reativador"**
