# PROJ-1: Authentifizierung & Benutzerverwaltung

## Status: In Progress
**Created:** 2026-03-19
**Last Updated:** 2026-03-19

## Dependencies
- None

## User Stories

### Arbeiter
- Als Arbeiter möchte ich mich mit meiner Personalnummer und meinem Passwort anmelden, damit ich auf meine Zeiterfassung zugreifen kann.
- Als Arbeiter möchte ich beim ersten Login aufgefordert werden, das Standard-Passwort zu ändern, damit mein Konto sicher ist.
- Als Arbeiter möchte ich automatisch abgemeldet werden, wenn ich die App längere Zeit nicht nutze, damit meine Daten auf geteilten Geräten geschützt sind.
- Als Arbeiter möchte ich mein Konto dauerhaft löschen können, damit alle meine persönlichen Daten entfernt werden (DSGVO).

### Admin
- Als Admin möchte ich eine Liste aller Benutzerkonten sehen (Personalnummer, Name, Status), damit ich den Überblick behalte.
- Als Admin möchte ich neue Benutzerkonten erstellen (Personalnummer + Name + Standard-Passwort), damit neue Mitarbeiter die App nutzen können.
- Als Admin möchte ich das Passwort eines Nutzers zurücksetzen, damit gesperrte Nutzer wieder Zugang erhalten.
- Als Admin möchte ich ein Konto deaktivieren und alle Daten dieses Nutzers löschen, damit ausgeschiedene Mitarbeiter keinen Zugang mehr haben und DSGVO-konform entfernt werden.

## Acceptance Criteria

### Login
- [ ] Login-Formular hat Felder für Personalnummer und Passwort
- [ ] Falsche Zugangsdaten zeigen eine allgemeine Fehlermeldung (keine Unterscheidung ob Personalnummer oder Passwort falsch)
- [ ] Nach 5 fehlgeschlagenen Logins wird das Konto für 15 Minuten gesperrt
- [ ] Nach erfolgreicher Anmeldung wird der Nutzer zu seiner Schichtübersicht weitergeleitet
- [ ] Admin wird nach Login zur Admin-Übersicht weitergeleitet

### Erstes Login / Passwort ändern
- [ ] Beim ersten Login mit dem Standard-Passwort erscheint automatisch der "Passwort ändern"-Dialog
- [ ] Das neue Passwort muss mindestens 8 Zeichen haben
- [ ] Das neue Passwort muss sich vom Standard-Passwort unterscheiden
- [ ] Nach Passwortänderung ist der Nutzer eingeloggt und kann sofort arbeiten

### Auto-Logout
- [ ] Nach 30 Minuten Inaktivität wird der Nutzer automatisch abgemeldet
- [ ] Vor dem Logout erscheint eine Warnung (z.B. "Du wirst in 2 Minuten abgemeldet")
- [ ] Jede Nutzerinteraktion (Tippen, Klicken, Scrollen) setzt den Inaktivitäts-Timer zurück

### Admin: Nutzerverwaltung
- [ ] Admin-Bereich ist nur für Nutzer mit der Rolle "admin" erreichbar
- [ ] Nutzerliste zeigt: Personalnummer, Name, Status (aktiv/gesperrt), Datum der Kontoerstellung
- [ ] Neues Konto erstellen: Felder Personalnummer (eindeutig, Pflicht), Vorname, Nachname, Standard-Passwort wird automatisch auf "1234" gesetzt
- [ ] Personalnummer kann nach Erstellung nicht mehr geändert werden
- [ ] Passwort zurücksetzen setzt das Passwort auf "1234" und setzt "Muss Passwort ändern" Flag
- [ ] Konto deaktivieren: Bestätigungsdialog "Alle Daten dieses Nutzers werden unwiderruflich gelöscht. Fortfahren?" → Bei Bestätigung: Account + alle Schichten + alle Aufträge werden gelöscht
- [ ] Nach Deaktivierung ist der Nutzer sofort ausgeloggt (wenn aktiv)

### Konto selbst löschen (Arbeiter)
- [ ] In den Einstellungen gibt es "Konto löschen"
- [ ] Bestätigungsdialog mit Passworteingabe zur Bestätigung
- [ ] Bei Bestätigung: Account + alle eigenen Daten gelöscht, Weiterleitung zum Login

## Edge Cases
- Personalnummer wird bei Erstellung dupliziert → Fehlermeldung "Personalnummer bereits vergeben"
- Admin versucht sein eigenes Konto zu deaktivieren → Nicht erlaubt, Fehlermeldung
- Nutzer ist beim Auto-Logout mitten im Erfassen einer Schicht → Daten werden lokal gespeichert (Draft), nach erneutem Login wiederhergestellt
- Standard-Passwort "1234" wird vom Nutzer nicht geändert → Jedes Mal beim Login erscheint Hinweis "Bitte ändere dein Standard-Passwort"
- Nutzer hat keine Internetverbindung beim Login → Fehlermeldung "Keine Verbindung — Login benötigt Internetverbindung"

