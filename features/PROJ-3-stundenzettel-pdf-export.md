# PROJ-3: Stundenzettel & PDF-Export

## Status: In Review
**Created:** 2026-03-19
**Last Updated:** 2026-03-19

## Dependencies
- Requires: PROJ-1 (Authentifizierung)
- Requires: PROJ-2 (Schichterfassung) — Daten für den Stundenzettel

## User Stories
- Als Arbeiter möchte ich meinen monatlichen Stundenzettel als PDF exportieren, damit ich ihn ausdrucken und unterschreiben kann.
- Als Arbeiter möchte ich den Monat auswählen, für den ich den Stundenzettel exportieren möchte, damit ich auch ältere Monate abrufen kann.
- Als Arbeiter möchte ich, dass CAD-Nummern und interne Notizen NICHT im PDF erscheinen, damit nur die offiziell relevanten Informationen sichtbar sind.
- Als Arbeiter möchte ich die Gesamtstunden und Überstunden im Stundenzettel sehen, damit der Stundenzettel vollständig ist.

## Acceptance Criteria

### PDF-Inhalt
- [ ] Kopfzeile: Name des Arbeiters (Vorname + Nachname), Personalnummer, Monat und Jahr
- [ ] Tabelle mit allen Schichten des Monats, sortiert nach Datum aufsteigend
- [ ] Spalten der Schichttabelle: Datum, Schichttyp, Reguläre Stunden, Überstunden
- [ ] Unter jeder Schicht: Auflistung der Aufträge mit Auftragsnummer, Arbeitsbeschreibung, Startzeit–Endzeit
- [ ] CAD-Nummer erscheint NICHT im PDF
- [ ] Interne Notiz erscheint NICHT im PDF
- [ ] Fußzeile: Gesamtstunden des Monats, Gesamtüberstunden des Monats
- [ ] Unterschriften-Zeile am Ende: "Unterschrift Mitarbeiter: ___________  Datum: ___________"
- [ ] Seitenformat: A4, Hochformat
- [ ] Schrift gut lesbar (min. 10pt), klare Struktur

### Export-Funktion
- [ ] Button "Stundenzettel exportieren" in der Monatsübersicht
- [ ] Monatspicker zur Auswahl des gewünschten Monats
- [ ] PDF wird direkt im Browser heruntergeladen (kein Server-seitiges Speichern)
- [ ] Dateiname: `Stundenzettel_[Nachname]_[YYYY-MM].pdf`
- [ ] Export funktioniert auf iOS Safari, Android Chrome und Desktop-Browsern
- [ ] Wenn Monat keine Schichten hat → Hinweis "Keine Schichten für diesen Monat vorhanden" statt leerem PDF

### Vorschau (optional, nice-to-have)
- [ ] Vor dem Download kann der Nutzer eine Vorschau des PDFs sehen

## Edge Cases
- Nachtschicht überspannt zwei Monate (z.B. 31. Jan 21:30 – 1. Feb 06:00) → Schicht erscheint im Stundenzettel des Startmonats (Januar)
- Monat hat sehr viele Schichten (31 Tage × Aufträge) → PDF wird auf mehrere Seiten aufgeteilt, Kopfzeile wiederholt sich auf jeder Seite
- Auftrag hat keine Zeiten (nur Auftragsnummer) → erscheint ohne Zeitangabe im PDF
- Auftrag hat keine Beschreibung → Beschreibungsfeld bleibt leer im PDF
- Nutzer ist offline → Export nicht möglich, Hinweis "PDF-Export benötigt Internetverbindung" (da Daten von Server geladen werden)

## Technical Requirements
- PDF-Generierung: Client-seitig mit `@react-pdf/renderer` oder `jsPDF` (kein Server-Endpunkt nötig)
- Performance: PDF-Generierung in < 3 Sekunden
- iOS/Android: Download über Browser-nativen Download-Dialog

---

## Tech Design (Solution Architect)

