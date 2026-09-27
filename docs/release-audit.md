# PortMate system audit — 2026-09-27

## Current audit: Gemini repair required

Incoming handoff: `eea4c05bfe15b203d1d714e9c0be2fa82c83731f`. Maintenance parent: `faab771ce74b7173f2cf6e03d9b9e5c48edad0ba`. Status: **INCOMPLETE**. No contradictory human requirements were found. The older audit below is retained as history; this section defines the remaining handoff.

The frontend now uses real API calls for authentication, assignments, scoped connections, blocks and meeting intent. Production mock seeding was removed. Manifest and service worker files exist.

### Backend repair

Registration previously returned 202 without SMTP, creating an account whose verification token could never reach the user. It now returns 503 before database work outside tests. OpenAPI documents this compatible response and artifacts were regenerated. A regression test verifies zero database calls and no test-token header. Configure SMTP for email registration; isolated tests retain their verification header.

### Required Gemini repairs

1. **Session isolation.** `mobile/src/api/store.ts` publishes responses after logout/account changes. Reproduced with actual store/client sources and a deferred HTTP fixture: start `syncFromServer`, pause `/me`, call `logout`, then resolve `/me`. The user is restored and both `portmate_session_user` and the old account cache are recreated. Guard every async publication/mutation with session identity or generation checks. Discard old responses, including old 401 responses that could clear a newer token. Expiry must clear account state/cache and notify subscribers. Test logout, account switch and overlapping syncs with deferred responses.
2. **Authentication entry points.** `AuthView.tsx` prompts for a Google ID token or simulated token. Implement configured Google browser sign-in and pass its credential to the canonical endpoint; show an unavailable state when unconfigured. The backend emails `/verify-email?token=...`, but the frontend does not consume that route. Handle verification links and remove test-runner instructions from the UI. Keep tokens out of persistent caches and clear them from the URL after use.
3. **QR/share links.** `AddPortMateView.tsx` encodes `portmate://connect?token=...`, while copied/shared links use hardcoded `https://portmate.app/c/...`. There is no protocol handler or incoming connection route. Generate links for the running application's origin and handle them through authentication to an explicit claim action. An external phone QR reader opening the application is sufficient; retain manual paste. Test expiry, replay, self-claim and blocks through the visible flow.
4. **Sync errors.** Settings/catalog/itinerary failures are swallowed; an itinerary 500 becomes an empty successful result with `isStale=false`. Other HTTP failures are labeled offline, and mutations ignore a failed refresh. Preserve usable cache, distinguish HTTP failures from offline state, show retries/errors, and report mutation success separately from refresh failure. Test empty responses, partial failures and 401 with canonical fixtures.
5. **Meeting intent.** `NotificationsModal.tsx` offers response buttons whenever a poke notification is unread. The backend does not mark it read after a response, so buttons remain after Interested/Not Interested and retries return 403. Derive eligibility from current overlap state/lifecycle and show the result. Refresh open itinerary details when overlap data changes. `App.tsx` wires "Read all" to a fetch, which cannot mark anything read; remove this nonfunctional control unless a separately agreed API capability is added. Do not invent an endpoint.
6. **Accurate map/display.** `ConnectionOverviewView.tsx` labels expired overlaps as future and the current user's ship as the mate's ship. Exclude expired records from current/future views and omit unknown mate ship information. `OverlapTimeline.tsx` has fixed 85%/75% timeline bars and a fabricated 20 km fallback; use actual intervals/distance or omit unavailable details. Associate port overlaps by port identity as well as time in `store.ts`, with explicit same-ship handling. Do not label deterministic development data as verified provider data.
7. **PWA upgrades and token privacy.** `public/sw.js` uses permanent `portmate-v1` storage and cache-first HTML, so deployments can remain on an old shell indefinitely. Version assets or revalidate navigations and test upgrades. The generic static-cache branch also caches successful token-bearing navigation URLs, including verification links. Cache only intended public static resources; exclude sensitive routes/query strings. Test offline reload and upgrades.
8. **Coverage.** The 10 passing frontend tests mock fetch and include no rendered-component/browser tests. Some fixtures violate canonical models, such as `[]` for settings. Add component/integration coverage for these repairs with canonical fixtures and server-backed two-account flows where available. Keep frontend edits in Gemini-owned paths and return a clean handoff.

### Validation and release evidence

- Contract generation/freshness and both consumer type checks pass. Backend lint/build/tests pass: 17 passed, one real PostgreSQL test skipped without `TEST_DATABASE_URL`.
- Frontend lint/typecheck, 10 tests and production build pass. Production dependency audits report zero vulnerabilities.
- `test-release-gates.ps1 -RequireComplete` reached frontend tests, then failed when esbuild's config bundler tried to read an inaccessible parent directory. On the installed Node 24 runtime, `npm --prefix mobile test -- --configLoader native` and `npm --prefix mobile run build -- --configLoader native` both pass. A temporary gate invocation with those same flags also passed all checks; the gate edit was removed because automation paths are protected during a normal handoff. No security controls or checks were disabled. The unchanged default gate still needs to pass in the wrapper environment; a native-loader option would require a separate maintenance change if that environment has the same restriction.
- Docker/PostgreSQL executables are unavailable locally. No browser-to-real-PostgreSQL or current CI/Compose pass is claimed. Prior maintenance CI is historical evidence only. Repeat CI/Compose and the two-account browser audit after repairs, including verification, assignments, QR replay, blocks, intent persistence, logout races and offline upgrades.

