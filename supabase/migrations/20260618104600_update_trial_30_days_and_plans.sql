-- Atualizar o tempo padrão do trial na tabela
ALTER TABLE public.organizacoes 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '30 days');

-- Atualizar o trigger handle_new_user para o Trial de 30 dias
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
                    now() + interval '30 days',
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

    -- Se não houver convite ou ele for inválido, vamos criar uma nova Organização (Trial de 30 Dias)
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizacoes (nome, plano, subscription_status, trial_ends_at, owner_id)
        VALUES (
            COALESCE(v_nome, 'Minha Empresa') || ' - CRM',
            'pro',
            'trialing',
            now() + interval '30 days',
            new.id
        )
        RETURNING id INTO v_org_id;
        v_tipo_acesso := 'admin'; -- Criador da org é sempre admin
    END IF;

    INSERT INTO public.perfis (id, nome_completo, organizacao_id, tipo_acesso)
    VALUES (new.id, v_nome, v_org_id, v_tipo_acesso);

    -- Espelha a role no user_roles quando for admin
    IF v_tipo_acesso = 'admin' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    RETURN new;
END;
$function$;
