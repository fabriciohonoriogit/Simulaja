ALTER TABLE public.registration_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY modulos_read ON public.modulos FOR SELECT TO authenticated USING (true);
CREATE POLICY permissoes_read ON public.permissoes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS perfis_select_policy ON public.perfis;
CREATE POLICY perfis_select_policy ON public.perfis FOR SELECT TO authenticated
  USING (id = auth.uid() OR organizacao_id = public.get_my_org_id());
DROP POLICY IF EXISTS perfis_update_policy ON public.perfis;
CREATE POLICY perfis_update_policy ON public.perfis FOR UPDATE TO authenticated
  USING (id = auth.uid() OR (organizacao_id = public.get_my_org_id() AND public.has_role(auth.uid(),'admin'::app_role)))
  WITH CHECK (id = auth.uid() OR (organizacao_id = public.get_my_org_id() AND public.has_role(auth.uid(),'admin'::app_role)));

DROP POLICY IF EXISTS cotas_contempladas_select_policy ON public.cotas_contempladas;
DROP POLICY IF EXISTS cotas_contempladas_all_policy ON public.cotas_contempladas;

DROP POLICY IF EXISTS organizacoes_insert_auth ON public.organizacoes;
CREATE POLICY organizacoes_insert_auth ON public.organizacoes FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can read prompts" ON public."Prompts";

DROP POLICY IF EXISTS anon_insert_leads_restricted ON public.leads;
CREATE POLICY anon_insert_leads_restricted ON public.leads FOR INSERT TO anon
  WITH CHECK (
    responsavel_id IS NULL
    AND organizacao_id IS NULL
    AND (status IS NULL OR status = 'novo_lead')
    AND char_length(nome) BETWEEN 1 AND 150
    AND (celular IS NULL OR char_length(celular) <= 20)
  );

DROP POLICY IF EXISTS "Usuários sobem suas fotos" ON storage.objects;
CREATE POLICY "Usuários sobem suas fotos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Usuários atualizam suas fotos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Fotos de perfil públicas" ON storage.objects;
CREATE POLICY "Fotos de perfil públicas" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);