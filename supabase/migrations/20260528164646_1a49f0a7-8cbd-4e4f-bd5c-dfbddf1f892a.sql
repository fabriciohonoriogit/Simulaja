
-- =========================================================
-- 1. CONVITES: remove anonymous SELECT exposing tokens/emails
-- =========================================================
DROP POLICY IF EXISTS "Permitir select anonimo em convites pendentes" ON public.convites;
REVOKE SELECT ON public.convites FROM anon;

-- =========================================================
-- 2. ORGANIZACOES: remove anonymous SELECT
-- =========================================================
DROP POLICY IF EXISTS "Permitir select anonimo em orgs" ON public.organizacoes;
REVOKE SELECT ON public.organizacoes FROM anon;

-- =========================================================
-- 3. LEADS: remove anonymous SELECT/UPDATE; keep restricted INSERT for public capture form
-- =========================================================
DROP POLICY IF EXISTS "anon_select_leads" ON public.leads;
DROP POLICY IF EXISTS "anon_update_leads" ON public.leads;
REVOKE SELECT, UPDATE, DELETE ON public.leads FROM anon;

-- Tighten public insert: anon may only insert basic lead capture fields,
-- cannot set responsavel_id or pick an arbitrary organizacao_id beyond default trigger
DROP POLICY IF EXISTS "Leads - Inserção Pública" ON public.leads;
DROP POLICY IF EXISTS "anon_insert_leads" ON public.leads;
CREATE POLICY "anon_insert_leads_restricted"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  responsavel_id IS NULL
  AND status IS NULL OR status = 'novo_lead'
);

-- =========================================================
-- 4. PERFIS: remove overly broad {public} policies; keep authenticated-only access
-- =========================================================
DROP POLICY IF EXISTS "Users view profiles in same org" ON public.perfis;
DROP POLICY IF EXISTS "Users update own profile" ON public.perfis;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.perfis FROM anon;

CREATE POLICY "Perfis - view same org members"
ON public.perfis
FOR SELECT
TO authenticated
USING (organizacao_id = public.get_my_org_id());

-- =========================================================
-- 5. USUARIOS: drop password hash column, deny all client access
--     (Supabase Auth is the source of truth; this shadow table is unsafe)
-- =========================================================
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS senha_hash;
DROP POLICY IF EXISTS "Admins can view usuarios" ON public.usuarios;
REVOKE ALL ON public.usuarios FROM anon, authenticated;

-- =========================================================
-- 6. HISTORICO_CONTATOS: ensure RLS + scoped policies
-- =========================================================
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.historico_contatos FROM anon;

-- =========================================================
-- 7. AGENDAMENTOS: replace permissive policies with org isolation
-- =========================================================
DROP POLICY IF EXISTS "Permitir leitura de agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Permitir criacao de agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Permitir atualizacao de agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Permitir exclusao de agendamentos" ON public.agendamentos;

CREATE POLICY "agendamentos_select_same_org"
ON public.agendamentos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = agendamentos.lead_id
      AND l.organizacao_id = public.get_my_org_id()
  )
  OR criado_por = auth.uid()
);

CREATE POLICY "agendamentos_insert_same_org"
ON public.agendamentos FOR INSERT TO authenticated
WITH CHECK (
  criado_por = auth.uid()
  AND (
    lead_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = agendamentos.lead_id
        AND l.organizacao_id = public.get_my_org_id()
    )
  )
);

CREATE POLICY "agendamentos_update_same_org"
ON public.agendamentos FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = agendamentos.lead_id
      AND l.organizacao_id = public.get_my_org_id()
  )
  OR criado_por = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = agendamentos.lead_id
      AND l.organizacao_id = public.get_my_org_id()
  )
  OR criado_por = auth.uid()
);

CREATE POLICY "agendamentos_delete_same_org"
ON public.agendamentos FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = agendamentos.lead_id
      AND l.organizacao_id = public.get_my_org_id()
  )
  OR criado_por = auth.uid()
);

-- =========================================================
-- 8. CHAT_MESSAGES: scope to leads in same org
-- =========================================================
DROP POLICY IF EXISTS "Usuários podem ver mensagens dos leads" ON public.chat_messages;
DROP POLICY IF EXISTS "Usuários podem inserir mensagens" ON public.chat_messages;

CREATE POLICY "chat_messages_select_same_org"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = chat_messages.lead_id
      AND l.organizacao_id = public.get_my_org_id()
  )
);

CREATE POLICY "chat_messages_insert_same_org"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = chat_messages.lead_id
      AND l.organizacao_id = public.get_my_org_id()
  )
);

-- =========================================================
-- 9. STORAGE: scope boletos + arquivos-crm to org path prefix
--    Convention: files must be stored under '<organizacao_id>/...'
-- =========================================================
DROP POLICY IF EXISTS "boletos_select" ON storage.objects;
DROP POLICY IF EXISTS "boletos_insert" ON storage.objects;
DROP POLICY IF EXISTS "boletos_delete" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_crm_select" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_crm_insert" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_crm_update" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_crm_delete" ON storage.objects;

CREATE POLICY "boletos_select_same_org"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'boletos'
  AND (storage.foldername(name))[1] = public.get_my_org_id()::text
);
CREATE POLICY "boletos_insert_same_org"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'boletos'
  AND (storage.foldername(name))[1] = public.get_my_org_id()::text
);
CREATE POLICY "boletos_delete_same_org"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'boletos'
  AND (storage.foldername(name))[1] = public.get_my_org_id()::text
);

CREATE POLICY "arquivos_crm_select_same_org"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'arquivos-crm'
  AND (storage.foldername(name))[1] = public.get_my_org_id()::text
);
CREATE POLICY "arquivos_crm_insert_same_org"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'arquivos-crm'
  AND (storage.foldername(name))[1] = public.get_my_org_id()::text
);
CREATE POLICY "arquivos_crm_update_same_org"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'arquivos-crm'
  AND (storage.foldername(name))[1] = public.get_my_org_id()::text
)
WITH CHECK (
  bucket_id = 'arquivos-crm'
  AND (storage.foldername(name))[1] = public.get_my_org_id()::text
);
CREATE POLICY "arquivos_crm_delete_same_org"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'arquivos-crm'
  AND (storage.foldername(name))[1] = public.get_my_org_id()::text
);

-- =========================================================
-- 10. Harden functions with mutable search_path
-- =========================================================
ALTER FUNCTION public.ensure_lead_defaults() SET search_path = public;
ALTER FUNCTION public.atualizar_temperatura_lead() SET search_path = public;
ALTER FUNCTION public.update_timestamp() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.update_member_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.update_agendamentos_updated_at() SET search_path = public;
ALTER FUNCTION public.ensure_lead_assignment() SET search_path = public;
ALTER FUNCTION public.calcular_temperatura_mercado(numeric, numeric, numeric) SET search_path = public;
ALTER FUNCTION public.update_termometro_updated_at() SET search_path = public;
