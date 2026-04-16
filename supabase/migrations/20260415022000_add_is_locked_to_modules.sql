-- Add is_locked column to modules table
ALTER TABLE public.modules
ADD COLUMN is_locked BOOLEAN DEFAULT false NOT NULL;

-- Create index for performance
CREATE INDEX idx_modules_is_locked ON public.modules(is_locked);
