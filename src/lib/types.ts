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
