-- Atualizar a política de UPDATE para a tabela organizacoes
-- Permitir que membros atualizem se forem admin, proprietários ou se o onboarding ainda não foi concluído
DROP POLICY IF EXISTS "organizacoes_update_admin" ON public.organizacoes;
CREATE POLICY "organizacoes_update_admin" ON public.organizacoes
  FOR UPDATE TO authenticated
  USING (
    id = public.get_my_org_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.perfis
        WHERE id = auth.uid() AND tipo_acesso = 'admin'
      )
      OR owner_id = auth.uid()
      OR onboarding_completed = false
    )
  );
