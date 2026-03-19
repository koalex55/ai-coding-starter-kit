-- ============================================================
-- PROJ-1: Authentifizierung & Benutzerverwaltung
-- Initial schema: profiles + login_attempts
-- ============================================================

-- -----------------------------------------------------------
-- profiles table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  personalnummer TEXT UNIQUE NOT NULL,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  rolle TEXT NOT NULL DEFAULT 'worker' CHECK (rolle IN ('worker', 'admin')),
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on personalnummer for login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_personalnummer ON public.profiles(personalnummer);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Workers can read their own profile
CREATE POLICY "Arbeiter: eigenes Profil lesen"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admin: alle Profile lesen"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.rolle = 'admin'
    )
  );

-- Workers can update their own profile (name changes etc.)
CREATE POLICY "Arbeiter: eigenes Profil aktualisieren"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT is only allowed via service_role (admin API creates users).
-- No INSERT policy for authenticated users -- the admin API route uses
-- the service_role client which bypasses RLS.

-- DELETE cascades from auth.users. No direct delete policy needed for
-- authenticated users -- deletion happens through the admin API with
-- service_role or through Supabase Auth user deletion.

-- -----------------------------------------------------------
-- login_attempts table (for lockout logic)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personalnummer TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Composite index for lockout query (recent failed attempts per personalnummer)
CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup
  ON public.login_attempts(personalnummer, attempted_at);

-- Enable RLS but add NO policies -- this table is only accessed via
-- the service_role client in API routes. Authenticated users cannot
-- read or write to this table.
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
