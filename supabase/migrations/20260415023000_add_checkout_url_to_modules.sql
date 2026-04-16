-- Add checkout_url column to modules table
ALTER TABLE public.modules
ADD COLUMN checkout_url TEXT;

-- Create index for performance
CREATE INDEX idx_modules_checkout_url ON public.modules(checkout_url);
