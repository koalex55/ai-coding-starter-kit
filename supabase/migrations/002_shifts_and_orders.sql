-- ============================================================
-- PROJ-2: Schichterfassung & Auftragserfassung
-- Tables: shifts, auftraege
-- ============================================================

-- -----------------------------------------------------------
-- shifts table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schichttyp TEXT NOT NULL CHECK (schichttyp IN ('frueh', 'spaet', 'nacht')),
  datum DATE NOT NULL,
  regulaere_stunden DECIMAL(4,2) NOT NULL,
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, datum)
);

-- Index for monthly queries by user
CREATE INDEX IF NOT EXISTS idx_shifts_user_datum ON public.shifts(user_id, datum);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own shifts
CREATE POLICY "Eigene Schichten lesen"
  ON public.shifts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Eigene Schichten erstellen"
  ON public.shifts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigene Schichten aktualisieren"
  ON public.shifts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigene Schichten loeschen"
  ON public.shifts FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- auftraege table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auftraege (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auftragsnummer TEXT NOT NULL,
  cad_nummer TEXT,
  beschreibung TEXT,
  startzeit TIME,
  endzeit TIME,
  notiz TEXT,
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_auftraege_shift ON public.auftraege(shift_id);
CREATE INDEX IF NOT EXISTS idx_auftraege_user ON public.auftraege(user_id);

-- Enable RLS
ALTER TABLE public.auftraege ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own auftraege
CREATE POLICY "Eigene Auftraege lesen"
  ON public.auftraege FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Eigene Auftraege erstellen"
  ON public.auftraege FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigene Auftraege aktualisieren"
  ON public.auftraege FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigene Auftraege loeschen"
  ON public.auftraege FOR DELETE
  USING (auth.uid() = user_id);
