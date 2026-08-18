-- ==============================================================================
-- Script de Remoção de Clientes da Carteira de Clientes e Leads
-- Clientes a remover:
-- 1. Deividson
-- 2. Eloisa Cunico
-- 3. Edson Massucato
-- 4. William de Freitas Barbosa
-- ==============================================================================

-- 1. Remover da tabela de Carteira
DELETE FROM carteira
WHERE nome ILIKE '%DEIVIDSON%'
   OR (nome ILIKE '%ELOISA%' AND nome ILIKE '%CUNICO%')
   OR (nome ILIKE '%EDSON%' AND nome ILIKE '%MASSUCATO%')
   OR (nome ILIKE '%WILLIAM%' AND nome ILIKE '%FREITAS%')
   OR (nome ILIKE '%WILLIAM%' AND nome ILIKE '%BARBOSA%');

-- 2. Remover da tabela de Leads (se existirem no funil de vendas)
DELETE FROM leads
WHERE nome ILIKE '%DEIVIDSON%'
   OR (nome ILIKE '%ELOISA%' AND nome ILIKE '%CUNICO%')
   OR (nome ILIKE '%EDSON%' AND nome ILIKE '%MASSUCATO%')
   OR (nome ILIKE '%WILLIAM%' AND nome ILIKE '%FREITAS%')
   OR (nome ILIKE '%WILLIAM%' AND nome ILIKE '%BARBOSA%');
