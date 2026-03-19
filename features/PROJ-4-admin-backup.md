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

**Tested:** 2026-03-19
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### BLOCKER: Build Failure

The application does not build. `npm run build` (with `--webpack` flag, required due to next-pwa) fails during "Collecting build traces" with:

```
Error: ENOENT: no such file or directory, open '.next/server/proxy.js.nft.json'
```

This is caused by the Next.js 16 `proxy.ts` convention not generating the expected `.nft.json` trace file when building with webpack mode. Because the app cannot be built or run, all browser-based testing (cross-browser, responsive, manual UI) is blocked. The following audit is based on **code review only**.

### Acceptance Criteria Status

#### AC: Backup erstellen

- [x] **Button "Backup erstellen" im Admin-Bereich** -- PASS. `BackupButton` component rendered inside a "Datensicherung" Card in `src/app/admin/page.tsx` (lines 238-248).
- [ ] **Bestaetigungsdialog vor dem Export** -- FAIL. No confirmation dialog exists. Clicking the button immediately triggers the backup download. The implementation notes acknowledge this deviation: "No confirmation dialog added." This is a spec violation.
- [x] **Backup enthaelt alle Nutzerdaten: Benutzerkonten (ohne Passwoerter), alle Schichten, alle Auftraege (inkl. CAD-Nummern und Notizen)** -- PASS. The API route fetches profiles (explicit column list excluding passwords: `id, personalnummer, vorname, nachname, rolle, erstellt_am`), shifts (`*`), and auftraege (`*` which includes `cad_nummer` and `notiz` columns per migration 002). Passwords are managed by Supabase Auth separately and are not in the profiles table.
- [x] **Backup-Format: JSON (maschinenlesbar, wiederherstellbar)** -- PASS. Response is `application/json` with structured `{ version, created_at, data: { profiles, shifts, auftraege } }`.
- [ ] **Alternativ oder zusaetzlich: CSV-Export (menschenlesbar)** -- FAIL. No CSV export is implemented. Only JSON is available.
- [x] **Dateiname: `backup_[YYYY-MM-DD_HH-MM].json`** -- PASS. Client-side filename generation in `backup-button.tsx` (line 28) produces `backup_2026-03-19_14-30.json` format with zero-padded values.
- [x] **Download startet automatisch nach Erstellung** -- PASS. The code creates a hidden `<a>` element, sets the `download` attribute, and calls `link.click()` programmatically (lines 30-37).
- [x] **Kein automatisches Backup -- nur manuell auf Admin-Anfrage** -- PASS. No scheduled or automatic backup mechanism exists. The backup is triggered solely by the button click.

#### AC: Zugriffsbeschraenkung

- [x] **Backup-Funktion ist nur fuer Nutzer mit Rolle "admin" zugaenglich** -- PASS. The API route calls `requireAdmin()` which checks authentication and verifies `rolle === "admin"`, returning 401 or 403 otherwise. The admin page itself is protected by the proxy (lines 67-78 of `src/proxy.ts`).
- [x] **Kein Endpunkt ist ohne Admin-Authentifizierung erreichbar (RLS + API-Guard)** -- PASS (with caveat). The API route uses `requireAdmin()` as an API-level guard. Additionally, the backup uses `createAdminClient()` (service_role) which bypasses RLS by design -- this is intentional since the backup needs to read all data across all users. The proxy does NOT protect `/api/` routes (line 42: `pathname.startsWith("/api/")` allows through), but the API route itself enforces auth. See security notes below.

### Edge Cases Status

#### EC: Keine Nutzer oder keine Daten vorhanden
- [x] PASS. If tables are empty, `profilesResult.data`, `shiftsResult.data`, and `auftraegeResult.data` will be empty arrays. The response includes `version` and `created_at` metadata. The null coalescing (`?? []`) ensures empty arrays instead of null.

#### EC: Admin hat schlechte Verbindung
- [x] PASS. The `catch` block in `backup-button.tsx` (line 40-41) shows toast error "Backup fehlgeschlagen -- bitte erneut versuchen". The non-ok response also shows the same message (line 17).

#### EC: Sehr grosse Datenmenge -- Ladeindikator anzeigen
- [x] PASS. The `BackupButton` has `isLoading` state that shows a spinning `Loader2` icon and disables the button during the request (lines 54-55).

### Security Audit Results