Do not emit `[CLIENT_COMPLETE]` until functional repairs and current integrated release evidence pass. No worker push is authorized.

## Historical audit

Audited incoming handoff: `1846a24372c8a020a4cfb1c9a28fb147d50f4a9e` (`[GEMINI_COMPLETE]`). Release status: **INCOMPLETE**. There is no unresolved human product decision; the existing requirements and OpenAPI determine the repairs.

## Reconciled foundation

- OpenAPI is canonical. `meetingIntent` is an object with `status` and optional `updatedAt`. Shared frontend/backend types, model JSON Schema and backend request/response validators are generated. The contract gate rejects stale output and type-checks both consumers.
- Dependencies are synchronized from lockfiles before worker gates; unchanged installations are reused. A failed initial dependency/contract check reaches the agent as technical repair work; final publication remains gated.
- Clean-handoff and exact checkpoint attribution remain enforced. Unknown human changes are preserved. Genuine contradictory human requirements have a preserved decision record, explicit `HUMAN_DECISION_REQUIRED` annotation and exit 78.
- Backend repairs cover dedicated transaction connections, email verification, assignment ownership/company/date conflicts, assignment-clipped itinerary, overlap identifiers, atomic QR consumption, active connection checks for intent/blocking and suppression of inactive notification delivery.
- Docker builds include shared generated types. CI adds an isolated real PostgreSQL integration test and full Compose build/start/health smoke test.

## Gemini repair requirements

The current successful TypeScript/build/tests do not demonstrate complete product behavior. Repair the existing screens and state layer using canonical generated API types. Do not change the approved product or invent endpoints.

1. **Authentication:** `mobile/src/App.tsx` has no sign-in/registration/verification flow. Implement verified email/password, Google when configured, session restore/expiry and logout. A fresh visit must show authentication rather than `DEFAULT_USER`. Clear account-specific cached state on logout/account switch. Show useful errors when an integration is unavailable.
2. **Remove production mock fallbacks:** `mobile/src/api/store.ts` seeds fabricated users, assignments, mates and notifications; `getPortCalls()` always returns hardcoded voyages. Fetch assignments, itinerary, overlaps and connections from the API. Keep fixtures only in explicit tests/demo mode. Empty server arrays must clear stale data. Never fabricate another person's email, role, ship, city or precise activity time from absent API fields.
3. **Assignments and settings:** use company/ship IDs from catalog endpoints, support create/update/delete and preserve the returned canonical IDs. Await mutations and show errors or roll back optimistic changes. Persist threshold/email settings through the API; do not swallow failures with empty catch handlers.
4. **QR/share connections:** replace username-derived fake connections in `addConnectionFromQR` with server-minted scoped tokens and `claimConnectionToken`. Handle token expiry/replay/self/block errors. Claiming a token must create a durable connection visible after refresh and to both users. Removal uses connection ID; blocking uses user ID and must call the backend.
5. **Meeting intent:** `App.tsx.handleSendPoke` currently only displays an alert; `respondToPoke` only edits notification text. Call the Poke/intent endpoints using the actual overlap ID. Render `meetingIntent.status`, disable invalid/repeated actions, refetch state and handle 403/409. Interested/Not Interested must survive refresh and appear for the other participant. Expired/current overlaps must not offer a future-only Poke.
6. **PWA/offline:** add a valid manifest, icons and service worker, verify installability and app-shell navigation. Cached data must be scoped to the authenticated account and clearly stale/offline. Never report unsent offline mutations as successful. Do not cache authentication responses/tokens in a service worker.
7. **Tests:** add meaningful integration/component tests for the above real HTTP flows, failures, empty responses, account switching and reload persistence. Existing five local-store tests do not cover these scenarios. Run contracts, lint, typecheck, tests and build; keep all intentional changes in one clean handoff.

## GPT follow-up before release

- Re-run the browser-to-real-backend audit after Gemini repairs, including two accounts, assignment changes, QR replay, blocks and meeting intent.
- The maintenance baseline `cccaf66` passed real PostgreSQL and Compose validation in [CI run 36285491134](https://github.com/DeeKayCode/portmate/actions/runs/36285491134). Repeat CI and functional validation after Gemini's repairs; local Docker/PostgreSQL are unavailable on Adam's machine.
- Notification workers now lock each delivery row and recheck eligibility before sending, with stable Message-ID values for retries. SMTP has an unavoidable send/commit crash window; recipients may still see a retry after such a crash. Google linking clears passwords from unverified pre-registrations. Recheck these flows against the complete application. Deterministic cruise data is development data; production provider licensing/configuration is external and optional, as specified.
- `[CLIENT_COMPLETE]` requires actual functional completion and passing CI. Keep main human-reviewed; do not deploy production.
