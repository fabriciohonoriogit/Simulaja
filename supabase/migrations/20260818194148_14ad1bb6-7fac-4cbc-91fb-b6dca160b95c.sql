-- Tabelas de lookup/configuração sem necessidade de RLS
ALTER TABLE IF EXISTS public.modulos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registration_errors DISABLE ROW LEVEL SECURITY;

-- Tabelas de dados que precisam de isolamento
ALTER TABLE IF EXISTS public.metas_vendedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usuario_permissoes ENABLE ROW LEVEL SECURITY;

-- Políticas para metas_vendedor (vendedor vê a própria meta, admin vê da org)
DROP POLICY IF EXISTS "metas_vendedor_select" ON public.metas_vendedor;
CREATE POLICY "metas_vendedor_select" ON public.metas_vendedor FOR SELECT TO authenticated USING (
  vendedor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "metas_vendedor_admin_all" ON public.metas_vendedor;
CREATE POLICY "metas_vendedor_admin_all" ON public.metas_vendedor FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo_acesso IN ('admin', 'manager'))
);

-- Políticas para usuario_permissoes (usuário vê as próprias, admin gerencia da org)
DROP POLICY IF EXISTS "usuario_permissoes_select_own" ON public.usuario_permissoes;
CREATE POLICY "usuario_permissoes_select_own" ON public.usuario_permissoes FOR SELECT TO authenticated USING (
  perfil_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.perfis p WHERE p.id = auth.uid() AND p.tipo_acesso IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "usuario_permissoes_admin_all" ON public.usuario_permissoes;
CREATE POLICY "usuario_permissoes_admin_all" ON public.usuario_permissoes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = auth.uid() AND p.tipo_acesso IN ('admin', 'manager'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = auth.uid() AND p.tipo_acesso IN ('admin', 'manager'))
);

-- Revoga EXECUTE em funções SECURITY DEFINER para roles não administrativos
REVOKE EXECUTE ON FUNCTION public.calcular_temperatura_mercado(numeric, numeric, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.classificar_lead() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_org_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(app_role, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_member_role(text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_member_role(uuid, text) FROM anon, authenticated;

-- Mantém get_convite_by_token executável por anon (validação de convite no cadastro)
GRANT EXECUTE ON FUNCTION public.get_convite_by_token(text) TO anon, authenticated;

-- Define search_path na função ensure_lead_defaults
CREATE OR REPLACE FUNCTION public.ensure_lead_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
      DECLARE
          admin_id uuid;
          org_id uuid;
      BEGIN
          IF NEW.organizacao_id IS NULL THEN
              IF auth.uid() IS NOT NULL THEN
                  SELECT organizacao_id INTO org_id FROM public.perfis WHERE id = auth.uid();
                  IF org_id IS NOT NULL THEN
                      NEW.organizacao_id := org_id;
                  END IF;
              END IF;
              
              IF NEW.organizacao_id IS NULL THEN
                  SELECT id, organizacao_id INTO admin_id, org_id
                  FROM public.perfis 
                  WHERE tipo_acesso = 'admin' 
                  LIMIT 1;
                  
                  IF org_id IS NOT NULL THEN
                      NEW.organizacao_id := org_id;
                  END IF;
                  IF NEW.responsavel_id IS NULL AND admin_id IS NOT NULL THEN
                      NEW.responsavel_id := admin_id;
                  END IF;
              END IF;
          END IF;

          IF NEW.responsavel_id IS NULL THEN
              IF auth.uid() IS NOT NULL THEN
                  NEW.responsavel_id := auth.uid();
              ELSE
                  SELECT id INTO admin_id FROM public.perfis WHERE tipo_acesso = 'admin' LIMIT 1;
                  IF admin_id IS NOT NULL THEN
                      NEW.responsavel_id := admin_id;
                  END IF;
              END IF;
          END IF;

          IF NEW.status IS NULL THEN
              NEW.status := 'novo_lead';
          END IF;

          IF NEW.created_at IS NULL THEN
              NEW.created_at := now();
          END IF;

          RETURN NEW;
      END;
      $function$;