- [x] **Authentication on backup endpoint**: `requireAdmin()` verifies auth session via `supabase.auth.getUser()` and checks `rolle === "admin"` in the profiles table. Returns 401 for unauthenticated and 403 for non-admin users.
- [x] **No passwords in backup**: The profiles query explicitly selects only `id, personalnummer, vorname, nachname, rolle, erstellt_am`. Passwords are stored in Supabase Auth (auth.users table), not in the profiles table.
- [x] **Service role key server-only**: `createAdminClient()` reads `SUPABASE_SERVICE_ROLE_KEY` from server environment. The env var has no `NEXT_PUBLIC_` prefix, so it is never exposed to the browser.
- [x] **GDPR/Privacy warning**: The UI shows "Das Backup enthaelt personenbezogene Daten. Bitte sicher aufbewahren." (line 62 of backup-button.tsx).
- [ ] **BUG-SEC-1 (Medium): Proxy bypasses all /api/ routes.** The proxy at `src/proxy.ts` line 42 treats all `/api/` paths as public routes, allowing requests through without session refresh. While the backup API route enforces its own auth check via `requireAdmin()`, the proxy-level session refresh is skipped. This means expired session cookies may not be refreshed for API calls, potentially causing inconsistent auth state.
- [ ] **BUG-SEC-2 (Medium): No rate limiting on backup endpoint.** An authenticated admin could repeatedly call `GET /api/admin/backup` without any throttling. Since this endpoint queries three tables in full (`select *` on shifts and auftraege), rapid repeated calls could cause high database load. No rate limiting exists at any level.
- [ ] **BUG-SEC-3 (Low): Backup response not streamed -- large datasets risk timeout or OOM.** The entire backup is assembled in memory as a single JSON object before being returned via `Response.json()`. For very large datasets (many users, months of shifts), this could exceed serverless function memory limits or timeout. No pagination or streaming is implemented.
- [x] **Security headers**: `next.config.ts` sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`. Note: `Strict-Transport-Security` is missing per security.md requirements (this is a pre-existing issue from PROJ-1 QA, not new to PROJ-4).
- [x] **Input validation**: The endpoint is a GET with no user input parameters, so no input validation is needed. The `requireAdmin()` guard is sufficient.

### Cross-Browser Testing
- BLOCKED: Cannot test -- build fails (`proxy.js.nft.json` not found).

### Responsive Testing
- BLOCKED: Cannot test -- build fails.
- Code review: The BackupButton has `min-h-[44px]` for mobile touch targets. The "Datensicherung" Card uses standard shadcn/ui Card which is responsive by default.

### Bugs Found

#### BUG-P4-1: Build Failure -- proxy.js.nft.json Not Found
- **Severity:** Critical (Blocker)
- **Steps to Reproduce:**
  1. Run `npm run build` (which runs `next build --webpack`)
  2. Build compiles and generates pages successfully
  3. During "Collecting build traces" step, build fails with: `ENOENT: no such file or directory, open '.next/server/proxy.js.nft.json'`
- **Root Cause:** Next.js 16 `proxy.ts` convention combined with `--webpack` mode does not produce the expected `.nft.json` trace file.
- **Impact:** Application cannot be built or deployed. All runtime testing blocked.
- **Priority:** P0 -- Fix before any deployment. This is likely the same root cause as BUG-1/BUG-2 from PROJ-1 QA but has evolved since the migration from middleware.ts to proxy.ts.

#### BUG-P4-2: Missing Confirmation Dialog Before Backup
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Navigate to Admin page
  2. Click "Backup erstellen"
  3. Expected: Confirmation dialog appears asking to confirm the export
  4. Actual: Backup starts immediately without confirmation
- **Root Cause:** Implementation notes acknowledge this was intentionally skipped.
- **Impact:** Users may accidentally trigger large backup downloads. Spec explicitly requires "Bestaetigungsdialog vor dem Export."
- **Priority:** P2 -- Fix in next sprint.

#### BUG-P4-3: No CSV Export Option
- **Severity:** Low
- **Steps to Reproduce:**
  1. Navigate to Admin backup section
  2. Expected: Option to export as CSV (in addition to or instead of JSON)
  3. Actual: Only JSON export available
- **Root Cause:** Not implemented.
- **Impact:** Spec says "Alternativ oder zusaetzlich: CSV-Export (menschenlesbar)." Human-readable format not available for non-technical users.
- **Priority:** P3 -- Nice to have, can be deferred.

#### BUG-P4-4: No Rate Limiting on Backup Endpoint
- **Severity:** Medium
- **Steps to Reproduce:**
  1. As an authenticated admin, send rapid repeated GET requests to `/api/admin/backup`
  2. Expected: Rate limiting after a reasonable number of requests
  3. Actual: All requests processed without throttling
- **Root Cause:** No rate limiting middleware or logic exists on any API endpoint.
- **Impact:** Could cause high database load under abuse. Three full-table queries run per request.
- **Priority:** P2 -- Fix before production deployment.

#### BUG-P4-5: Large Backup May Exceed Memory or Timeout Limits
- **Severity:** Low
- **Steps to Reproduce:**
  1. Accumulate a large dataset (thousands of shifts/auftraege over many months)
  2. Trigger backup
  3. Expected: Backup completes or shows meaningful error
  4. Actual: Entire dataset loaded into memory; may OOM on serverless (Vercel default 1024MB) or timeout (Vercel default 10s for serverless functions)
- **Root Cause:** No streaming, pagination, or chunking. `Promise.all` loads all three tables fully into memory before serializing to JSON.
- **Impact:** For a small factory team this is unlikely to be hit soon, but could become a problem after months/years of data accumulation.
- **Priority:** P3 -- Monitor, fix if dataset grows large.

### Regression Check

Reviewed existing features from `features/INDEX.md`:
- **PROJ-1 (Auth)**: No regressions introduced by PROJ-4. The backup route correctly reuses `requireAdmin()` and `createAdminClient()` from PROJ-1 without modifying them.
- **PROJ-2 (Shifts)**: No regressions. The backup reads shifts/auftraege tables in read-only mode.
- **PROJ-3 (PDF Export)**: No regressions. No shared code modified.
- **PROJ-5 (PWA)**: The build failure (BUG-P4-1) is a pre-existing issue from the proxy.ts/webpack conflict, not introduced by PROJ-4.

### Summary

- **Acceptance Criteria:** 8/10 passed (code review only)
- **Bugs Found:** 5 total (1 critical/blocker, 2 medium, 2 low)
- **Security:** Auth guard is solid; rate limiting and memory concerns are medium/low risk
- **Production Ready:** NO (blocked by build failure BUG-P4-1; also missing confirmation dialog BUG-P4-2)
- **Recommendation:** Fix build failure first (pre-existing, affects all features). Then add confirmation dialog (BUG-P4-2) and rate limiting (BUG-P4-4) before production deployment. CSV export (BUG-P4-3) and streaming (BUG-P4-5) can be deferred.

## Deployment
_To be added by /deploy_
