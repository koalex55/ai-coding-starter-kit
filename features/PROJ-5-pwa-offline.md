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

**Tested:** 2026-03-19
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Method:** Code review + build verification (no live browser testing)

### Build Status

The build succeeds with `npm run build` (which uses `next build --webpack`). The `@ducanh2912/next-pwa` plugin generates `public/sw.js` and `public/workbox-c2c0676f.js` correctly. The previous PROJ-1 QA noted a Turbopack/next-pwa incompatibility; this has been resolved by setting the build script to `next build --webpack` in package.json.

### Acceptance Criteria Status

#### AC: PWA-Installation

- [x] App has `manifest.json` with Name ("Stundenzettel"), Icons (192x192, 512x512), theme_color ("#0f172a"), and `display: standalone` -- confirmed in `public/manifest.json`
- [ ] **FAIL** -- iOS Safari "Zum Home-Bildschirm hinzufügen": Meta tags are present (`apple-mobile-web-app-capable`, `apple-touch-icon`), but icons are 1x1 pixel placeholders. A 1x1 PNG will render as a blank/invisible icon on the homescreen. Cannot verify actual iOS behavior via code review alone.
- [ ] **PARTIAL** -- Android Chrome install banner: The manifest and service worker are correctly configured, which should trigger Chrome's install prompt. However, the 1x1 placeholder icons will produce a broken visual experience.
- [ ] **PARTIAL** -- Desktop Chrome/Edge install: Same as above -- technically installable, but icons are 1x1 pixel placeholders.
- [ ] **FAIL** -- App icon on homescreen: Both `icon-192.png` and `icon-512.png` are 1x1 pixel PNGs (70 bytes each). The manifest declares them as 192x192 and 512x512 respectively, but the actual image data is 1x1. This will result in an invisible or blank icon on all platforms.

#### AC: Offline-Funktionalitaet

- [x] App-Shell caching: The generated `sw.js` uses Workbox `precacheAndRoute` to cache all Next.js static assets (JS chunks, CSS, images, manifest). The start URL `/` uses `NetworkFirst` strategy, so the app shell will load from cache when offline. PASS.
- [ ] **FAIL** -- Offline-readable shifts/orders: No IndexedDB or localStorage implementation exists for caching shift/order data. The implementation notes confirm this is "deferred as a future enhancement." Completely missing.
- [ ] **FAIL** -- Offline shift/order creation via IndexedDB/localStorage: Not implemented. No offline data store exists anywhere in the codebase.
- [ ] **FAIL** -- Auto-sync when connection restored: Not implemented. No Background Sync API integration, no online/offline event listeners for sync, no sync queue.
- [ ] **FAIL** -- Sync status indicator visible to user: Not implemented. No UI element shows "Synchronisiert" / "Offline -- X Aenderungen ausstehend" anywhere.
- [ ] **FAIL** -- Conflict resolution (local wins + notification): Not implemented. No conflict detection or resolution logic exists.

#### AC: App-Update-Benachrichtigung

- [x] Service Worker checks for new version on app start: `PwaUpdatePrompt` checks `registration.waiting` on mount and listens for `updatefound` events. PASS.
- [ ] **PARTIAL** -- Update toast text: Toast shows "Update verfuegbar" with description "Eine neue Version der App ist bereit." and button "Jetzt aktualisieren". The spec requires "Update verfuegbar -- App neu laden?" as the message text. The wording deviates from the spec but is functionally equivalent.
- [x] After clicking "Jetzt aktualisieren", page reloads via `window.location.reload()`. PASS.
- [ ] **FAIL** -- User can dismiss update and see it again next app start: The toast uses `duration: Infinity` (persistent), but sonner toasts have a dismiss/close button by default. Once dismissed, the toast will not reappear until the next `controllerchange` or `updatefound` event, which only fires once per SW lifecycle. The spec requires the hint to persist (not disappear permanently) until next app start. Once dismissed, it is gone for the session with no mechanism to re-show it on next mount/navigation.

#### AC: Offline-Einschraenkungen

- [x] Login requires internet: Login calls `POST /api/auth/login` which requires network. No offline login mechanism exists. PASS.
- [x] PDF export requires internet: PDF generation happens server-side / fetches data from Supabase. No offline PDF export exists. PASS.
- [x] Admin functions require internet: Admin routes call API endpoints that require network. PASS.

### Edge Cases Status

- [ ] **FAIL** -- Long offline period sync: Not applicable because offline data storage is not implemented at all.
- [ ] **FAIL** -- Sync failure retry: Not applicable because sync is not implemented.
- [x] Service Worker update failure: The `@ducanh2912/next-pwa` / Workbox setup handles SW update failures gracefully -- app continues running with the old cached version. PASS.
- [x] Low storage / cache size limits: The generated SW uses `ExpirationPlugin` with `maxEntries` limits on all cache categories (e.g., 64 for images, 48 for JS, 32 for pages). Old entries are automatically evicted. PASS.

### Security Audit

- [x] Service Worker scope is correctly limited to `/` (same-origin only)
- [x] SW does not cache `/api/auth/callback` paths (explicit exclusion in the generated SW code)
- [ ] **BUG-SEC-1 (Medium):** The SW caches GET requests to `/api/*` endpoints with `NetworkFirst` strategy and a 10-second timeout. If the network is slow, API responses (potentially containing sensitive user data) will be served from the SW cache. This could leak data if a shared device scenario occurs -- User A logs out, User B uses the device, and cached API responses from User A are served before the network responds.
- [ ] **BUG-SEC-2 (Low):** The `manifest.json` `start_url` is `/` which redirects to the login page for unauthenticated users. This is acceptable, but the SW precaches all page chunks including `/admin` and `/settings` pages. While these are just JS bundles (no data), it slightly increases the attack surface on shared devices.
- [x] No secrets or API keys in the SW or manifest
- [ ] **Note:** `Strict-Transport-Security` header is still missing from `next.config.ts` headers (previously reported in PROJ-1 QA as BUG-SEC-3). The security rules in `.claude/rules/security.md` require it.

