CREATE TABLE public.portal_interests (
 user_id uuid NOT NULL,
 account_type text NOT NULL,
 hobbies text NOT NULL DEFAULT '',
 best_colour text NOT NULL DEFAULT '',
 favourite_dish text NOT NULL DEFAULT '',
 cartoon text NOT NULL DEFAULT '',
 celebrity text NOT NULL DEFAULT '',
 best_friend text NOT NULL DEFAULT '',
 other_interests text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, account_type)
);
GRANT ALL ON public.portal_interests TO service_role;
ALTER TABLE public.portal_interests ENABLE ROW LEVEL SECURITY;
-- Encrypted portal sessions are validated by server functions; no browser policies.
DROP POLICY IF EXISTS "Portal access to students" ON public.students;
DROP POLICY IF EXISTS "Portal access to teachers" ON public.teachers;
DROP POLICY IF EXISTS "Portal access to admins" ON public.admins;
CREATE POLICY "Public school pupil directory" ON public.students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public school teacher directory" ON public.teachers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public school admin directory" ON public.admins FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.students, public.teachers, public.admins FROM anon, authenticated;
REVOKE INSERT (name,email,photo_url,sex,nationality,"subjectsTaught","classesTaught","contactNumber",is_verified,personal_email), UPDATE (name,email,photo_url,sex,nationality,"subjectsTaught","classesTaught","contactNumber",is_verified,personal_email) ON public.teachers FROM anon, authenticated;
REVOKE INSERT (name,email,is_verified,personal_email), UPDATE (name,email,is_verified,personal_email) ON public.admins FROM anon, authenticated;
GRANT ALL ON public.students, public.teachers, public.admins TO service_role;