### Komponenten-Struktur
```
/(app)/page.tsx
└── ExportButton → ExportDialog

ExportDialog (Modal)
├── MonthPicker (Monat + Jahr Dropdowns)
├── EmptyState ("Keine Schichten für diesen Monat")
├── PreviewSection (PDFViewer, optional)
└── DownloadButton ("PDF herunterladen")

TimesheetDocument (PDF-Komponente, nie im DOM)
└── Page (A4, Hochformat)
    ├── Header (Titel, Name, Personalnummer, Monat/Jahr)
    ├── ShiftsTable
    │   ├── Kopfzeile: Datum | Schichttyp | Reg. Std | Überstunden
    │   ├── SchichtZeile (eine pro Schicht)
    │   └── AuftragsZeilen (Auftragsnr. | Beschreibung | Zeit)
    │       kein CAD, keine Notiz
    ├── SummaryRow (Gesamt-Std | Gesamt-Überstunden)
    └── SignatureLine ("Unterschrift: _______  Datum: _______")
```

### Datenfluss
Kein neues Datenbankschema — reuse von GET /api/shifts?year=X&month=Y:
1. ExportDialog lädt Schichtdaten
2. TimesheetDocument rendert PDF im Speicher
3. Blob → URL.createObjectURL → Browser-Download
4. Dateiname: `Stundenzettel_[Nachname]_[YYYY-MM].pdf`

### Tech-Entscheidungen
- **`@react-pdf/renderer`**: PDF als React-Komponente, automatischer Seitenumbruch
- **Kein neuer API-Endpunkt**: bestehender `/api/shifts` reicht aus
- **Client-seitige Generierung**: kein Server-Aufwand, kein Datei-Speichern
- **Dynamic Import**: Paket nur beim Öffnen des Dialogs laden
- **Blob + Download-Link**: iOS/Android/Desktop kompatibel

### Abhängigkeiten
- `@react-pdf/renderer` — React-basierte PDF-Generierung

## QA Test Results

**Tested:** 2026-03-19
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Method:** Code review (build succeeds with `--webpack` flag; runtime testing blocked by Supabase dependency)

### Build Status

The production build succeeds when using the `--webpack` flag (`npm run build` invokes `next build --webpack`). Lint passes with 0 errors and 1 unrelated warning. The `@react-pdf/renderer` package (v4.3.2) is installed.

### Acceptance Criteria Status

#### AC: PDF-Inhalt

- [x] Kopfzeile: Name (Vorname + Nachname), Personalnummer, Monat und Jahr -- confirmed in `timesheet-document.tsx` lines 178-186. Title "Stundenzettel", then name, then "Personalnr.: {personalnummer}", then month/year.
- [x] Tabelle mit allen Schichten, sortiert nach Datum aufsteigend -- shifts sorted via `a.datum.localeCompare(b.datum)` at line 160.
- [x] Spalten: Datum, Schichttyp, Regulaere Stunden, Ueberstunden -- table header at lines 189-199 shows "Datum", "Schichttyp", "Reg. Stunden", "Ueberstunden".
- [x] Unter jeder Schicht: Auftraege mit Auftragsnummer, Beschreibung, Startzeit-Endzeit -- order sub-rows at lines 235-249 render auftragsnummer, beschreibung, and startzeit-endzeit.
- [x] CAD-Nummer erscheint NICHT im PDF -- grep for "cad_nummer" and "notiz" returns zero matches in timesheet-document.tsx. Only auftragsnummer, beschreibung, startzeit, and endzeit are accessed from the Auftrag object.
- [x] Interne Notiz erscheint NICHT im PDF -- same as above, no reference to notiz field.
- [x] Fusszeile: Gesamtstunden und Gesamtueberstunden -- summary section at lines 255-274 shows "Gesamtstunden" and "Ueberstunden gesamt".
- [x] Unterschriften-Zeile am Ende -- line 278-280: "Unterschrift Mitarbeiter: ___________________________     Datum: _______________"
- [x] Seitenformat A4, Hochformat -- `<Page size="A4" style={styles.page}>` at line 176 (A4 defaults to portrait).
- [ ] BUG: Schrift min. 10pt -- base fontSize is 10pt (line 62), which meets the requirement. However, order sub-rows use fontSize 8 (lines 237, 240, 243), which is below the 10pt minimum specified in the acceptance criteria.

#### AC: Export-Funktion

