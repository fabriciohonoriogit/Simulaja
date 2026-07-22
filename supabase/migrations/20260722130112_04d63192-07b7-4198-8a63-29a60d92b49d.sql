-- ============================================================
-- FUNÇÃO SEGURA PARA BUSCAR CONVITE POR TOKEN
-- Substitui a necessidade de policy anon SELECT em convites.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_convite_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_convite record;
  v_org_name text;
BEGIN
  SELECT c.* INTO v_convite
  FROM public.convites c
  WHERE c.token = p_token
    AND c.status = 'pendente'
    AND c.expires_at > now()
  LIMIT 1;

  IF v_convite IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT o.nome INTO v_org_name
  FROM public.organizacoes o
  WHERE o.id = v_convite.organizacao_id;

  RETURN json_build_object(
    'id', v_convite.id,
    'token', v_convite.token,
    'email', v_convite.email,
    'tipo', v_convite.tipo,
    'tipo_acesso', v_convite.tipo_acesso,
    'organizacao_id', v_convite.organizacao_id,
    'organizacao_nome', v_org_name,
    'status', v_convite.status,
    'expires_at', v_convite.expires_at,
    'created_at', v_convite.created_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_convite_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_convite_by_token(text) TO anon, authenticated;
