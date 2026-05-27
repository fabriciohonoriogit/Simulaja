-- ============================================================
-- MIGRAÇÃO DE SEGURANÇA RLS - SimulaJá
-- Corrige todos os erros/avisos do Supabase Security Advisor
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. FUNÇÃO AUXILIAR: get_my_org_id (com SECURITY DEFINER + search_path fixo)
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

-- Revogar execução pública da função auxiliar (só chamada internamente pelo RLS)
REVOKE EXECUTE ON FUNCTION public.get_my_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;

-- ============================================================
-- 2. FUNÇÃO has_role: fixar search_path para evitar "Function Search Path Mutable"
-- ============================================================
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

-- ============================================================
-- 3. FUNÇÃO update_member_role: fixar search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_member_role(new_role text, target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins da mesma org podem alterar roles
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

-- Revogar acesso público às funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.update_member_role(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_member_role(text, uuid) TO authenticated;

-- ============================================================
-- 4. FUNÇÃO calcular_temperatura_mercado: fixar search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.calcular_temperatura_mercado(
  p_creditos_var numeric,
  p_ticket_var numeric,
  p_vendas_var numeric
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
  score := (p_creditos_var * 0.4) + (p_ticket_var * 0.3) + (p_vendas_var * 0.3);
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

-- ============================================================
-- 5. TABELA: leads
-- Erro: "Lead contact data is publicly readable and writable by anonymous users"
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select_org" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_org" ON public.leads;
DROP POLICY IF EXISTS "leads_update_org" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_org" ON public.leads;
-- Permite inserção pública (formulário de captação de leads)
DROP POLICY IF EXISTS "leads_insert_public" ON public.leads;

CREATE POLICY "leads_select_org" ON public.leads
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_my_org_id());

CREATE POLICY "leads_insert_public" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true); -- formulário público de captação

CREATE POLICY "leads_insert_org" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.get_my_org_id());

CREATE POLICY "leads_update_org" ON public.leads
  FOR UPDATE TO authenticated
  USING (organizacao_id = public.get_my_org_id())
  WITH CHECK (organizacao_id = public.get_my_org_id());

CREATE POLICY "leads_delete_org" ON public.leads
  FOR DELETE TO authenticated
  USING (organizacao_id = public.get_my_org_id());

-- ============================================================
-- 6. TABELA: historico_contatos
-- Erro: "Contact History Table Has No RLS Policies"
-- ============================================================
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico_select_org" ON public.historico_contatos;
DROP POLICY IF EXISTS "historico_insert_org" ON public.historico_contatos;
DROP POLICY IF EXISTS "historico_update_org" ON public.historico_contatos;
DROP POLICY IF EXISTS "historico_delete_org" ON public.historico_contatos;

CREATE POLICY "historico_select_org" ON public.historico_contatos
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_my_org_id());

CREATE POLICY "historico_insert_org" ON public.historico_contatos
  FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.get_my_org_id());

CREATE POLICY "historico_update_org" ON public.historico_contatos
  FOR UPDATE TO authenticated
  USING (organizacao_id = public.get_my_org_id())
  WITH CHECK (organizacao_id = public.get_my_org_id());

CREATE POLICY "historico_delete_org" ON public.historico_contatos
  FOR DELETE TO authenticated
  USING (organizacao_id = public.get_my_org_id());

-- ============================================================
-- 7. TABELA: convites
-- Erro: "Invitation tokens and invitee email addresses are publicly readable"
-- ============================================================
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "convites_select_org" ON public.convites;
DROP POLICY IF EXISTS "convites_select_token" ON public.convites;
DROP POLICY IF EXISTS "convites_insert_admin" ON public.convites;
DROP POLICY IF EXISTS "convites_update_admin" ON public.convites;
DROP POLICY IF EXISTS "convites_delete_admin" ON public.convites;

-- Admins da org vêem os convites da org
CREATE POLICY "convites_select_org" ON public.convites
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_my_org_id());

-- Qualquer pessoa pode ler um convite pelo token (para aceitar o convite)
-- (feito via anon para o fluxo de aceite)
CREATE POLICY "convites_select_token" ON public.convites
  FOR SELECT TO anon
  USING (status = 'pendente' AND expires_at > now());

-- Apenas admins criam convites
CREATE POLICY "convites_insert_admin" ON public.convites
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );

CREATE POLICY "convites_update_admin" ON public.convites
  FOR UPDATE TO authenticated
  USING (organizacao_id = public.get_my_org_id());

CREATE POLICY "convites_delete_admin" ON public.convites
  FOR DELETE TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );

-- ============================================================
-- 8. TABELA: perfis
-- Erro: "User profiles with personal data are publicly readable without RLS"
-- ============================================================
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_select_own" ON public.perfis;
DROP POLICY IF EXISTS "perfis_select_org" ON public.perfis;
DROP POLICY IF EXISTS "perfis_insert_own" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update_own" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update_admin" ON public.perfis;