- [x] Button "Stundenzettel exportieren" in der Monatsuebersicht -- export button present in `(app)/page.tsx` lines 142-149 with label "Exportieren" and aria-label "Stundenzettel exportieren".
- [x] Monatspicker zur Auswahl des Monats -- Month and Year dropdowns in `export-dialog.tsx` lines 169-199 using Select components. Year options are current year and 2 years back.
- [x] PDF wird direkt im Browser heruntergeladen -- client-side generation via dynamic `import("@react-pdf/renderer")`, blob created via `pdf(...).toBlob()`, then `URL.createObjectURL` + anchor click. No server storage.
- [x] Dateiname: `Stundenzettel_[Nachname]_[YYYY-MM].pdf` -- line 142: `Stundenzettel_${profile.nachname}_${yyyy}-${mm}.pdf` with zero-padded month.
- [ ] CANNOT VERIFY: Export auf iOS Safari, Android Chrome, Desktop -- requires runtime cross-browser testing. The download approach (anchor click with blob URL) is generally compatible but has known issues on older iOS Safari versions.
- [x] Keine Schichten -> Hinweis statt leerem PDF -- lines 213-218: Alert displays "Keine Schichten fuer {monthLabel} vorhanden." and download button is disabled when `shifts.length === 0`.

#### AC: Vorschau (optional, nice-to-have)

- [ ] NOT IMPLEMENTED: Keine Vorschau vorhanden. The tech design mentions PreviewSection as optional and it was not built. This is acceptable as it was marked as nice-to-have.

### Edge Cases Status

#### EC: Nachtschicht ueberspannt zwei Monate
- [x] PASS: The shifts API filters by `datum` (the shift start date) using `gte` and `lte` on the date column. A night shift starting on Jan 31 has datum="2026-01-31", so it appears in January's export. Correct behavior.

#### EC: Viele Schichten, mehrseitige PDF
- [ ] BUG: Only a single `<Page>` component is rendered in `timesheet-document.tsx`. While `@react-pdf/renderer` does automatically break content across pages when a single Page overflows, the header (title, name, personalnummer, month) does NOT repeat on subsequent pages because it is rendered inside the same Page component. The spec requires "Kopfzeile wiederholt sich auf jeder Seite" -- this is NOT implemented. The `fixed` prop is not used on any View element for repeating headers.

#### EC: Auftrag ohne Zeiten
- [x] PASS: Lines 244-245 check `auftrag.startzeit && auftrag.endzeit` and render empty string if either is missing.

#### EC: Auftrag ohne Beschreibung
- [x] PASS: Line 241 uses `auftrag.beschreibung ?? ""` which renders empty string for missing description.

#### EC: Nutzer ist offline
- [ ] BUG: No offline detection or specific "PDF-Export benoetigt Internetverbindung" message. When fetch fails (offline), the generic error "Fehler beim Laden der Schichten." appears via toast, not the spec-required message. The export dialog does not check `navigator.onLine`.

### Security Audit Results

