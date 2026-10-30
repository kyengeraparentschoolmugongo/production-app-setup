CREATE TABLE public.admins (
  created_at timestamptz NOT NULL DEFAULT now(),
  email text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_verified boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  password_hash text,
  personal_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.classes (
  created_at timestamptz NOT NULL DEFAULT now(),
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text,
  title text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.streams (
  class_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text,
  title text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.students (
  class_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  default_password text,
  email text NOT NULL,
  gender text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_verified boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  password_hash text NOT NULL,
  personal_email text,
  photo_url text,
  stream_id text
);
CREATE TABLE public.teachers (
  "classesTaught" text,
  "contactNumber" bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  default_password bigint,
  email text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_verified boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  nationality text,
  password_hash text,
  personal_email text,
  photo_url text,
  sex text,
  "subjectsTaught" text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.attendance_records (
  created_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marked_by uuid,
  status text NOT NULL DEFAULT 'present',
  stream_id text,
  student_id uuid,
  UNIQUE (student_id, date)
);
CREATE TABLE public.electoral_rows (
  created_at timestamptz NOT NULL DEFAULT now(),
  description text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  title text NOT NULL
);
CREATE TABLE public.electoral_applications (
  age integer, class_name text, class_teacher_name text, class_teacher_tel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  experience text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name text, parent_tel text, position text, qualifications text, sex text,
  status text NOT NULL DEFAULT 'pending',
  stream_name text, student_email text, student_id uuid, student_name text, student_photo text,
  submitted_at timestamptz DEFAULT now(),
  why_apply text
);
CREATE TABLE public.electoral_votes (
  browser text, candidate_id text, candidate_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  device_type text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text, language text, latitude text, location_accuracy text, longitude text, os text, position text, screen_resolution text, timezone text, vote_status text,
  voted_at timestamptz NOT NULL DEFAULT now(),
  voter_id text, voter_name text
);
CREATE TABLE public.physical_votes (
  added_at timestamptz DEFAULT now(),
  candidate_id text, candidate_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notes text, position text,
  votes_count integer NOT NULL DEFAULT 0
);

DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['admins','classes','streams','students','teachers','attendance_records','electoral_rows','electoral_applications','electoral_votes','physical_votes'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', 'Portal access to '||t, t);
END LOOP; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS students_normalized_email_unique ON public.students (lower(trim(email)));
CREATE TABLE public.student_google_accounts (
 student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
 auth_user_id uuid NOT NULL UNIQUE,
 google_email text NOT NULL,
 linked_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.student_google_accounts TO service_role;
ALTER TABLE public.student_google_accounts ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.portal_auth_attempts (
 attempt_key text PRIMARY KEY,
 attempts integer NOT NULL DEFAULT 0,
 started_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.portal_auth_attempts TO service_role;
ALTER TABLE public.portal_auth_attempts ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.consume_portal_auth_attempt(p_key text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
 INSERT INTO public.portal_auth_attempts (attempt_key, attempts) VALUES (p_key, 1)
 ON CONFLICT (attempt_key) DO UPDATE SET
 attempts = CASE WHEN portal_auth_attempts.started_at < now() - interval '15 minutes' THEN 1 ELSE portal_auth_attempts.attempts + 1 END,
 started_at = CASE WHEN portal_auth_attempts.started_at < now() - interval '15 minutes' THEN now() ELSE portal_auth_attempts.started_at END
 RETURNING attempts INTO n;
 RETURN n <= 5;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_portal_auth_attempt(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_portal_auth_attempt(text) TO service_role;
CREATE OR REPLACE FUNCTION public.connect_student_google(p_auth_user_id uuid, p_email text, p_name text, p_student_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_student uuid; v_existing uuid; v_email text := lower(trim(p_email));
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('google:' || p_auth_user_id::text, 0));
 PERFORM pg_advisory_xact_lock(hashtextextended('email:' || v_email, 0));
 SELECT student_id INTO v_existing FROM public.student_google_accounts WHERE auth_user_id = p_auth_user_id;
 IF v_existing IS NOT NULL THEN
  IF p_student_id IS NOT NULL AND p_student_id <> v_existing THEN RAISE EXCEPTION 'Google account already linked'; END IF;
  RETURN v_existing;
 END IF;
 IF EXISTS (SELECT 1 FROM public.admins WHERE lower(trim(email)) = v_email) OR EXISTS (SELECT 1 FROM public.teachers WHERE lower(trim(email)) = v_email) THEN
  RAISE EXCEPTION 'Use staff portal sign-in';
 END IF;
 SELECT id INTO v_existing FROM public.students WHERE lower(trim(email)) = v_email;
 IF p_student_id IS NULL THEN
  IF v_existing IS NOT NULL THEN RAISE EXCEPTION 'Existing portal password required'; END IF;
  INSERT INTO public.students (name, email, password_hash, is_verified) VALUES (p_name, v_email, 'google$' || gen_random_uuid()::text, true) RETURNING id INTO v_student;
 ELSE
  v_student := p_student_id;
  PERFORM 1 FROM public.students WHERE id = v_student FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found'; END IF;
  IF v_existing IS NOT NULL AND v_existing <> v_student THEN RAISE EXCEPTION 'Email belongs to another student'; END IF;
 END IF;
 INSERT INTO public.student_google_accounts (student_id, auth_user_id, google_email) VALUES (v_student, p_auth_user_id, v_email);
 RETURN v_student;
END;
$$;
REVOKE ALL ON FUNCTION public.connect_student_google(uuid,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.connect_student_google(uuid,text,text,uuid) TO service_role;
REVOKE SELECT ON public.students FROM anon, authenticated;
GRANT SELECT (id, name, class_id, stream_id, photo_url, gender, created_at) ON public.students TO anon, authenticated;
GRANT ALL ON public.students TO service_role;
REVOKE ALL ON public.admins, public.teachers FROM anon, authenticated;
GRANT ALL ON public.admins, public.teachers TO service_role;
REVOKE ALL ON public.student_google_accounts, public.portal_auth_attempts FROM anon, authenticated;
GRANT ALL ON public.student_google_accounts, public.portal_auth_attempts TO service_role;
REVOKE INSERT, UPDATE, SELECT ON public.teachers FROM anon, authenticated;
GRANT SELECT (id, name, email, personal_email, nationality, sex, "contactNumber", "subjectsTaught", "classesTaught", photo_url, default_password, is_verified, created_at, updated_at) ON public.teachers TO anon, authenticated;
GRANT INSERT (id, name, email, nationality, sex, "contactNumber", "subjectsTaught", "classesTaught", photo_url, default_password, is_verified, created_at, updated_at) ON public.teachers TO anon, authenticated;
GRANT UPDATE (name, email, nationality, sex, "contactNumber", "subjectsTaught", "classesTaught", photo_url, is_verified, updated_at) ON public.teachers TO anon, authenticated;
REVOKE INSERT, UPDATE, SELECT ON public.admins FROM anon, authenticated;
GRANT SELECT (id, name, email, personal_email, is_verified, created_at, updated_at) ON public.admins TO anon, authenticated;
GRANT UPDATE (name, is_verified, updated_at) ON public.admins TO anon, authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS teachers_email_lower_key ON public.teachers (lower(trim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_lower_key ON public.admins (lower(trim(email)));
CREATE TABLE public.coordinator_settings (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), voting_open boolean NOT NULL DEFAULT true, applications_open boolean NOT NULL DEFAULT true, results_public boolean NOT NULL DEFAULT true, announcement text, voting_starts_at timestamptz, voting_ends_at timestamptz, page_views bigint NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now(), CHECK (voting_starts_at IS NULL OR voting_ends_at IS NULL OR voting_ends_at > voting_starts_at));
GRANT ALL ON public.coordinator_settings TO service_role;
ALTER TABLE public.coordinator_settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.coordinator_applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE REFERENCES public.students(id), student_name text NOT NULL, class_name text NOT NULL CHECK (class_name IN ('P1','P2','P3','P4','P5','P6','P7')), stream_name text CHECK (stream_name IN ('Orange','Violet')), age integer CHECK (age BETWEEN 6 AND 15), position text NOT NULL CHECK (position IN ('english_coordinator','science_coordinator','social_studies_coordinator','mathematics_coordinator','religious_education_coordinator')), experience text, manifesto text NOT NULL DEFAULT '', photo_url text, manifesto_photos text[] NOT NULL DEFAULT '{}', youtube_url text, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')), view_count bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,position));
GRANT ALL ON public.coordinator_applications TO service_role;
ALTER TABLE public.coordinator_applications ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.coordinator_votes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), voter_id uuid NOT NULL REFERENCES public.students(id), application_id uuid NOT NULL, position text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(voter_id,position), FOREIGN KEY(application_id,position) REFERENCES public.coordinator_applications(id,position) ON DELETE CASCADE);
GRANT ALL ON public.coordinator_votes TO service_role;
ALTER TABLE public.coordinator_votes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.coordinator_commission_roles (user_id uuid PRIMARY KEY REFERENCES public.students(id), granted_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.coordinator_commission_roles TO service_role;
ALTER TABLE public.coordinator_commission_roles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.validate_coordinator_vote() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE s public.coordinator_settings; candidate_status text;
BEGIN
 SELECT * INTO s FROM public.coordinator_settings WHERE id=1 FOR SHARE;
 IF NOT FOUND OR NOT s.voting_open OR (s.voting_starts_at IS NOT NULL AND now()<s.voting_starts_at) OR (s.voting_ends_at IS NOT NULL AND now()>s.voting_ends_at) THEN RAISE EXCEPTION 'Voting is not open'; END IF;
 SELECT status INTO candidate_status FROM public.coordinator_applications WHERE id=NEW.application_id AND position=NEW.position FOR SHARE;
 IF candidate_status IS DISTINCT FROM 'approved' THEN RAISE EXCEPTION 'This candidate is not approved for this position'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER coordinator_vote_integrity BEFORE INSERT ON public.coordinator_votes FOR EACH ROW EXECUTE FUNCTION public.validate_coordinator_vote();
CREATE FUNCTION public.coordinator_record_view(_candidate uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF _candidate IS NULL THEN UPDATE public.coordinator_settings SET page_views=page_views+1 WHERE id=1; ELSE UPDATE public.coordinator_applications SET view_count=view_count+1 WHERE id=_candidate AND status='approved'; END IF; END $$;
REVOKE ALL ON FUNCTION public.coordinator_record_view(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.coordinator_record_view(uuid) TO service_role;
REVOKE ALL ON public.coordinator_settings,public.coordinator_applications,public.coordinator_votes,public.coordinator_commission_roles FROM anon,authenticated;
REVOKE ALL ON FUNCTION public.validate_coordinator_vote() FROM PUBLIC,anon,authenticated;
INSERT INTO public.coordinator_settings (id) VALUES (1) ON CONFLICT DO NOTHING;