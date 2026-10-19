# ✉️ Estrutura de Prospecção e Contato Diário por E-mail (Simulajá CRM)

> **Documento de Continuidade e Arquitetura**  
> **Status:** Ativo, testado e homologado com o Gmail Corporativo.  
> **Última Atualização:** Outubro de 2026.

---

## 1. Visão Geral da Arquitetura

O sistema foi concebido para executar prospecção ativa de clientes de alto valor (consórcio imobiliário, frotas, pesados e alavancagem patrimonial) de forma **100% automatizada e diária**, com foco em entregabilidade, proteção contra filtros de spam e postura executiva (Persona Jarvis).

```
                      ┌───────────────────────────────────────┐
                      │          FONTES DE PROSPECÇÃO         │
                      │  • Google Maps Scraper (PMEs/Frotas)  │
                      │  • Apollo.io / LinkedIn (CEOs/Médicos)│
                      │  • Receita Federal / CNPJs > R$ 500k  │
                      │  • Leads Internos do CRM Simulajá     │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │  Planilha Local: scripts/leads_prospeccao.csv   │
                 │  (ou scripts/leads_prospeccao.json)             │
                 └───────────────────────┬─────────────────────────┘
                                         │
                        Execução Automática (Seg-Sex 09:30)
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │  Motor Diário: scripts/prospeccao_diaria_email.mjs
                 │  • Trava de 25 a 35 envios/dia                  │
                 │  • Jitter humano aleatório (12s a 25s)          │
                 │  • Spintax anti-spam dinâmico                   │
                 │  • Cálculo do passo da cadência (1, 2 ou 3)     │
                 └───────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │  SMTP Gmail (gn_prosperaplan@consorciomagalu...) │
                 │  Porta 465 SSL • Assinatura Oficial Magalu      │
                 └───────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │  Registro em scripts/logs/historico_disparos.json
                 │  e logs diários scripts/logs/prospeccao_DATA.log │
                 └─────────────────────────────────────────────────┘
```

---

## 2. Credenciais & Conexão SMTP Homologada

* **Servidor SMTP:** `smtp.gmail.com`
* **Porta:** `465` (SSL obrigatório)
* **Usuário:** `gn_prosperaplan@consorciomagalu.com.br`
* **Senha de Aplicativo:** Configurada em `.env` (`GMAIL_APP_PASSWORD`)
* **Remetente Exibido:** `"Fabrício Honorio | Prospera Plan" <gn_prosperaplan@consorciomagalu.com.br>`
* **Status de Conexão:** Testada e validada em produção (disparos de teste entregues com Message IDs oficiais do Google).

---

## 3. Cadência de E-mails em 3 Passos (Metodologia Consultiva)

Os templates utilizam interpolação dinâmica (`{{nome_primeiro}}`, `{{cidade}}`, `{{valor_credito}}`) e **Spintax** (`{opção A|opção B}`) para gerar variações em cada mensagem:

### Passo 1 (D+0) • Abertura Consultiva & Alavancagem
* **Objetivo:** Despertar interesse e contraste com financiamento bancário caro.
* **Assunto:** `{Oportunidade para|Estratégia de} alavancagem patrimonial em {{cidade}}?`
* **Mensagem:** Apresenta a Prospera Plan (Consórcio Magalu), aponta o CET médio bancário (12% a 14% a.a.) versus o custo diluído do consórcio (1,2% a 1,8% a.a.), e encerra com CTA de 5 minutos.

### Passo 2 (D+3) • Estudo de Caso & Matemática de Economia
* **Objetivo:** Prova social e números reais de economia.
* **Assunto:** `Re: {{nome_primeiro}}, {comparativo prático|estudo de caso}: Consórcio vs Financiamento`
* **Mensagem:** Cita caso de cliente que economizou mais de R$ 130.000 em juros bancários utilizando estratégia de lance embutido e contemplação planejada. Pergunta se quer receber uma lâmina em PDF.