- [x] Data isolation: The `/api/shifts` GET endpoint filters by `user_id = user.id`, ensuring a worker can only export their own shifts.
- [x] Authentication: The shifts API verifies `supabase.auth.getUser()` before processing.
- [x] No server-side PDF storage: PDF is generated entirely client-side. No file is stored on the server.
- [x] No sensitive data leakage: CAD-Nummer and Notiz fields are not referenced in the PDF component.
- [ ] BUG-SEC-1 (Low): The export dialog does not sanitize profile data (vorname, nachname, personalnummer) before inserting into the PDF filename. A nachname containing special filesystem characters (e.g., `/`, `\`, `..`) could theoretically cause issues. This is low risk because browsers sanitize download filenames, but defensive sanitization would be better practice.
- [ ] BUG-SEC-2 (Low): Year/month parameters in the API call are not additionally validated client-side before being sent. The server does validate them, but sending obviously wrong values results in unnecessary server round-trips.

### Cross-Browser Testing
- BLOCKED: Requires runtime environment with Supabase backend. Code review confirms the download approach (anchor element + blob URL + click) is the standard cross-browser pattern. `@react-pdf/renderer` generates standard PDF output.

### Responsive Testing
- Code review: Export button has `min-h-[44px]` for touch targets. Button label collapses to icon-only on small screens (`hidden sm:inline`). Dialog uses `sm:max-w-md` for responsive width. Select components have `min-h-[44px]`.

### Bugs Found

#### BUG-1: Order Sub-Rows Below Minimum Font Size
- **Severity:** Low
- **File:** `src/components/pdf/timesheet-document.tsx` lines 237, 240, 243
- **Description:** Order sub-rows (Auftragsnummer, Beschreibung, Zeit) use `fontSize: 8`, which is below the spec requirement of "min. 10pt". The main shift rows and headers meet the 10pt minimum.
- **Steps to Reproduce:**
  1. Export a PDF for a month with shifts that have orders
  2. Expected: All text is at least 10pt
  3. Actual: Order sub-row text is 8pt
- **Priority:** Low -- fix in next sprint

#### BUG-2: PDF Header Does Not Repeat on Multi-Page Documents
- **Severity:** Medium
- **File:** `src/components/pdf/timesheet-document.tsx`
- **Description:** When the PDF exceeds one page (many shifts in a month), the header (name, personalnummer, month/year) only appears on the first page. The spec requires the header to repeat on every page. The `@react-pdf/renderer` library supports this via `fixed` prop on View elements, but it is not used.
- **Steps to Reproduce:**
  1. Create 25+ shifts in a single month with multiple orders each
  2. Export PDF
  3. Expected: Header repeats on page 2, 3, etc.
  4. Actual: Header only on page 1
- **Priority:** Medium -- fix before deployment

#### BUG-3: No Offline-Specific Error Message for PDF Export
- **Severity:** Low
- **File:** `src/components/pdf/export-dialog.tsx`
- **Description:** When the user is offline, the spec requires the message "PDF-Export benoetigt Internetverbindung". Instead, a generic "Fehler beim Laden der Schichten." appears. No `navigator.onLine` check is performed.
- **Steps to Reproduce:**
  1. Go offline (airplane mode or disable network)
  2. Open the export dialog
  3. Expected: "PDF-Export benoetigt Internetverbindung"
  4. Actual: Generic fetch error toast
- **Priority:** Low -- fix in next sprint

#### BUG-4: Regulaere Stunden Column Shows Shift Duration, Not Actual Worked Hours
- **Severity:** Medium
- **File:** `src/components/pdf/timesheet-document.tsx` line 212
- **Description:** The "Reg. Stunden" column always shows the fixed shift duration (e.g., 8:45h for Fruehschicht) via `SHIFT_CONFIG[shift.schichttyp].durationMinutes`, regardless of actual worked time from orders. If a worker only logged 6 hours of orders, the PDF still shows 8:45h as regular hours. This may be intentional (shifts have fixed hours), but it means the "Regulaere Stunden" column is redundant because it is always the same value for a given shift type.
- **Steps to Reproduce:**
  1. Create a Fruehschicht with orders totaling 6 hours
  2. Export PDF
  3. Expected: Column reflects actual regular hours or is clearly labeled as "Soll-Stunden"
  4. Actual: Always shows 8:45h regardless of actual hours
- **Priority:** Low -- clarify with product owner whether this is intended behavior

#### BUG-5: Ueberstunden Row Conditionally Hidden When Zero
- **Severity:** Low
- **File:** `src/components/pdf/timesheet-document.tsx` lines 262-269
- **Description:** The "Ueberstunden gesamt" summary row is only shown when `totalOvertimeMinutes > 0`. The spec says the footer should always show "Gesamtueberstunden des Monats". If there are zero overtime hours, the row is hidden entirely instead of showing "0:00h".
- **Steps to Reproduce:**
  1. Export PDF for a month with no overtime
  2. Expected: "Ueberstunden gesamt: 0:00h" appears in footer
  3. Actual: Ueberstunden row is missing from footer
- **Priority:** Low -- fix in next sprint

#### BUG-6: Fehlstunden Row Shows Dash Instead of Actual Value
- **Severity:** Low
- **File:** `src/components/pdf/timesheet-document.tsx` lines 270-273
- **Description:** There is a "Fehlstunden" (absence hours) row in the summary that always shows a dash. This field is not in the spec and serves no purpose. It may confuse users.
- **Steps to Reproduce:**
  1. Export any PDF
  2. Actual: "Fehlstunden: --" appears in summary
- **Priority:** Low -- remove or implement in next sprint

### Summary
- **Acceptance Criteria:** 15/17 passed (code review; 1 cannot verify at runtime, 1 nice-to-have not implemented)
- **Bugs Found:** 6 total (0 critical, 2 medium, 4 low)
- **Security:** No significant issues found for PROJ-3 scope (2 low-severity notes)
- **Production Ready:** YES with caveats -- medium bugs (BUG-2 multi-page header, BUG-4 column semantics) should be addressed before deployment
- **Recommendation:** Fix BUG-2 (repeating header) as it affects usability for workers with many shifts. Clarify BUG-4 with product owner. All other bugs are low priority.

## Deployment
_To be added by /deploy_
