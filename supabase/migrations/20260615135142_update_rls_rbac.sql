-- ============================================================
-- MIGRAÇÃO DE SEGURANÇA RLS (RBAC) - SimulaJá
-- Garante que vendedores só possam ver os próprios leads e carteira.
-- ============================================================

-- 1. TABELA LEADS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select_org" ON public.leads;
DROP POLICY IF EXISTS "leads_update_org" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_org" ON public.leads;

-- SELECT: 
-- Admins veem todos da org.
-- Consultores veem os seus próprios leads E leads não atribuídos (para fila/distribuição).
CREATE POLICY "leads_select_org" ON public.leads
  FOR SELECT TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo_acesso = 'admin'
      )
      OR responsavel_id = auth.uid()
      OR responsavel_id IS NULL
    )
  );

-- UPDATE:
-- Admins podem atualizar qualquer lead.
-- Consultores só podem atualizar os próprios leads.
CREATE POLICY "leads_update_org" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo_acesso = 'admin'
      )
      OR responsavel_id = auth.uid()
      OR responsavel_id IS NULL
    )
  )
  WITH CHECK (
    organizacao_id = public.get_my_org_id()
  );

-- DELETE:
-- Apenas admins podem deletar leads.
CREATE POLICY "leads_delete_org" ON public.leads
  FOR DELETE TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis 
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );

-- 2. TABELA CARTEIRA
ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carteira_select_org" ON public.carteira;
DROP POLICY IF EXISTS "carteira_update_org" ON public.carteira;
DROP POLICY IF EXISTS "carteira_delete_org" ON public.carteira;

CREATE POLICY "carteira_select_org" ON public.carteira
  FOR SELECT TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo_acesso = 'admin'
      )
      OR consultor_id = auth.uid()
    )
  );

CREATE POLICY "carteira_update_org" ON public.carteira
  FOR UPDATE TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo_acesso = 'admin'
      )
      OR consultor_id = auth.uid()
    )
  )
  WITH CHECK (
    organizacao_id = public.get_my_org_id()
  );

CREATE POLICY "carteira_delete_org" ON public.carteira
  FOR DELETE TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis 
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );
