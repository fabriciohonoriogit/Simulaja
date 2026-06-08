
-- 1. Add trial/subscription fields to organizacoes
ALTER TABLE public.organizacoes
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Backfill existing orgs as already-active (don't break current users)
UPDATE public.organizacoes
SET subscription_status = 'active', trial_ends_at = now() + interval '10 years'
WHERE trial_ends_at IS NULL OR subscription_status = 'trialing';

-- 2. Add tipo to convites
ALTER TABLE public.convites
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'novo_tenant';

-- 3. New handle_new_user: invite-aware, creates new org for novo_tenant invites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_token text;
    v_invite record;
    v_org_id uuid;
    v_tipo_acesso text := 'vendedor';
    v_nome text;
BEGIN
    v_token := new.raw_user_meta_data->>'convite_token';
    v_nome := COALESCE(new.raw_user_meta_data->>'nome_completo', new.email);

    IF v_token IS NOT NULL THEN
        SELECT * INTO v_invite FROM public.convites
        WHERE token = v_token AND status = 'pendente' AND expires_at > now()
        LIMIT 1;

        IF v_invite.id IS NOT NULL THEN
            IF v_invite.tipo = 'novo_tenant' THEN
                INSERT INTO public.organizacoes (nome, plano, subscription_status, trial_ends_at, owner_id)
                VALUES (
                    COALESCE(v_nome, 'Minha Empresa') || ' - CRM',
                    'pro',
                    'trialing',
                    now() + interval '14 days',
                    new.id
                )
                RETURNING id INTO v_org_id;
                v_tipo_acesso := 'admin';
            ELSE
                v_org_id := v_invite.organizacao_id;
                v_tipo_acesso := COALESCE(v_invite.tipo_acesso, 'vendedor');
            END IF;

            UPDATE public.convites SET status = 'aceito', updated_at = now() WHERE id = v_invite.id;
        END IF;
    END IF;

    -- Fallback: legacy default org (keeps existing flow working if no token)
    IF v_org_id IS NULL THEN
        v_org_id := COALESCE(
            (new.raw_user_meta_data->>'organizacao_id')::uuid,
            '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4'
        );
        v_tipo_acesso := COALESCE(new.raw_user_meta_data->>'tipo_acesso', 'vendedor');
    END IF;

    INSERT INTO public.perfis (id, nome_completo, organizacao_id, tipo_acesso)
    VALUES (new.id, v_nome, v_org_id, v_tipo_acesso);

    -- Mirror role into user_roles when admin (RBAC for /admin gating)
    IF v_tipo_acesso = 'admin' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    RETURN new;
END;
$function$;

-- 4. Allow authenticated users to read their own org's subscription info
DROP POLICY IF EXISTS "Users can read own organization" ON public.organizacoes;
CREATE POLICY "Users can read own organization" ON public.organizacoes
FOR SELECT TO authenticated
USING (id = public.get_my_org_id());
