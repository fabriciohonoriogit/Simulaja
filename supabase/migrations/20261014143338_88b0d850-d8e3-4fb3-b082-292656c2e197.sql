DROP POLICY IF EXISTS modulos_read ON public.modulos;
CREATE POLICY modulos_read ON public.modulos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = auth.uid() AND p.ativo = true));
DROP POLICY IF EXISTS permissoes_read ON public.permissoes;
CREATE POLICY permissoes_read ON public.permissoes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = auth.uid() AND p.ativo = true));