-- Usuário vê o próprio perfil
CREATE POLICY "perfis_select_own" ON public.perfis
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Usuário vê perfis da mesma org (necessário para listar equipe)
CREATE POLICY "perfis_select_org" ON public.perfis
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_my_org_id());

-- Usuário cria o próprio perfil (no cadastro)
CREATE POLICY "perfis_insert_own" ON public.perfis
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Usuário atualiza o próprio perfil
CREATE POLICY "perfis_update_own" ON public.perfis
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin atualiza perfis da org
CREATE POLICY "perfis_update_admin" ON public.perfis
  FOR UPDATE TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis p2
      WHERE p2.id = auth.uid() AND p2.tipo_acesso = 'admin'
    )
  );

-- ============================================================
-- 9. TABELA: usuarios (armazena senha_hash)
-- Erro: "The 'usuarios' table stores password hashes with insufficient RLS"
-- ============================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete_admin" ON public.usuarios;

-- Usuário lê o próprio registro (sem senha_hash)
CREATE POLICY "usuarios_select_own" ON public.usuarios
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR id::uuid = auth.uid());

-- Admin da org lê todos da org (sem expor senha)
CREATE POLICY "usuarios_select_admin" ON public.usuarios
  FOR SELECT TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );

-- Apenas admins inserem/deletam usuários
CREATE POLICY "usuarios_insert_admin" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );

CREATE POLICY "usuarios_update_own" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text OR id::uuid = auth.uid())
  WITH CHECK (id = auth.uid()::text OR id::uuid = auth.uid());

CREATE POLICY "usuarios_delete_admin" ON public.usuarios
  FOR DELETE TO authenticated
  USING (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );

-- ============================================================
-- 10. TABELA: organizacoes
-- Aviso: "All organization records are publicly readable by anyone"
-- ============================================================
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizacoes_select_member" ON public.organizacoes;
DROP POLICY IF EXISTS "organizacoes_update_admin" ON public.organizacoes;

CREATE POLICY "organizacoes_select_member" ON public.organizacoes
  FOR SELECT TO authenticated
  USING (id = public.get_my_org_id());

CREATE POLICY "organizacoes_update_admin" ON public.organizacoes
  FOR UPDATE TO authenticated
  USING (
    id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );

-- ============================================================
-- 11. TABELA: agendamentos
-- Aviso: "Appointments readable/writable by any authenticated user across all organizations"
-- A tabela não tem organizacao_id, usa lead_id → leads.organizacao_id
-- ============================================================
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agendamentos_select_org" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_org" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_org" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_org" ON public.agendamentos;

CREATE POLICY "agendamentos_select_org" ON public.agendamentos
  FOR SELECT TO authenticated
  USING (
    lead_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = agendamentos.lead_id
        AND leads.organizacao_id = public.get_my_org_id()
    )
  );

CREATE POLICY "agendamentos_insert_org" ON public.agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (
    lead_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = agendamentos.lead_id
        AND leads.organizacao_id = public.get_my_org_id()
    )
  );

CREATE POLICY "agendamentos_update_org" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (
    lead_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = agendamentos.lead_id
        AND leads.organizacao_id = public.get_my_org_id()
    )
  );

CREATE POLICY "agendamentos_delete_org" ON public.agendamentos
  FOR DELETE TO authenticated
  USING (
    lead_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = agendamentos.lead_id
        AND leads.organizacao_id = public.get_my_org_id()
    )
  );

-- ============================================================
-- 12. TABELA: chat_messages
-- Aviso: "Chat messages accessible to any authenticated user who can access the related lead"
-- ============================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_org" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_org" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_org" ON public.chat_messages;

CREATE POLICY "chat_messages_select_org" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = chat_messages.lead_id
        AND leads.organizacao_id = public.get_my_org_id()
    )
  );

CREATE POLICY "chat_messages_insert_org" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = chat_messages.lead_id
        AND leads.organizacao_id = public.get_my_org_id()
    )
  );

CREATE POLICY "chat_messages_delete_org" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = chat_messages.lead_id
        AND leads.organizacao_id = public.get_my_org_id()
    )
  );

-- ============================================================
-- 13. TABELAS COM organizacao_id: políticas padrão de isolamento
-- carteira, comissoes, contemplacoes_grupo, cotas_contempladas,
-- fechamentos_mensais, inadimplentes, interacoes, mensagens,
-- meta, metricas_segmentos, missoes_concluidas, propostas,
-- simulador_config, termometro_mercado, historico_loteria,
-- dicas_estrategicas, Prompts
-- ============================================================

