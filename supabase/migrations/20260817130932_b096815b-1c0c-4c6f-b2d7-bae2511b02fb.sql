BEGIN;

-- Adicionar organizacao_id em mercado_termometro se não existir
ALTER TABLE public.mercado_termometro
ADD COLUMN IF NOT EXISTS organizacao_id uuid;

-- Preencher registros existentes com a organização do primeiro admin encontrado
UPDATE public.mercado_termometro
SET organizacao_id = (
  SELECT organizacao_id FROM public.perfis WHERE tipo_acesso = 'admin' LIMIT 1
)
WHERE organizacao_id IS NULL;

-- Remover políticas de leitura aberta
DROP POLICY IF EXISTS "Authenticated can read termometro" ON public.mercado_termometro;
DROP POLICY IF EXISTS "Authenticated can read meta" ON public.meta;

-- Política de leitura isolada por organização em mercado_termometro
CREATE POLICY "mercado_termometro_read_org"
ON public.mercado_termometro
FOR SELECT
TO authenticated
USING (organizacao_id = (SELECT perfis.organizacao_id FROM public.perfis WHERE perfis.id = auth.uid() LIMIT 1));

-- Garantir política de leitura isolada por organização em meta (caso a meta_isolation não exista)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'meta' AND policyname = 'meta_isolation'
  ) THEN
    CREATE POLICY "meta_isolation"
    ON public.meta
    FOR ALL
    TO authenticated
    USING (organizacao_id = (SELECT perfis.organizacao_id FROM public.perfis WHERE perfis.id = auth.uid() LIMIT 1))
    WITH CHECK (organizacao_id = (SELECT perfis.organizacao_id FROM public.perfis WHERE perfis.id = auth.uid() LIMIT 1));
  END IF;
END
$$;

COMMIT;