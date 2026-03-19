# Product Requirements Document

## Vision
Eine PWA-basierte Zeiterfassungs-App für Fabrikarbeiter, die das manuelle Ausfüllen von Stundenzetteln auf Papier ersetzt. Arbeiter erfassen ihre Schichten und Aufträge digital, exportieren monatliche Stundenzettel als PDF zum Ausdrucken und Unterschreiben. Admins verwalten Benutzerkonten mit bewusst minimalen Rechten.

## Target Users

### Arbeiter (Primär)
- Fabrikarbeiter, die in Früh-, Spät- oder Nachtschicht arbeiten
- Erfassen täglich ihre Arbeitsschicht und die bearbeiteten Aufträge
- Wollen am Monatsende einen druckfertigen Stundenzettel
- Nicht unbedingt technikaffin — einfache, klare Oberfläche erforderlich

### Admin (Sekundär)
- Büropersonal oder Vorgesetzter
- Verwaltet Benutzerkonten (erstellen, Passwort zurücksetzen, deaktivieren)
- Erstellt Daten-Backups
- Kann Schichten/Aufträge von Arbeitern NICHT einsehen oder bearbeiten

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | PROJ-1: Authentifizierung & Benutzerverwaltung | Planned |
| P0 (MVP) | PROJ-2: Schichterfassung & Auftragserfassung | Planned |
| P0 (MVP) | PROJ-3: Stundenzettel & PDF-Export | Planned |
| P1 | PROJ-4: Admin-Datensicherung (Backup) | Planned |
| P1 | PROJ-5: PWA & Offline-Funktionalität | Planned |

## Success Metrics
- Arbeiter erstellt Schichterfassung in < 3 Minuten
- PDF-Export funktioniert auf iOS, Android und Desktop
- App ist offline nutzbar (Daten werden bei Verbindung synchronisiert)
- Keine Papier-Stundenzettel mehr notwendig

## Constraints
- Kleines Team, keine dedizierten DevOps-Ressourcen
- Deployment auf Vercel (kostengünstig)
- Backend via Supabase (kein eigener Server)
- App muss auf Mobilgeräten (Handy) gut bedienbar sein
- Sprache: Deutsch

## Non-Goals
- Keine digitale Unterschrift (Stundenzettel wird ausgedruckt und manuell unterschrieben)
- Kein Gehaltsabrechnungs-Modul
- Keine Urlaubs- oder Krankmeldungsverwaltung
- Kein Genehmigungsworkflow für Überstunden
- Kein Self-Service-Registrieren (nur Admin erstellt Konten)
- Keine Echtzeit-Kollaboration oder Live-Übersicht für Admin
- Keine E-Mail-Benachrichtigungen

---

Schichtzeiten (fest):
- Frühschicht: 06:00 – 14:45 Uhr (8h 45min)
- Spätschicht: 13:00 – 21:30 Uhr (8h 30min)
- Nachtschicht: 21:30 – 06:00 Uhr Folgetag (8h 30min)
