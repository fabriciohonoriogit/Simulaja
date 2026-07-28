---
name: consultar_loteria_federal
description: "Consulta o resultado oficial da Loteria Federal da Caixa Econômica Federal (número do concurso e bilhete do 1º Prêmio) para apuração de contemplações por sorteio em consórcios."
category: consorcio_magalu
required_tools:
  - mcp_loteria_federal_consultar
  - mcp_web_search
---

# Skill: Consulta de Resultado da Loteria Federal - Caixa Econômica Federal

## Objetivo
Atender perguntas do usuário ou consultor sobre o resultado oficial da Loteria Federal em uma determinada data (ex: 26/07/2026) ou concurso, retornando o número do 1º Prêmio (usado para sorteio de cotas de consórcios).

## Passos do Procedimento

1. **Identificação da Data ou Concurso:**
   - Extraia a data informada pelo usuário (ex: `26/07/2026`, `26/07` ou número do concurso).
   - Se a data for parcial (ex: `26/07`), considere o ano atual.

2. **Invocação da Ferramenta MCP (`mcp_loteria_federal_consultar`):**
   - Execute a chamada MCP repassando o parâmetro `dataOuConcurso`.

3. **Formatação da Resposta para Consórcio:**
   - Apresente o **1º Prêmio** com destaque (ex: *"O 1º Prêmio da Loteria Federal do dia 26/07/2026 foi o bilhete 045.612"*).
   - Destaque os 5 prêmios e a relação direta com a cota sorteada no consórcio Magalu.