### Passo 3 (D+7) • Break-up Elegante & Porta Aberta (Persona Jarvis)
* **Objetivo:** Encerrar contato com respeito à caixa de entrada e empatia.
* **Assunto:** `{Devo encerrar meu contato por aqui|Encerrando meus contatos}, {{nome_primeiro}}?`
* **Mensagem:** Compreende a rotina corrida do lead, avisa que é o último e-mail para não ser inconveniente, e deixa os canais diretos abertos para futuros projetos.

---

## 4. Arquivos e Scripts Implementados

| Arquivo | Descrição |
| :--- | :--- |
| [`scripts/prospeccao_diaria_email.mjs`](file:///c:/Users/Samsung/Documents/Projetos/simulaja/scripts/prospeccao_diaria_email.mjs) | Motor central em Node.js com lógica de cadência, delay humano, spintax e controle de histórico. |
| [`scripts/agendar_envio_diario.bat`](file:///c:/Users/Samsung/Documents/Projetos/simulaja/scripts/agendar_envio_diario.bat) | Script que cria tarefa agendada no Windows Task Scheduler para rodar todo dia útil às 09:30. |
| [`scripts/executar_prospeccao.bat`](file:///c:/Users/Samsung/Documents/Projetos/simulaja/scripts/executar_prospeccao.bat) | Atalho para rodar a prospecção de hoje manualmente com 1 duplo-clique. |
| [`scripts/cancelar_agendamento.bat`](file:///c:/Users/Samsung/Documents/Projetos/simulaja/scripts/cancelar_agendamento.bat) | Remove a tarefa agendada do Windows caso queira pausar. |
| [`scripts/leads_prospeccao.csv`](file:///c:/Users/Samsung/Documents/Projetos/simulaja/scripts/leads_prospeccao.csv) | Planilha CSV padrão editável no Excel com as colunas: `nome,email,cidade,valor_credito,tipo_consorcio,empresa,cargo`. |
| [`src/components/admin/ProspeccaoEmailModal.tsx`](file:///c:/Users/Samsung/Documents/Projetos/simulaja/src/components/admin/ProspeccaoEmailModal.tsx) | Modal completo no CRM (Fila Diária, Preview dos Templates, Agendador e Disparo de Teste). |
| [`src/services/emailOutreachService.ts`](file:///c:/Users/Samsung/Documents/Projetos/simulaja/src/services/emailOutreachService.ts) | Serviço frontend de cálculo de fila, spintax e exportador de CSV para o script. |
| [`src/pages/admin/Leads.tsx`](file:///c:/Users/Samsung/Documents/Projetos/simulaja/src/pages/admin/Leads.tsx) | Integrado o botão "✉️ PROSPECÇÃO E-MAIL" na barra de ações. |

---

## 5. Como Operar no Dia a Dia

### Simulação sem disparo real (Dry-Run):
```bash
node scripts/prospeccao_diaria_email.mjs --dry-run
```

### Disparar teste dos 3 passos para o seu e-mail:
```bash
node scripts/prospeccao_diaria_email.mjs --test-to=seuemail@dominio.com
```

### Disparar os envios reais de hoje com limite:
```bash
node scripts/prospeccao_diaria_email.mjs --limit=20
```

---

## 6. Próxima Etapa: Captação e Alimentação de E-mails

Para a próxima fase de desenvolvimento, as 3 opções de captação mapeadas são:

1. **Google Maps Extractor (Automatizado):** Script em Node.js que pesquisa termos locais (ex: *"Transportadoras em Campinas"*, *"Clínicas em Ribeirão Preto"*) e extrai os e-mails diretamente para o `leads_prospeccao.csv`.
2. **Apollo.io / LinkedIn:** Extração de listas B2B filtradas por cargo (Sócios, Médicos, Diretores) e faturamento.
3. **Receita Federal / CNPJs:** Filtro de empresas abertas por capital social > R$ 500.000 e cidades-alvo.
