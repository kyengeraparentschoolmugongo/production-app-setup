ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS photo_url text;
GRANT SELECT (photo_url) ON public.admins TO anon, authenticated;
GRANT ALL ON public.admins TO service_role;