DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizacoes' AND column_name = 'plano') THEN
        ALTER TABLE public.organizacoes ADD COLUMN plano text DEFAULT 'pro';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizacoes' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.organizacoes ADD COLUMN subscription_status text DEFAULT 'trialing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizacoes' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE public.organizacoes ADD COLUMN trial_ends_at timestamptz DEFAULT (now() + interval '30 days');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizacoes' AND column_name = 'owner_id') THEN
        ALTER TABLE public.organizacoes ADD COLUMN owner_id uuid;
    END IF;
END $$;

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

    IF v_token IS NOT NULL AND v_token != 'null' AND v_token != '' THEN
        SELECT * INTO v_invite FROM public.convites
        WHERE token = v_token AND status = 'pendente' AND expires_at > now()
        LIMIT 1;

        IF v_invite.id IS NOT NULL THEN
            IF v_invite.tipo = 'novo_tenant' THEN
                INSERT INTO public.organizacoes (nome, plano, subscription_status, trial_ends_at, owner_id)
                VALUES (
                    COALESCE(v_nome, 'Minha Empresa') || ' - CRM', 'pro', 'trialing', now() + interval '30 days', new.id
                ) RETURNING id INTO v_org_id;
                v_tipo_acesso := 'admin';
            ELSE
                v_org_id := v_invite.organizacao_id;
                v_tipo_acesso := COALESCE(v_invite.tipo_acesso, 'vendedor');
            END IF;

            UPDATE public.convites SET status = 'aceito', updated_at = now() WHERE id = v_invite.id;
        END IF;
    END IF;

    IF v_org_id IS NULL THEN
        INSERT INTO public.organizacoes (nome, plano, subscription_status, trial_ends_at, owner_id)
        VALUES (
            COALESCE(v_nome, 'Minha Empresa') || ' - CRM', 'pro', 'trialing', now() + interval '30 days', new.id
        ) RETURNING id INTO v_org_id;
        v_tipo_acesso := 'admin'; 
    END IF;

    INSERT INTO public.perfis (id, nome_completo, organizacao_id, tipo_acesso)
    VALUES (new.id, v_nome, v_org_id, v_tipo_acesso);

    IF v_tipo_acesso = 'admin' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Atenção Fabricio, o erro é este: %', SQLERRM;
END;
$function$;
