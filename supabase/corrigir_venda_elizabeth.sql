-- ==============================================================================
-- CORREÇÃO DA VENDA DE 20K DA CLIENTE ELIZABETH (ATRIBUIÇÃO EXCLUSIVA AO GESTOR)
-- ==============================================================================
-- A venda de R$ 20.000,00 da cliente Elizabeth NÃO pertence à Loja Paranaguá (Filial 952),
-- devendo pontuar exclusivamente como VENDA DO GESTOR (Regra: 4% em 10x linear).
-- ==============================================================================

DO $$
BEGIN
  -- 1. Atualiza na tabela de leads (Funil de Vendas)
  UPDATE leads
  SET 
    is_venda_gestor = true,
    filial_nome = 'GESTOR',
    filial_codigo = NULL,
    filial_id = NULL,
    loja = 'GESTOR',
    origem = 'venda_gestor',
    dados_cadastro = jsonb_set(COALESCE(dados_cadastro, '{}'::jsonb), '{is_venda_gestor}', 'true'::jsonb)
  WHERE nome ILIKE '%elizabeth%' OR nome ILIKE '%elisabeth%';

  -- 2. Atualiza na tabela de comissões para a regra do Gestor (4% em 10x linear = R$ 80,00/mês)
  UPDATE comissoes
  SET 
    regra_comissao = 'VENDA_GESTOR',
    taxa_comissao = 4.0,
    tipo_comissionamento = 'LINEAR',
    parcelas_comissao = 10,
    comissao_total = (valor_venda * 0.04)
  WHERE cliente_nome ILIKE '%elizabeth%' OR cliente_nome ILIKE '%elisabeth%';

END $$;
