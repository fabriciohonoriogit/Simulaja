-- Migração de segurança: Revogação e exclusão definitiva de acesso para Anderson Copatti

-- 1. Remover convites pendentes
DELETE FROM public.convites 
WHERE email ILIKE '%copatti%' 
   OR email ILIKE '%coppati%' 
   OR email ILIKE '%andersoncopatti%';

-- 2. Desativar e remover perfis
DELETE FROM public.perfis 
WHERE nome_completo ILIKE '%copatti%' 
   OR nome_completo ILIKE '%coppati%';

-- 3. Remover organizações associadas que possam ter sido criadas
DELETE FROM public.organizacoes 
WHERE nome ILIKE '%copatti%' 
   OR nome ILIKE '%coppati%';