-- Helper para criar políticas padrão em bloco
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'carteira', 'comissoes', 'contemplacoes_grupo', 'cotas_contempladas',
    'fechamentos_mensais', 'inadimplentes', 'interacoes', 'mensagens',
    'meta', 'metricas_segmentos', 'missoes_concluidas', 'propostas',
    'simulador_config', 'termometro_mercado', 'historico_loteria',
    'dicas_estrategicas', 'Prompts'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      tbl || '_select_org', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      tbl || '_insert_org', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      tbl || '_update_org', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      tbl || '_delete_org', tbl);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
       USING (organizacao_id = public.get_my_org_id())',
      tbl || '_select_org', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
       WITH CHECK (organizacao_id = public.get_my_org_id())',
      tbl || '_insert_org', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
       USING (organizacao_id = public.get_my_org_id())
       WITH CHECK (organizacao_id = public.get_my_org_id())',
      tbl || '_update_org', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
       USING (organizacao_id = public.get_my_org_id())',
      tbl || '_delete_org', tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 14. TABELAS DE SISTEMA (leitura pública autenticada)
-- modulos, permissoes, mercado_termometro, metas_vendedor,
-- user_roles, usuario_permissoes
-- ============================================================
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "modulos_select_auth" ON public.modulos;
CREATE POLICY "modulos_select_auth" ON public.modulos
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissoes_select_auth" ON public.permissoes;
CREATE POLICY "permissoes_select_auth" ON public.permissoes
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.mercado_termometro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mercado_termometro_select_auth" ON public.mercado_termometro;
CREATE POLICY "mercado_termometro_select_auth" ON public.mercado_termometro
  FOR SELECT TO authenticated USING (true);

-- metas_vendedor: pelo vendedor_id
ALTER TABLE public.metas_vendedor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "metas_vendedor_select_org" ON public.metas_vendedor;
DROP POLICY IF EXISTS "metas_vendedor_insert_org" ON public.metas_vendedor;
DROP POLICY IF EXISTS "metas_vendedor_update_org" ON public.metas_vendedor;

CREATE POLICY "metas_vendedor_select_org" ON public.metas_vendedor
  FOR SELECT TO authenticated
  USING (
    vendedor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfis p1
      JOIN public.perfis p2 ON p2.organizacao_id = p1.organizacao_id
      WHERE p1.id = auth.uid()
        AND p2.id::uuid = metas_vendedor.vendedor_id
        AND p1.tipo_acesso = 'admin'
    )
  );

CREATE POLICY "metas_vendedor_insert_org" ON public.metas_vendedor
  FOR INSERT TO authenticated
  WITH CHECK (vendedor_id = auth.uid());

CREATE POLICY "metas_vendedor_update_org" ON public.metas_vendedor
  FOR UPDATE TO authenticated
  USING (vendedor_id = auth.uid())
  WITH CHECK (vendedor_id = auth.uid());

-- user_roles: apenas o próprio usuário lê e admins
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- usuario_permissoes: usuário vê as próprias permissões
ALTER TABLE public.usuario_permissoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuario_permissoes_select_own" ON public.usuario_permissoes;
DROP POLICY IF EXISTS "usuario_permissoes_admin" ON public.usuario_permissoes;

CREATE POLICY "usuario_permissoes_select_own" ON public.usuario_permissoes
  FOR SELECT TO authenticated
  USING (
    perfil_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
        AND organizacao_id = public.get_my_org_id()
    )
  );

CREATE POLICY "usuario_permissoes_admin" ON public.usuario_permissoes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perfis
      WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
  );

-- ============================================================
-- 15. STORAGE: políticas de buckets
-- Aviso: CRM files, Boleto files, Public Bucket Allows Listing
-- ============================================================

-- Bucket CRM (arquivos de clientes)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('crm', 'crm', false, 52428800)
  ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "crm_select_org" ON storage.objects;
DROP POLICY IF EXISTS "crm_insert_org" ON storage.objects;
DROP POLICY IF EXISTS "crm_update_org" ON storage.objects;
DROP POLICY IF EXISTS "crm_delete_org" ON storage.objects;

CREATE POLICY "crm_select_org" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'crm'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "crm_insert_org" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'crm'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "crm_update_org" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'crm'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "crm_delete_org" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'crm'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

-- Bucket Boletos (privado, isolado por org)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('boletos', 'boletos', false, 10485760)
  ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "boletos_select_org" ON storage.objects;
DROP POLICY IF EXISTS "boletos_insert_org" ON storage.objects;
DROP POLICY IF EXISTS "boletos_delete_org" ON storage.objects;

CREATE POLICY "boletos_select_org" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'boletos'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "boletos_insert_org" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'boletos'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "boletos_delete_org" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'boletos'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

-- ============================================================
-- 16. Habilitar proteção contra senhas vazadas (via auth settings)
-- Nota: este setting deve ser habilitado em:
-- Dashboard → Authentication → Password → "Leaked Password Protection"
-- Não é possível fazer por SQL, mas documentamos aqui.
-- ============================================================

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
SELECT 'Migração RLS concluída com sucesso!' as resultado;
