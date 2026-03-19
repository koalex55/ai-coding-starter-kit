# PROJ-1: Authentifizierung & Benutzerverwaltung

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
