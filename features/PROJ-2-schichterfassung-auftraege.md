# PROJ-2: Schichterfassung & Auftragserfassung

## Status: Planned
**Created:** 2026-03-19
**Last Updated:** 2026-03-19

## Dependencies
- Requires: PROJ-1 (Authentifizierung) — eingeloggter Nutzer erforderlich

## Schichtzeiten (fest im System)
| Schichttyp | Start | Ende | Dauer |
|---|---|---|---|
| Frühschicht | 06:00 | 14:45 | 8h 45min |
| Spätschicht | 13:00 | 21:30 | 8h 30min |
| Nachtschicht | 21:30 | 06:00 (Folgetag) | 8h 30min |

## User Stories
- Als Arbeiter möchte ich eine neue Schicht für einen bestimmten Tag erfassen, damit meine Arbeitszeit dokumentiert ist.
- Als Arbeiter möchte ich den Schichttyp (Früh/Spät/Nacht) auswählen und die Zeiten werden automatisch eingetragen, damit ich nichts manuell eintippen muss.
- Als Arbeiter möchte ich einer Schicht mehrere Aufträge hinzufügen (Auftragsnummer, Beschreibung, Zeiten), damit meine Arbeit detailliert dokumentiert ist.
- Als Arbeiter möchte ich gewarnt werden, wenn Auftragszeiten sich überschneiden, damit ich Erfassungsfehler vermeiden kann.
- Als Arbeiter möchte ich eine gespeicherte Schicht bearbeiten oder löschen können, damit ich Fehler korrigieren kann.
- Als Arbeiter möchte ich eine Übersicht aller Schichten des aktuellen Monats sehen, damit ich meinen Fortschritt überblicken kann.
- Als Arbeiter möchte ich automatisch sehen, wie viele Überstunden ich in einer Schicht geleistet habe, damit ich informiert bin.

## Acceptance Criteria

### Schicht anlegen
- [ ] Kalender- oder Datumsauswahl für den Schichttag
- [ ] Auswahl des Schichttyps: Früh / Spät / Nacht — Zeiten werden automatisch befüllt
- [ ] Es kann nur eine Schicht pro Tag erstellt werden (Ausnahme: Nachtschicht zählt zum Starttag, nicht zum Folgetag)
- [ ] Versuch, eine zweite Schicht am selben Tag zu erstellen → Fehlermeldung "Für diesen Tag ist bereits eine Schicht erfasst"
- [ ] Schicht kann gespeichert werden, auch ohne Aufträge (Aufträge können später hinzugefügt werden)

### Aufträge
- [ ] Pro Schicht können beliebig viele Aufträge hinzugefügt werden
- [ ] Pflichtfelder pro Auftrag: Auftragsnummer
- [ ] Optionale Felder pro Auftrag: CAD-Nummer, Arbeitsbeschreibung, Startzeit, Endzeit, interne Notiz
- [ ] CAD-Nummer und interne Notiz werden nur intern gespeichert — erscheinen NICHT im PDF-Export
- [ ] Startzeit und Endzeit müssen innerhalb der Schichtzeit liegen
- [ ] Bei Zeitüberschneidung zweier Aufträge: orange Warnung "Auftragszeiten überschneiden sich (Auftrag X und Y)" — Speichern trotzdem möglich
- [ ] Einzelne Aufträge können bearbeitet und gelöscht werden

### Überstunden (automatisch)
- [ ] Überstunden = Summe aller Auftragszeiten MINUS reguläre Schichtdauer
- [ ] Sind keine Auftragszeiten erfasst → keine Überstundenberechnung
- [ ] Überstunden werden in der Schichtübersicht und im Stundenzettel angezeigt (Format: +1:30h)
- [ ] Negative Überstunden (weniger als regulär gearbeitet) werden nicht angezeigt — nur 0 oder positiv

### Monatsübersicht
- [ ] Liste aller Schichten des aktuellen Monats (Standard-Ansicht)
- [ ] Monatswechsel per Pfeiltasten oder Monatspicker
- [ ] Anzeige pro Schicht: Datum, Schichttyp, Anzahl Aufträge, Stunden, Überstunden
- [ ] Gesamtstunden und Gesamtüberstunden des Monats am Ende der Liste

### Bearbeiten & Löschen
- [ ] Schicht bearbeiten: Datum und Schichttyp änderbar (solange kein Konflikt entsteht)
- [ ] Schicht löschen: Bestätigungsdialog → löscht Schicht inkl. aller zugehörigen Aufträge

## Edge Cases
- Nachtschicht 21:30–06:00: Wird dem Starttag zugeordnet; am Folgetag kann trotzdem eine Früh- oder Spätschicht erfasst werden
- Auftragszeit endet nach Schichtende (z.B. Auftrag bis 15:00 bei Frühschicht bis 14:45) → Warnung "Auftragszeit liegt außerhalb der Schichtzeit"
- Alle Aufträge einer Schicht werden gelöscht → Schicht bleibt bestehen, Stunden = reguläre Schichtdauer, Überstunden = 0
- Nutzer gibt Auftrag mit Startzeit > Endzeit ein → Validierungsfehler "Startzeit muss vor Endzeit liegen"
- Monat hat noch keine Schichten → leere Monatsansicht mit Hinweis "Noch keine Schichten erfasst"

## Technical Requirements
- Zeitberechnung: Server-seitig in UTC, Anzeige in lokaler Zeit (Europe/Berlin)
- Nachtschicht-Logik: end_date = start_date + 1 Tag in der Datenbank
- Überlappungsprüfung: Client-seitig bei jeder Änderung, zusätzlich Server-seitige Validierung
- RLS: Nutzer kann nur eigene Schichten und Aufträge lesen/schreiben

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
