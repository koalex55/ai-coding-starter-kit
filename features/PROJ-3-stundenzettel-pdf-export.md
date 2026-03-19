# PROJ-3: Stundenzettel & PDF-Export

## Status: In Progress
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
