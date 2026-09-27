# PortMate system audit — 2026-09-27

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
- Confirm real PostgreSQL and Compose jobs on the published revision; local Docker/PostgreSQL are unavailable on Adam's machine.
- Notification workers now lock each delivery row and recheck eligibility before sending, with stable Message-ID values for retries. SMTP has an unavoidable send/commit crash window; recipients may still see a retry after such a crash. Google linking clears passwords from unverified pre-registrations. Recheck these flows against the complete application. Deterministic cruise data is development data; production provider licensing/configuration is external and optional, as specified.
- `[CLIENT_COMPLETE]` requires actual functional completion and passing CI. Keep main human-reviewed; do not deploy production.
