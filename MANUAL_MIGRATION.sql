-- MANUAL MIGRATION: Execute estes comandos no painel do Supabase SQL Editor

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create module_contents table (junction table)
CREATE TABLE IF NOT EXISTS public.module_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_complementary BOOLEAN NOT NULL DEFAULT false,
  parent_content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, content_id),
  CHECK (parent_content_id IS NULL OR is_complementary = true)
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE NOT NULL,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  last_watched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Modules policies
DROP POLICY IF EXISTS "Anyone authenticated can view active modules" ON public.modules;
CREATE POLICY "Anyone authenticated can view active modules" ON public.modules FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Module contents policies
DROP POLICY IF EXISTS "Anyone authenticated can view module contents" ON public.module_contents;
CREATE POLICY "Anyone authenticated can view module contents" ON public.module_contents FOR SELECT TO authenticated;

DROP POLICY IF EXISTS "Admins can manage module contents" ON public.module_contents;
CREATE POLICY "Admins can manage module contents" ON public.module_contents FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User progress policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress" ON public.user_progress FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_progress;
CREATE POLICY "Admins can view all progress" ON public.user_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_category_id ON public.modules(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON public.modules(display_order);
CREATE INDEX IF NOT EXISTS idx_module_contents_module_id ON public.module_contents(module_id);
CREATE INDEX IF NOT EXISTS idx_module_contents_content_id ON public.module_contents(content_id);
CREATE INDEX IF NOT EXISTS idx_module_contents_display_order ON public.module_contents(display_order);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content_id ON public.user_progress(content_id);