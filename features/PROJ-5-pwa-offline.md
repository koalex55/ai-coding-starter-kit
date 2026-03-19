# PROJ-5: PWA & Offline-Funktionalität

## Status: In Review
**Created:** 2026-03-19
**Last Updated:** 2026-03-19

## Dependencies
- Requires: PROJ-1 (Authentifizierung)
- Requires: PROJ-2 (Schichterfassung) — Offline-Daten betreffen Schichten/Aufträge

## User Stories
- Als Arbeiter möchte ich die App auf meinem Handy installieren (wie eine native App), damit ich schnell darauf zugreifen kann.
- Als Arbeiter möchte ich Schichten auch ohne Internetverbindung erfassen können, damit ich nicht auf WLAN angewiesen bin.
- Als Arbeiter möchte ich benachrichtigt werden, wenn ein App-Update verfügbar ist, damit ich immer die neueste Version nutze.

## Acceptance Criteria

### PWA-Installation
- [ ] App hat ein `manifest.json` mit Name, Icons (192×192, 512×512), Theme-Color und `display: standalone`
- [ ] Auf iOS (Safari): "Zum Home-Bildschirm hinzufügen" funktioniert
- [ ] Auf Android (Chrome): Installations-Banner oder "App installieren"-Button erscheint
- [ ] Auf Desktop (Chrome/Edge): App kann als Desktop-App installiert werden
- [ ] App-Icon erscheint nach Installation auf dem Homescreen

### Offline-Funktionalität
- [ ] App-Shell (HTML, CSS, JS) wird vom Service Worker gecacht → App startet auch ohne Internet
- [ ] Bereits geladene Schichten und Aufträge sind offline lesbar (aus lokalem Cache)
- [ ] Offline neue Schicht / neuen Auftrag erfassen → wird in IndexedDB/localStorage zwischengespeichert
- [ ] Wenn Verbindung wiederhergestellt → ausstehende Änderungen werden automatisch mit Supabase synchronisiert
- [ ] Synchronisationsstatus ist für den Nutzer sichtbar (z.B. kleines Icon: "✓ Synchronisiert" / "⚠ Offline — X Änderungen ausstehend")
- [ ] Konflikt (offline und online wurde dieselbe Schicht geändert) → lokale Version gewinnt, Hinweis "Konflikt aufgetreten — lokale Version wurde verwendet"

### App-Update-Benachrichtigung
- [ ] Service Worker prüft beim App-Start auf neue Version
- [ ] Wenn Update verfügbar: Banner/Toast "Update verfügbar — App neu laden?" mit Button "Jetzt aktualisieren"
- [ ] Nach Klick auf "Jetzt aktualisieren": Seite wird neu geladen mit neuer Version
- [ ] Nutzer kann Update-Hinweis schließen und später aktualisieren (Hinweis verschwindet bis nächstem App-Start nicht dauerhaft)

### Offline-Einschränkungen
- [ ] Login benötigt immer Internetverbindung — kein Offline-Login
- [ ] PDF-Export benötigt Internetverbindung (Daten müssen aktuell sein)
- [ ] Admin-Funktionen (Nutzerverwaltung, Backup) benötigen Internetverbindung

## Edge Cases
- Nutzer ist sehr lange offline (mehrere Tage) → alle offline erstellten Einträge werden beim Reconnect synchronisiert
- Sync schlägt fehl (z.B. Server-Fehler) → Fehlermeldung, Daten bleiben lokal erhalten, nächster Sync-Versuch beim nächsten App-Start
- Service Worker Update schlägt fehl → App läuft weiter mit alter Version, kein Fehler für den Nutzer
- Gerät hat sehr wenig Speicher → Cache-Größe begrenzen, älteste gecachte Daten zuerst entfernen

## Technical Requirements
- Service Worker: `next-pwa` oder manuell mit Workbox
- Offline-Datenspeicher: IndexedDB (z.B. via `idb` Library) für Schichten und Aufträge
- Sync-Strategie: Background Sync API (wo verfügbar), Fallback: Sync beim App-Start / Fokus
- Manifest: `public/manifest.json`
- Icons: `public/icons/` (mind. 192×192 und 512×512 PNG)

---

## Implementation Notes (Frontend)

### What was built
1. **next-pwa integration** (`next.config.ts`): Wraps the Next.js config with `withPWA` for automatic service worker generation. Disabled in development to avoid SW caching issues.
2. **Web App Manifest** (`public/manifest.json`): Defines app name ("Stundenzettel"), theme color, display mode (standalone), orientation (portrait), and icon references.
3. **Placeholder icons** (`public/icons/icon-192.png`, `public/icons/icon-512.png`): Minimal 1x1 placeholder PNGs. Replace with real branded icons before production.
4. **PWA meta tags** (`src/app/layout.tsx`): Added manifest link, theme-color, Apple Web App meta tags, and apple-touch-icon for iOS support.
5. **Update notification** (`src/components/pwa-update-prompt.tsx`): Listens for service worker `controllerchange`, `updatefound`, and checks for waiting SW on mount. Shows a persistent sonner toast with "Jetzt aktualisieren" action that reloads the page.
6. **Layout integration** (`src/app/(app)/layout.tsx`): `PwaUpdatePrompt` rendered inside the authenticated layout.

### What is deferred
- Full offline data sync via IndexedDB (read/write shifts offline, background sync with Supabase) is deferred as a future enhancement. A TODO comment is left in the app layout.
- Real app icons (192x192 and 512x512) need to be designed and replaced.

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
