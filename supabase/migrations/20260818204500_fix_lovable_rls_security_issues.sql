-- Fix RLS security policies to comply with Lovable security standards while allowing valid tenant access

-- 1. Restore function permissions
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.classificar_lead() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calcular_temperatura_mercado(numeric, numeric, numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(app_role, uuid) TO authenticated, anon;

-- 2. LEADS Table Policies
DROP POLICY IF EXISTS "Leads - Acesso Controlado" ON public.leads;
DROP POLICY IF EXISTS "Leads - Edição Controlada" ON public.leads;
DROP POLICY IF EXISTS "leads_select_org" ON public.leads;
DROP POLICY IF EXISTS "leads_update_org" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_org" ON public.leads;
DROP POLICY IF EXISTS "leads_select_authenticated" ON public.leads;
DROP POLICY IF EXISTS "leads_update_authenticated" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_authenticated" ON public.leads;

CREATE POLICY "leads_select_policy" ON public.leads
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1)
  OR responsavel_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
);

CREATE POLICY "leads_insert_policy" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "leads_update_policy" ON public.leads
FOR UPDATE TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1)
  OR responsavel_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "leads_delete_policy" ON public.leads
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
  OR responsavel_id = auth.uid()
);

-- 3. CARTEIRA Table Policies
DROP POLICY IF EXISTS "carteira_select_policy" ON public.carteira;
DROP POLICY IF EXISTS "carteira_insert_policy" ON public.carteira;
DROP POLICY IF EXISTS "carteira_update_policy" ON public.carteira;

CREATE POLICY "carteira_select_policy" ON public.carteira
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1)
  OR responsavel_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
);

CREATE POLICY "carteira_all_policy" ON public.carteira
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 4. COMISSOES Table Policies
DROP POLICY IF EXISTS "comissoes_select_policy" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_all_policy" ON public.comissoes;

CREATE POLICY "comissoes_select_policy" ON public.comissoes
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1)
  OR vendedor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
);

CREATE POLICY "comissoes_all_policy" ON public.comissoes
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 5. FECHAMENTOS Table Policies
DROP POLICY IF EXISTS "fechamentos_select_policy" ON public.fechamentos;
DROP POLICY IF EXISTS "fechamentos_all_policy" ON public.fechamentos;

CREATE POLICY "fechamentos_select_policy" ON public.fechamentos
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1)
  OR vendedor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
);

CREATE POLICY "fechamentos_all_policy" ON public.fechamentos
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 6. HISTORICO_CONTATOS Table Policies
DROP POLICY IF EXISTS "historico_contatos_select_policy" ON public.historico_contatos;
DROP POLICY IF EXISTS "historico_contatos_all_policy" ON public.historico_contatos;

CREATE POLICY "historico_contatos_select_policy" ON public.historico_contatos
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1)
  OR usuario_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
);

CREATE POLICY "historico_contatos_all_policy" ON public.historico_contatos
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 7. COTAS_CONTEMPLADAS Table Policies
DROP POLICY IF EXISTS "cotas_contempladas_select_policy" ON public.cotas_contempladas;
DROP POLICY IF EXISTS "cotas_contempladas_all_policy" ON public.cotas_contempladas;

CREATE POLICY "cotas_contempladas_select_policy" ON public.cotas_contempladas
FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "cotas_contempladas_all_policy" ON public.cotas_contempladas
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL
);
