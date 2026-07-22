-- ============================================================
-- MIGRAÇÃO DE HARDENING DE SEGURANÇA — SimulaJá
-- Remove políticas permissivas, ajusta storage e funções.
-- ============================================================

-- ============================================================
-- 1. FUNÇÕES AUXILIARES — garantir search_path fixo e revogar acesso público
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.update_member_role(text, uuid);
CREATE OR REPLACE FUNCTION public.update_member_role(new_role text, target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid()
        AND tipo_acesso = 'admin'
        AND organizacao_id = (
          SELECT organizacao_id FROM public.perfis WHERE id = target_user_id
        )
    )
  ) THEN
    RAISE EXCEPTION 'Sem permissão para alterar roles';
  END IF;

  UPDATE public.perfis
    SET tipo_acesso = new_role, updated_at = now()
    WHERE id = target_user_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_member_role(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_member_role(text, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.calcular_temperatura_mercado(numeric, numeric, numeric);
CREATE OR REPLACE FUNCTION public.calcular_temperatura_mercado(
  p_creditos_var numeric,
  p_vendas_var numeric,
  p_ticket_var numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score numeric := 0;
  temp text;
  result json;
BEGIN
  score := (p_creditos_var * 0.4) + (p_vendas_var * 0.3) + (p_ticket_var * 0.3);
  IF score >= 5 THEN temp := 'muito_quente';
  ELSIF score >= 2 THEN temp := 'quente';
  ELSIF score >= -2 THEN temp := 'neutro';
  ELSIF score >= -5 THEN temp := 'frio';
  ELSE temp := 'muito_frio';
  END IF;
  result := json_build_object('temperatura', temp, 'score', score);
  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.calcular_temperatura_mercado(numeric, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calcular_temperatura_mercado(numeric, numeric, numeric) TO authenticated;

-- ============================================================
-- 2. TABELA: perfis — remover políticas públicas
-- ============================================================
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_public_select" ON public.perfis;
DROP POLICY IF EXISTS "perfis_public_update" ON public.perfis;
DROP POLICY IF EXISTS "perfis_public_insert" ON public.perfis;

-- Garante que perfis só sejam inseridos pelo próprio usuário autenticado
DROP POLICY IF EXISTS "perfis_insert_auth" ON public.perfis;
CREATE POLICY "perfis_insert_auth" ON public.perfis
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 3. TABELA: leads — remover políticas públicas permissivas
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "form_public_select_by_celular" ON public.leads;
DROP POLICY IF EXISTS "form_public_update" ON public.leads;
DROP POLICY IF EXISTS "form_public_insert" ON public.leads;

-- A inserção pública (formulário de captura) continua permitida apenas para leads novos
DROP POLICY IF EXISTS "anon_insert_leads_restricted" ON public.leads;
CREATE POLICY "anon_insert_leads_restricted" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (
    (responsavel_id IS NULL AND status IS NULL)
    OR status = 'novo_lead'
  );

-- Remover duplicatas desatualizadas (já cobertas por leads_isolation)
DROP POLICY IF EXISTS "leads_select_org" ON public.leads;
DROP POLICY IF EXISTS "leads_update_org" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_org" ON public.leads;

-- ============================================================
-- 4. TABELA: historico_contatos — garantir RLS e consolidar policies
-- ============================================================
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico_isolation" ON public.historico_contatos;
DROP POLICY IF EXISTS "historico_contatos_isolation" ON public.historico_contatos;

CREATE POLICY "historico_contatos_select_org" ON public.historico_contatos
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_my_org_id());

CREATE POLICY "historico_contatos_insert_org" ON public.historico_contatos
  FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.get_my_org_id());

CREATE POLICY "historico_contatos_update_org" ON public.historico_contatos
  FOR UPDATE TO authenticated
  USING (organizacao_id = public.get_my_org_id())
  WITH CHECK (organizacao_id = public.get_my_org_id());

CREATE POLICY "historico_contatos_delete_org" ON public.historico_contatos
  FOR DELETE TO authenticated
  USING (organizacao_id = public.get_my_org_id());

-- ============================================================
-- 5. TABELA: convites — limitar leitura anônima por token
-- ============================================================
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "convites_select_token" ON public.convites;
CREATE POLICY "convites_select_token" ON public.convites
  FOR SELECT TO anon
  USING (
    status = 'pendente'
    AND expires_at > now()
    AND token = current_setting('request.headers')::jsonb->>'x-invite-token'
  );

-- ============================================================
-- 6. TABELA: mensagens — restringir broadcast por organização
-- ============================================================
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mensagens - Select" ON public.mensagens;
CREATE POLICY "Mensagens - Select" ON public.mensagens
  FOR SELECT TO authenticated
  USING (
    remetente_id = auth.uid()
    OR destinatario_id = auth.uid()
    OR (
      destinatario_id IS NULL
      AND organizacao_id = public.get_my_org_id()
    )
  );

-- ============================================================
-- 7. STORAGE — políticas dos buckets arquivos-crm e boletos
-- ============================================================
-- Remover políticas globais/permissivas de arquivos-crm
DROP POLICY IF EXISTS "Permitir leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir update autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir delete autenticados" ON storage.objects;

-- Recriar as policies org-scoped de arquivos-crm
DROP POLICY IF EXISTS "arquivos_crm_select_same_org" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_crm_insert_same_org" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_crm_update_same_org" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_crm_delete_same_org" ON storage.objects;

CREATE POLICY "arquivos_crm_select_same_org" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'arquivos-crm' AND (storage.foldername(name))[1] = public.get_my_org_id()::text);

CREATE POLICY "arquivos_crm_insert_same_org" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'arquivos-crm' AND (storage.foldername(name))[1] = public.get_my_org_id()::text);

CREATE POLICY "arquivos_crm_update_same_org" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'arquivos-crm' AND (storage.foldername(name))[1] = public.get_my_org_id()::text);

CREATE POLICY "arquivos_crm_delete_same_org" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'arquivos-crm' AND (storage.foldername(name))[1] = public.get_my_org_id()::text);

-- Remover legacy policies de boletos (permissivas para qualquer authenticated)
DROP POLICY IF EXISTS "Authenticated can read boletos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload boletos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete boletos" ON storage.objects;

-- Recriar as policies org-scoped de boletos
DROP POLICY IF EXISTS "boletos_select_same_org" ON storage.objects;
DROP POLICY IF EXISTS "boletos_insert_same_org" ON storage.objects;
DROP POLICY IF EXISTS "boletos_delete_same_org" ON storage.objects;

CREATE POLICY "boletos_select_same_org" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'boletos' AND (storage.foldername(name))[1] = public.get_my_org_id()::text);

CREATE POLICY "boletos_insert_same_org" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'boletos' AND (storage.foldername(name))[1] = public.get_my_org_id()::text);

CREATE POLICY "boletos_delete_same_org" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'boletos' AND (storage.foldername(name))[1] = public.get_my_org_id()::text);

-- profiles bucket permanece público (fotos de perfil), mas restringimos upload
DROP POLICY IF EXISTS "Usuários sobem suas fotos" ON storage.objects;
CREATE POLICY "Usuários sobem suas fotos" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'profiles');

-- ============================================================
-- 8. GARANTIR GRANTS NAS TABELAS AFETADAS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_contatos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens TO authenticated;
GRANT ALL ON public.perfis TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.historico_contatos TO service_role;
GRANT ALL ON public.convites TO service_role;
GRANT ALL ON public.mensagens TO service_role;
