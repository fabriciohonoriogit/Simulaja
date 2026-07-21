ALTER TABLE public.organizacoes ADD COLUMN IF NOT EXISTS evolution_instance_name text;
GRANT SELECT, UPDATE (evolution_instance_name) ON public.organizacoes TO authenticated;
GRANT ALL ON public.organizacoes TO service_role;