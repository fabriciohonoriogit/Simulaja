-- Migration to fix RLS permissions and prevent recursion across all tables

-- 1. Grant execute on all public functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, anon;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 2. Helper function get_my_org_id (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated, anon;

-- 3. PERFIS Policies
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Perfil - Select próprio" ON public.perfis;
DROP POLICY IF EXISTS "Perfis - view same org members" ON public.perfis;
DROP POLICY IF EXISTS "perfis_select_policy" ON public.perfis;
DROP POLICY IF EXISTS "perfis_all_authenticated" ON public.perfis;
DROP POLICY IF EXISTS "Perfil - Update próprio" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update_policy" ON public.perfis;
DROP POLICY IF EXISTS "perfis_insert_auth" ON public.perfis;
DROP POLICY IF EXISTS "perfis_insert_policy" ON public.perfis;

CREATE POLICY "perfis_select_policy" ON public.perfis
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "perfis_update_policy" ON public.perfis
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "perfis_insert_policy" ON public.perfis
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR auth.uid() IS NOT NULL);

-- 4. LEADS Policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leads - Acesso Controlado" ON public.leads;
DROP POLICY IF EXISTS "Leads - Edição Controlada" ON public.leads;
DROP POLICY IF EXISTS "leads_isolation" ON public.leads;
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;
DROP POLICY IF EXISTS "anon_insert_leads_restricted" ON public.leads;

CREATE POLICY "leads_select_policy" ON public.leads
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = get_my_org_id()
  OR responsavel_id = auth.uid()
  OR (SELECT tipo_acesso FROM public.perfis WHERE id = auth.uid()) IN ('admin', 'manager')
);

CREATE POLICY "leads_insert_policy" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "anon_insert_leads_restricted" ON public.leads
FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "leads_update_policy" ON public.leads
FOR UPDATE TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = get_my_org_id()
  OR responsavel_id = auth.uid()
  OR (SELECT tipo_acesso FROM public.perfis WHERE id = auth.uid()) IN ('admin', 'manager')
)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "leads_delete_policy" ON public.leads
FOR DELETE TO authenticated
USING (
  (SELECT tipo_acesso FROM public.perfis WHERE id = auth.uid()) IN ('admin', 'manager')
  OR responsavel_id = auth.uid()
);

-- 5. CARTEIRA Policies
ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "carteira_delete_org" ON public.carteira;
DROP POLICY IF EXISTS "carteira_isolation" ON public.carteira;
DROP POLICY IF EXISTS "carteira_select_org" ON public.carteira;
DROP POLICY IF EXISTS "carteira_update_org" ON public.carteira;
DROP POLICY IF EXISTS "carteira_select_policy" ON public.carteira;
DROP POLICY IF EXISTS "carteira_all_policy" ON public.carteira;

CREATE POLICY "carteira_select_policy" ON public.carteira
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = get_my_org_id()
  OR (SELECT tipo_acesso FROM public.perfis WHERE id = auth.uid()) IN ('admin', 'manager')
);

CREATE POLICY "carteira_all_policy" ON public.carteira
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 6. COMISSOES Policies
ALTER TABLE IF EXISTS public.comissoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comissoes_select_policy" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_all_policy" ON public.comissoes;
CREATE POLICY "comissoes_select_policy" ON public.comissoes
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = get_my_org_id()
  OR usuario_id = auth.uid()
  OR (SELECT tipo_acesso FROM public.perfis WHERE id = auth.uid()) IN ('admin', 'manager')
);
CREATE POLICY "comissoes_all_policy" ON public.comissoes
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 7. HISTORICO_CONTATOS Policies
ALTER TABLE IF EXISTS public.historico_contatos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "historico_contatos_select_policy" ON public.historico_contatos;
DROP POLICY IF EXISTS "historico_contatos_all_policy" ON public.historico_contatos;
CREATE POLICY "historico_contatos_select_policy" ON public.historico_contatos
FOR SELECT TO authenticated
USING (
  organizacao_id IS NULL 
  OR organizacao_id = get_my_org_id()
  OR (SELECT tipo_acesso FROM public.perfis WHERE id = auth.uid()) IN ('admin', 'manager')
  OR lead_id IN (SELECT id FROM public.leads WHERE responsavel_id = auth.uid())
);
CREATE POLICY "historico_contatos_all_policy" ON public.historico_contatos
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 8. COTAS_CONTEMPLADAS Policies
ALTER TABLE IF EXISTS public.cotas_contempladas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cotas_contempladas_select_policy" ON public.cotas_contempladas;
DROP POLICY IF EXISTS "cotas_contempladas_all_policy" ON public.cotas_contempladas;
CREATE POLICY "cotas_contempladas_select_policy" ON public.cotas_contempladas
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
CREATE POLICY "cotas_contempladas_all_policy" ON public.cotas_contempladas
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
