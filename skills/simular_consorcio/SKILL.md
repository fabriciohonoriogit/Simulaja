---
name: simular_consorcio
description: "Simulação completa de consórcio Magalu com cálculo de parcelas, taxa de administração, fundo de reserva e recomendação do grupo com menor histórico de lance contemplado."
category: consorcio_magalu
required_tools:
  - mcp_consorcio_simular
  - mcp_web_search
---

# Skill: Simulação & Recomendação de Grupo - Consórcio Magalu

## Objetivo
Apresentar uma simulação de consórcio transparente e personalizada com base nas metas do cliente (sonho), recomendando o melhor grupo Magalu de acordo com os lances médios de contemplação.

## Passos do Procedimento

1. **Calculadora de Consórcio:**
   - Invoque `mcp_consorcio_simular` informando `credito` e `segmento` (imóveis, veículos, motos, pesados ou serviços).
   - Obtenha a estimativa de parcela e as taxas contratuais.

2. **Cruzar com Tabela de Lances Históricos:**
   - **Imóveis:** Se busca menor lance, priorizar Grupo 6014 (33.83%) ou Grupo 6016 (38.54%).
   - **Automóveis:** Priorizar Grupo 5240 (34.28%) ou Grupo 5242 (41.08%).
   - **Motos:** Priorizar Grupo 5261 (16.37%) ou Grupo 5265 (26.42%).
   - **Serviços:** Priorizar Grupo 7116 (12.22%).

3. **Formatação Metodologia SRV:**
   - **Sonho:** Mencione a conquista desejada pelo cliente.
   - **Realidade:** Apresente o valor da parcela simulada.
   - **Velocidade:** Apresente a estratégia de lance recomendado para antecipar a contemplação.
