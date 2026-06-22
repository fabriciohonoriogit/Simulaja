-- Adiciona a coluna plano na tabela organizacoes que estava faltando

ALTER TABLE public.organizacoes
ADD COLUMN IF NOT EXISTS plano text DEFAULT 'pro';
