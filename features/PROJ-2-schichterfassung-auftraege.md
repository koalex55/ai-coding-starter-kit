# PROJ-2: Schichterfassung & Auftragserfassung

## Status: In Progress
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

### Seitenstruktur
```
/(app)/page.tsx  — Monatsübersicht
├── MonthNavigator          (← März 2026 →)
├── ShiftList
│   ├── ShiftCard           (Datum | Schichttyp | Aufträge | Std | Überstunden)
│   └── EmptyState
├── MonthSummary            (Gesamt-Std + Gesamt-Überstunden)
└── AddShiftButton

ShiftSheet  (Slide-in Panel)
├── ShiftForm
│   ├── DateInput           (HTML native)
│   ├── ShiftTypeSelector   (Früh / Spät / Nacht)
│   └── ShiftTimeDisplay    (schreibgeschützt, auto-befüllt)
├── OverlapWarning          (orange Alert, conditional)
├── OrderList
│   ├── OrderCard           (Auftragsnr. | Beschreibung | Zeiten)
│   └── AddOrderButton
└── SaveButton + DeleteShiftButton

OrderDialog  (Modal)
├── Auftragsnummer (Pflicht)
├── CAD-Nummer (optional, interner Hinweis)
├── Beschreibung (optional)
├── Startzeit + Endzeit (optional)
└── Notiz (optional, interner Hinweis)

DeleteShiftDialog  (AlertDialog, destruktiv)
```

### Datenmodell

**Tabelle `shifts`**
| Feld | Typ | Beschreibung |
|---|---|---|
| id | UUID | |
| user_id | UUID | FK → profiles |
| schichttyp | früh/spät/nacht | |
| datum | DATE | Starttag (Nacht = Abendtag) |
| regulaere_stunden | DECIMAL | 8.75 / 8.5 / 8.5 (fix) |
| erstellt_am | TIMESTAMPTZ | |

**Tabelle `auftraege`**
| Feld | Typ | Beschreibung |
|---|---|---|
| id | UUID | |
| shift_id | UUID | FK → shifts ON DELETE CASCADE |
| user_id | UUID | FK → profiles (RLS) |
| auftragsnummer | TEXT | Pflicht |
| cad_nummer | TEXT | Optional, intern |
| beschreibung | TEXT | Optional |
| startzeit | TIME | Optional |
| endzeit | TIME | Optional |
| notiz | TEXT | Optional, intern |

Überstunden = live berechnet (Summe Auftragszeiten − reguläre Std), nicht gespeichert.

### Tech-Entscheidungen
- **Sheet statt Seite**: Slide-in auf Mobile flüssiger als Seitenwechsel
- **Überlappung client-seitig**: Sofortfeedback + server-seitige Absicherung
- **Schichtzeiten fix im Code**: Keine DB-Tabelle, keine Admin-Konfiguration
- **Native date/time Inputs**: Kein extra Paket, nativer mobiler Picker
- **RLS auf shifts + auftraege**: Nutzer sieht nur eigene Daten

### Abhängigkeiten
Keine neuen Pakete — alle shadcn/ui-Komponenten bereits installiert.

## Implementation Notes (Frontend)

**Built on:** 2026-03-19

### Files created/updated:
- `src/lib/shifts.ts` — SHIFT_CONFIG, calculateOvertime, formatDuration, checkOrderOverlap, isTimeWithinShift, formatShiftDate, formatMonth
- `src/app/(app)/page.tsx` — Full Monatsübersicht with mock data, month navigation, shift CRUD state management
- `src/components/shifts/shift-card.tsx` — Shift card with date, type badge (Früh=blue, Spät=orange, Nacht=purple), order count, hours, overtime
- `src/components/shifts/month-navigator.tsx` — Prev/next month buttons with centered label
- `src/components/shifts/month-summary.tsx` — Total hours + overtime summary card
- `src/components/shifts/shift-sheet.tsx` — Sheet (slides from right) for create/edit shift with order management, overlap warnings
- `src/components/shifts/order-card.tsx` — Compact order card with edit/delete actions
- `src/components/shifts/order-dialog.tsx` — Modal for add/edit order with react-hook-form + Zod validation
- `src/components/shifts/delete-shift-dialog.tsx` — Destructive AlertDialog for shift deletion confirmation

### Notes:
- All Supabase/API calls are stubbed with TODO comments — ready for /backend
- Mock data array in page.tsx for visual testing
- Mobile-first: min 44px touch targets, responsive layout
- German text with proper umlauts throughout
- Uses shadcn/ui Sheet, Dialog, AlertDialog, Alert, Badge, Card, Button, Input, Textarea, Label, Form

## Implementation Notes (Backend)

**Built on:** 2026-03-19

### Database migration:
- `supabase/migrations/002_shifts_and_orders.sql` — shifts + auftraege tables with RLS policies, indexes, and constraints

### API routes created/updated:
- `src/app/api/shifts/route.ts` — GET (list with year/month filter, nested auftraege) + POST (create with uniqueness check, auto regulaere_stunden)
- `src/app/api/shifts/[id]/route.ts` — GET (single with nested auftraege) + PUT (update schichttyp/datum with conflict check) + DELETE (cascade)
- `src/app/api/shifts/[id]/orders/route.ts` — GET (list orders for shift) + POST (create order with Zod validation, soft time warnings)
- `src/app/api/shifts/[id]/orders/[orderId]/route.ts` — PUT (update order fields) + DELETE (delete order)

### Frontend wiring:
- `src/app/(app)/page.tsx` — Replaced mock data with real API fetch, loading spinner, toast errors via sonner, all CRUD wired to API
- `src/components/shifts/shift-sheet.tsx` — Full API integration for create/edit shift + order CRUD sync (create/update/delete), saving indicator
- `src/app/layout.tsx` — Added Sonner Toaster component

### Notes:
- All API routes verify auth.uid() before any DB operation
- Zod validation on all POST/PUT bodies
- German error messages throughout
- Soft warnings for times outside shift window (still saves)
- Order sync in edit mode: compares existing vs current orders to determine create/update/delete operations

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
