-- Execute este SQL no SQL Editor do Supabase para adicionar o campo checkout_url
ALTER TABLE public.modules ADD COLUMN checkout_url TEXT;
CREATE INDEX idx_modules_checkout_url ON public.modules(checkout_url);