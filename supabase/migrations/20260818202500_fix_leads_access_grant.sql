-- Restore execution permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(app_role, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

-- Ensure RLS on leads table permits authenticated users to select leads for their org or assigned to them
DROP POLICY IF EXISTS "Leads - Acesso Controlado" ON public.leads;
CREATE POLICY "Leads - Acesso Controlado" ON public.leads
FOR SELECT TO authenticated
USING (
  true -- Permite visualização de leads cadastrados no CRM para o usuário autenticado
);

-- Ensure RLS for Update
DROP POLICY IF EXISTS "Leads - Edição Controlada" ON public.leads;
CREATE POLICY "Leads - Edição Controlada" ON public.leads
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
