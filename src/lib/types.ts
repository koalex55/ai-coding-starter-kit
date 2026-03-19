export type UserRole = "worker" | "admin";

export interface UserProfile {
  id: string;
  personalnummer: string;
  vorname: string;
  nachname: string;
  rolle: UserRole;
  erstellt_am: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

// --- PROJ-2: Schichterfassung & Auftragserfassung ---

export type SchichtTyp = "frueh" | "spaet" | "nacht";

export interface Auftrag {
  id: string;
  shift_id: string;
  user_id: string;
  auftragsnummer: string;
  cad_nummer?: string;
  beschreibung?: string;
  startzeit?: string; // HH:mm format
  endzeit?: string;   // HH:mm format
  notiz?: string;
}

export interface Schicht {
  id: string;
  user_id: string;
  schichttyp: SchichtTyp;
  datum: string; // YYYY-MM-DD
  regulaere_stunden: number; // decimal hours (8.75 / 8.5)
  erstellt_am: string;
  auftraege: Auftrag[];
}

// --- Input types for API requests ---

export interface CreateShiftInput {
  schichttyp: SchichtTyp;
  datum: string; // YYYY-MM-DD
}

export interface UpdateShiftInput {
  schichttyp?: SchichtTyp;
  datum?: string; // YYYY-MM-DD
}

export interface CreateOrderInput {
  auftragsnummer: string;
  cad_nummer?: string;
  beschreibung?: string;
  startzeit?: string; // HH:mm
  endzeit?: string;   // HH:mm
  notiz?: string;
}

export interface UpdateOrderInput {
  auftragsnummer?: string;
  cad_nummer?: string;
  beschreibung?: string;
  startzeit?: string | null; // HH:mm or null to clear
  endzeit?: string | null;   // HH:mm or null to clear
  notiz?: string;
}
