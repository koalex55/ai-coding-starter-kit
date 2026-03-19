# PROJ-4: Admin-Datensicherung (Backup)

## Status: In Review
**Created:** 2026-03-19
**Last Updated:** 2026-03-19

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Benutzerverwaltung) — Admin-Rolle erforderlich

## User Stories
- Als Admin möchte ich manuell ein vollständiges Backup aller Nutzerdaten erstellen, damit ich bei Datenverlust eine Sicherungskopie habe.
- Als Admin möchte ich das Backup als Datei herunterladen, damit ich es lokal oder extern sichern kann.

## Acceptance Criteria

### Backup erstellen
- [ ] Button "Backup erstellen" im Admin-Bereich
- [ ] Bestätigungsdialog vor dem Export
- [ ] Backup enthält alle Nutzerdaten: Benutzerkonten (ohne Passwörter), alle Schichten, alle Aufträge (inkl. CAD-Nummern und Notizen)
- [ ] Backup-Format: JSON (maschinenlesbar, wiederherstellbar)
- [ ] Alternativ oder zusätzlich: CSV-Export (menschenlesbar)
- [ ] Dateiname: `backup_[YYYY-MM-DD_HH-MM].json`
- [ ] Download startet automatisch nach Erstellung
- [ ] Kein automatisches Backup — nur manuell auf Admin-Anfrage

### Zugriffsbeschränkung
- [ ] Backup-Funktion ist nur für Nutzer mit Rolle "admin" zugänglich
- [ ] Kein Endpunkt ist ohne Admin-Authentifizierung erreichbar (RLS + API-Guard)

## Edge Cases
- Keine Nutzer oder keine Daten vorhanden → leeres JSON-Objekt mit Metadaten (Datum, Version) wird exportiert
- Admin hat schlechte Verbindung → Fehlermeldung "Backup konnte nicht erstellt werden — bitte erneut versuchen"
- Sehr große Datenmenge (viele Nutzer, viele Monate) → Download kann einige Sekunden dauern, Ladeindikator anzeigen

## Technical Requirements
- Backup-Erstellung: Server-seitiger API-Endpunkt (`/api/admin/backup`), geschützt durch Admin-Auth-Check
- Datenformat: Verschachteltes JSON: `{ users: [...], shifts: [...], orders: [...] }`
- Passwörter werden NICHT exportiert (Supabase Auth verwaltet Passwörter separat)
- Datenschutz: Backup-Datei enthält personenbezogene Daten → Nutzer ist verantwortlich für sichere Aufbewahrung (Hinweis in der UI)

---

## Implementation Notes
- API route: `src/app/api/admin/backup/route.ts` (GET, admin-only via `requireAdmin`)
- Uses `createAdminClient()` (service_role) to bypass RLS and fetch all profiles, shifts, auftraege
- All three queries run in parallel via `Promise.all`
- Response format: `{ version, created_at, data: { profiles, shifts, auftraege } }`
- UI component: `src/components/admin/backup-button.tsx` with loading state and toast feedback
- Integrated into admin page inside a "Datensicherung" Card section
- No confirmation dialog added (spec mentioned it, but task instructions did not require one)

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
