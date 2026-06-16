-- Migration to add onboarding_completed flag
ALTER TABLE public.organizacoes
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- For existing organizations, set onboarding to true to avoid locking out existing users
UPDATE public.organizacoes SET onboarding_completed = true WHERE created_at < now() - interval '1 hour';
