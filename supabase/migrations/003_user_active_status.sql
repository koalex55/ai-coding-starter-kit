-- ============================================================
-- BUG-4: Add aktiv/gesperrt status to user profiles
-- ============================================================

-- Add aktiv column (defaults to true for existing and new users)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS aktiv BOOLEAN NOT NULL DEFAULT true;

-- Admin can update any profile (for toggling aktiv status)
-- The service_role client bypasses RLS, but this policy also allows
-- admin users to update profiles via the regular authenticated client.
CREATE POLICY "Admin: alle Profile aktualisieren"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.rolle = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.rolle = 'admin'
    )
  );