### Cross-Browser Testing

- BLOCKED: Code review only, no live browser available. Manual testing needed on:
  - Chrome (Android + Desktop): Install prompt, SW registration, offline shell
  - Safari (iOS): Add to Home Screen, apple-touch-icon rendering
  - Firefox (Desktop): SW registration, offline shell
  - Edge (Desktop): Install prompt

### Responsive Testing

- NOT APPLICABLE: PROJ-5 adds no new visible UI components. The `PwaUpdatePrompt` renders a sonner toast which is already responsive. No responsive issues expected from this feature.

### Bugs Found

#### BUG-1: Icons Are 1x1 Pixel Placeholders (Declared as 192x192 / 512x512)
- **Severity:** High
- **Steps to Reproduce:**
  1. Install the PWA on any device (iOS, Android, Desktop)
  2. Expected: App icon visible on homescreen / app launcher
  3. Actual: Icon is blank/invisible because `icon-192.png` and `icon-512.png` are 1x1 pixel PNGs while `manifest.json` declares them as 192x192 and 512x512
- **Impact:** PWA will fail Chrome's installability heuristics (icons must be at least 144x144). Users cannot visually identify the app.
- **Priority:** Fix before deployment

#### BUG-2: Entire Offline Data Layer Not Implemented (6 Acceptance Criteria FAIL)
- **Severity:** Critical
- **Steps to Reproduce:**
  1. Open the app, load shifts
  2. Go offline (airplane mode)
  3. Expected: Previously loaded shifts are readable; new shifts can be created offline
  4. Actual: No offline data storage exists. No IndexedDB, no localStorage for shifts, no sync queue, no sync status UI, no conflict resolution.
- **Impact:** The core user story "Schichten auch ohne Internetverbindung erfassen" is entirely unmet. 6 out of 6 offline data acceptance criteria fail.
- **Priority:** Must implement before marking feature as complete. Currently documented as "deferred" in implementation notes.

#### BUG-3: Update Toast Does Not Re-Appear After Dismissal
- **Severity:** Low
- **Steps to Reproduce:**
  1. Trigger a SW update (deploy new version)
  2. Update toast appears
  3. Dismiss the toast (click X)
  4. Navigate to another page or wait
  5. Expected: Toast should reappear (spec says "Hinweis verschwindet bis naechstem App-Start nicht dauerhaft")
  6. Actual: Toast is gone permanently until the next SW lifecycle event
- **Priority:** Fix in next sprint

#### BUG-4: SW Caches API Responses Containing User Data
- **Severity:** Medium
- **Steps to Reproduce:**
  1. User A logs in, loads shifts (GET /api/shifts responds with data)
  2. SW caches the API response (NetworkFirst with 10s timeout)
  3. User A logs out
  4. User B uses the same device, network is slow
  5. Expected: User B sees only their own data
  6. Actual: SW may serve User A's cached API response to User B within the 10s timeout window
- **Priority:** Fix before deployment -- either exclude `/api/` from SW caching entirely, or clear caches on logout

#### BUG-5: PwaUpdatePrompt Does Not Tell Waiting SW to Activate
- **Severity:** Medium
- **Steps to Reproduce:**
  1. A new SW is installed and enters `waiting` state
  2. User clicks "Jetzt aktualisieren"
  3. `window.location.reload()` is called
  4. Expected: New SW takes over immediately
  5. Actual: The code only reloads the page but never sends `skipWaiting()` message to the waiting SW. The reload alone may not activate the new SW if it is still in waiting state. The SW itself has `self.skipWaiting()` in its precache setup, but this only runs on initial install, not on updates where a previous SW is already controlling the page.
- **Impact:** Update may not actually apply after clicking "Jetzt aktualisieren", leaving user on old version
- **Priority:** Fix before deployment

### Regression Check (Existing Features)

- PROJ-1 (Auth): `PwaUpdatePrompt` is only rendered inside authenticated layout -- no impact on login flow. PASS.
- PROJ-2 (Shifts): No changes to shift components. PASS.
- PROJ-3 (PDF Export): No changes to PDF components. PASS.
- PROJ-4 (Backup): No changes to admin backup. PASS.
- Build: `npm run build` succeeds. `npm run lint` succeeds (1 warning, unrelated to PROJ-5). No regressions.

### Summary
- **Acceptance Criteria:** 8/19 passed, 3/19 partial, 8/19 failed
- **Bugs Found:** 5 total (1 critical, 2 high, 1 medium, 1 low)
- **Security:** 1 medium issue (API response caching in SW)
- **Production Ready:** NO
- **Core Problem:** The offline data layer (IndexedDB storage, sync queue, sync status UI, conflict resolution) is entirely unimplemented. This represents 6 of 19 acceptance criteria and the primary user story for this feature. The implementation notes acknowledge this as "deferred."
- **Recommendation:** (1) Replace placeholder icons with real 192x192 and 512x512 PNGs. (2) Implement the offline data layer (IndexedDB + sync) or formally descope it and update the acceptance criteria. (3) Fix SW API caching security issue. (4) Add `skipWaiting()` message to the update prompt flow.

## Deployment
_To be added by /deploy_