## Technical Requirements
- Security: Supabase Auth, RLS-Policies trennen Admin- und Nutzer-Daten
- Rollen: `worker` und `admin` über Supabase `user_metadata` oder separate Tabelle
- Passwörter werden nie im Klartext gespeichert (Supabase Auth übernimmt Hashing)
- Auto-Logout: Client-seitiger Timer, kein Server-Ping erforderlich

---

## Tech Design (Solution Architect)

### Seitenstruktur
```
/login
└── LoginPage
    ├── LoginForm  (Personalnummer + Passwort)
    └── ErrorAlert

/admin
├── AdminLayout + AdminNavigation
└── AdminPage
    ├── UserListTable
    │   ├── UserRow  (Personalnr. | Name | Status | Erstellt am | Aktionen)
    │   ├── ResetPasswordButton → ResetPasswordDialog
    │   └── DeleteUserButton    → DeleteUserDialog
    └── CreateUserButton        → CreateUserDialog

/settings  (Arbeiter)
└── SettingsPage → DeleteAccountDialog

Globale Komponenten:
├── AuthProvider         (Session, Rolle, must_change_password-Flag)
├── ChangePasswordDialog (automatisch beim ersten Login)
└── InactivityWarning    (erscheint 2 Min. vor Auto-Logout)
```

### Datenmodell

**Supabase Auth** — Login, Passwörter, Sessions (automatisch verwaltet)
- Interner Login via `{personalnummer}@intern.app` (für Nutzer unsichtbar)
- Flag `muss_passwort_aendern` in Auth-Metadaten

**Tabelle `profiles`**
| Feld | Typ | Beschreibung |
|---|---|---|
| id | UUID | Verknüpfung mit Auth |
| personalnummer | Text, eindeutig | Login-Name, unveränderlich |
| vorname | Text | |
| nachname | Text | |
| rolle | worker / admin | Zugriffsrolle |
| erstellt_am | Timestamp | |

Konto löschen → Auth + profiles + Schichten + Aufträge werden kaskadierend gelöscht (RLS + ON DELETE CASCADE).

### Tech-Entscheidungen
- **Supabase Auth**: Passworthashing, JWT, Sessions out-of-the-box
- **Personalnummer als E-Mail-Alias**: `{personalnr}@intern.app` — Nutzer sieht nur "Personalnummer"-Feld
- **RLS**: Arbeiter sieht nur eigene Daten; Admin sieht nur Nutzerliste (nicht Schichten)
- **Server-API für Admin-Aktionen**: Passwort-Reset und Konto löschen laufen über geschützten API-Endpunkt (service_role key nie im Browser)
- **React AuthProvider**: Hält Session + Rolle + Flag im Memory
- **Client-seitiger Inaktivitäts-Timer**: Event-Listener auf mousemove/keydown/click/scroll

### Abhängigkeiten
- `@supabase/supabase-js` (wahrscheinlich bereits installiert)
- `@supabase/ssr` (Next.js SSR-Helfer)
- Alle UI-Komponenten bereits via shadcn/ui vorhanden

## Frontend Implementation Notes

### Pages built
- `/login` — Login page with centered card, Personalnummer + Passwort fields, Zod validation, error alert
- `/admin` — Admin layout (top nav + Abmelden) + user list table with responsive mobile card layout
- `/settings` — Settings page with "Gefahrenzone" card and delete account dialog (password confirmation)
- `/(app)` — Authenticated worker layout with top nav (Einstellungen + Abmelden), AuthProvider, ChangePasswordDialog, InactivityWarning

### Components built
- `src/components/admin/create-user-dialog.tsx` — Create user form (Personalnummer, Vorname, Nachname), info about default password
- `src/components/admin/reset-password-dialog.tsx` — Confirmation dialog showing user name, resets to 1234
- `src/components/admin/delete-user-dialog.tsx` — Destructive alert dialog with warning text

### Pre-existing components (from architecture phase)
- `src/components/auth-provider.tsx` — AuthContext with mock login/logout (fixed German umlauts)
- `src/components/change-password-dialog.tsx` — Modal dialog, cannot be dismissed (fixed German umlauts)
- `src/components/inactivity-warning.tsx` — Alert dialog with countdown (fixed German umlauts)
- `src/hooks/use-inactivity-timer.ts` — Client-side inactivity timer with 28min warning + 30min logout

### Design decisions
- Mobile-first: all touch targets min 44px, responsive table/card layout for admin user list
- All text in German with proper umlauts
- All Supabase calls stubbed with TODO comments for /backend skill
- Root page.tsx removed; home page lives in (app)/page.tsx route group
- Settings page inside (app) route group to share authenticated layout

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
