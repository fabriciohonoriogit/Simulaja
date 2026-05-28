
-- 1. Enable RLS on perfis (critical)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on historico_contatos and remove overly broad policy
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read historico" ON public.historico_contatos;
DROP POLICY IF EXISTS "Isolation Policy historico_contatos" ON public.historico_contatos;

-- 3. Remove overly permissive 'true' policies on inadimplentes
DROP POLICY IF EXISTS "Authenticated can read inadimplentes" ON public.inadimplentes;
DROP POLICY IF EXISTS "Authenticated can insert inadimplentes" ON public.inadimplentes;
DROP POLICY IF EXISTS "Authenticated can update inadimplentes" ON public.inadimplentes;
DROP POLICY IF EXISTS "Authenticated can delete inadimplentes" ON public.inadimplentes;
DROP POLICY IF EXISTS "Isolation Policy inadimplentes" ON public.inadimplentes;

-- 4. Remove overly permissive policies on metricas_segmentos
DROP POLICY IF EXISTS "Permitir leitura metricas" ON public.metricas_segmentos;
DROP POLICY IF EXISTS "Permitir insert metricas" ON public.metricas_segmentos;
DROP POLICY IF EXISTS "Permitir update metricas" ON public.metricas_segmentos;

-- 5. Remove overly permissive policies on termometro_mercado
DROP POLICY IF EXISTS "Permitir leitura termometro" ON public.termometro_mercado;
DROP POLICY IF EXISTS "Permitir insert termometro" ON public.termometro_mercado;
DROP POLICY IF EXISTS "Permitir update termometro" ON public.termometro_mercado;
DROP POLICY IF EXISTS "Isolation Policy termometro_mercado" ON public.termometro_mercado;

-- 6. Remove overly broad policies on dicas_estrategicas, interacoes, carteira, propostas, historico
DROP POLICY IF EXISTS "Permitir leitura dicas" ON public.dicas_estrategicas;
DROP POLICY IF EXISTS "Permitir insert dicas" ON public.dicas_estrategicas;
DROP POLICY IF EXISTS "Authenticated can read interacoes" ON public.interacoes;
DROP POLICY IF EXISTS "Authenticated can insert interacoes" ON public.interacoes;
DROP POLICY IF EXISTS "Isolation Policy interacoes" ON public.interacoes;
DROP POLICY IF EXISTS "Authenticated can read carteira" ON public.carteira;
DROP POLICY IF EXISTS "Authenticated can insert carteira" ON public.carteira;
DROP POLICY IF EXISTS "Authenticated can update carteira" ON public.carteira;
DROP POLICY IF EXISTS "Isolation Policy carteira" ON public.carteira;
DROP POLICY IF EXISTS "Authenticated can read propostas" ON public.propostas;
DROP POLICY IF EXISTS "Authenticated can insert propostas" ON public.propostas;
DROP POLICY IF EXISTS "Authenticated can update propostas" ON public.propostas;
DROP POLICY IF EXISTS "Isolation Policy propostas" ON public.propostas;

-- 7. Usuarios: add org-scoped SELECT and enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS usuarios_select_same_org ON public.usuarios;
CREATE POLICY usuarios_select_same_org ON public.usuarios
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_my_org_id());

-- 8. Fix search_path on functions missing it
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 9. Revoke EXECUTE from anon on SECURITY DEFINER functions that should be auth-only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_org_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_member_role(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.classificar_lead() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_lead_defaults() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_lead_assignment() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
