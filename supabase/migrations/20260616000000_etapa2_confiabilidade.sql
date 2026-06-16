-- ============================================================
-- ETAPA 2: Confiabilidade Operacional
-- 1. Padronização de Status (Leads)
-- 2. Tabela de Logs de Auditoria e Triggers
-- ============================================================

-- 1. Padronização de Status na Tabela Leads
-- Atualizar valores existentes para se adequarem ao padrão
UPDATE public.leads 
SET status = 'novo_lead' 
WHERE status IS NULL OR status NOT IN (
    'novo_lead', 'primeiro_contato', 'qualificacao', 'simulacao_enviada', 
    'negociacao', 'aguardando_pagamento', 'fechado', 'perdido', 'morto'
);

-- Adicionar a constraint de validação
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS chk_leads_status;

ALTER TABLE public.leads
ADD CONSTRAINT chk_leads_status CHECK (
    status IN (
        'novo_lead', 'primeiro_contato', 'qualificacao', 'simulacao_enviada', 
        'negociacao', 'aguardando_pagamento', 'fechado', 'perdido', 'morto'
    )
);

-- 2. Sistema de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tabela text NOT NULL,
    registro_id uuid NOT NULL,
    acao text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data jsonb,
    new_data jsonb,
    alterado_por uuid,
    organizacao_id uuid,
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;

-- Apenas admins podem ver os logs da sua organização
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
FOR SELECT TO authenticated
USING (
    organizacao_id = public.get_my_org_id()
    AND EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo_acesso = 'admin'
    )
);

-- Trigger genérica para capturar alterações na tabela Leads
CREATE OR REPLACE FUNCTION public.trg_audit_leads()
RETURNS trigger AS $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        v_org_id := NEW.organizacao_id;
        INSERT INTO public.audit_logs (tabela, registro_id, acao, new_data, alterado_por, organizacao_id)
        VALUES ('leads', NEW.id, TG_OP, to_jsonb(NEW), v_user_id, v_org_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_org_id := NEW.organizacao_id;
        -- Só registra no log se status, valor, ou dono mudar (para evitar poluição)
        IF NEW.status IS DISTINCT FROM OLD.status OR 
           NEW.valor_credito IS DISTINCT FROM OLD.valor_credito OR 
           NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id THEN
            
            INSERT INTO public.audit_logs (tabela, registro_id, acao, old_data, new_data, alterado_por, organizacao_id)
            VALUES ('leads', NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), v_user_id, v_org_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_org_id := OLD.organizacao_id;
        INSERT INTO public.audit_logs (tabela, registro_id, acao, old_data, alterado_por, organizacao_id)
        VALUES ('leads', OLD.id, TG_OP, to_jsonb(OLD), v_user_id, v_org_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atachar a trigger na tabela leads
DROP TRIGGER IF EXISTS audit_leads_trigger ON public.leads;
CREATE TRIGGER audit_leads_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trg_audit_leads();
