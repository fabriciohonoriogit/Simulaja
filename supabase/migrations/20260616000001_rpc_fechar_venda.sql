-- ============================================================
-- ETAPA 2: Confiabilidade Operacional
-- RPC para Fechamento de Venda (Atomicidade)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fechar_venda(
    p_lead_id uuid,
    p_valor_credito numeric,
    p_grupo text,
    p_cota text,
    p_administradora text,
    p_data_adesao date,
    p_comissao_regra text,
    p_taxa_comissao numeric,
    p_tipo_comissionamento text,
    p_parcelas_comissao integer,
    p_comissao_total numeric,
    p_organizacao_id uuid,
    p_usuario_id uuid,
    p_nome_cliente text,
    p_celular_cliente text,
    p_tipo_consorcio text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_carteira_id uuid;
    result json;
BEGIN
    -- 1. Atualizar o Lead
    UPDATE public.leads
    SET 
        grupo = p_grupo,
        cota = p_cota,
        administradora = p_administradora
    WHERE id = p_lead_id;

    -- 2. Inserir ou Atualizar na Carteira
    SELECT id INTO v_carteira_id FROM public.carteira WHERE lead_id = p_lead_id LIMIT 1;
    
    IF v_carteira_id IS NOT NULL THEN
        UPDATE public.carteira
        SET 
            nome = p_nome_cliente,
            celular = p_celular_cliente,
            tipo_consorcio = p_tipo_consorcio,
            valor_credito = p_valor_credito,
            grupo = p_grupo,
            cota = p_cota,
            administradora = p_administradora,
            status = 'aguardando',
            data_adesao = p_data_adesao,
            updated_at = now()
        WHERE id = v_carteira_id;
    ELSE
        INSERT INTO public.carteira (
            lead_id, nome, celular, tipo_consorcio, valor_credito, 
            grupo, cota, administradora, status, data_adesao, organizacao_id
        ) VALUES (
            p_lead_id, p_nome_cliente, p_celular_cliente, p_tipo_consorcio, p_valor_credito,
            p_grupo, p_cota, p_administradora, 'aguardando', p_data_adesao, p_organizacao_id
        ) RETURNING id INTO v_carteira_id;
    END IF;

    -- 3. Registrar a Comissão
    INSERT INTO public.comissoes (
        organizacao_id, usuario_id, lead_id, carteira_id, cliente_nome, 
        grupo, cota, administradora, valor_venda, regra_comissao, 
        taxa_comissao, tipo_comissionamento, comissao_total, 
        parcelas_comissao, data_venda
    ) VALUES (
        p_organizacao_id, p_usuario_id, p_lead_id, v_carteira_id, p_nome_cliente,
        p_grupo, p_cota, p_administradora, p_valor_credito, p_comissao_regra,
        p_taxa_comissao, p_tipo_comissionamento, p_comissao_total,
        p_parcelas_comissao, p_data_adesao
    );

    result := json_build_object('success', true, 'carteira_id', v_carteira_id);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Falha ao fechar venda: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fechar_venda TO authenticated;
