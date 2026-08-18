-- 1. Grant EXECUTE permissions back to authenticated and anon users on essential RLS functions
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.classificar_lead() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calcular_temperatura_mercado(numeric, numeric, numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(app_role, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

-- 2. Drop restrictive RLS policies on leads table
DROP POLICY IF EXISTS "Leads - Acesso Controlado" ON public.leads;
DROP POLICY IF EXISTS "Leads - Edição Controlada" ON public.leads;
DROP POLICY IF EXISTS "leads_select_org" ON public.leads;
DROP POLICY IF EXISTS "leads_update_org" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_org" ON public.leads;
DROP POLICY IF EXISTS "leads_select_authenticated" ON public.leads;
DROP POLICY IF EXISTS "leads_update_authenticated" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_authenticated" ON public.leads;

-- 3. Create clean RLS policies for authenticated users to access leads
CREATE POLICY "leads_select_authenticated" ON public.leads
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "leads_update_authenticated" ON public.leads
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "leads_insert_authenticated" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (true);

-- 4. Ensure RLS is active
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
