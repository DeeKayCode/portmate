# Gemini repair handoff

Continue from the reviewed maintenance and `docs/release-audit.md`. The audited `[GEMINI_COMPLETE]` handoff was `1846a24372c8a020a4cfb1c9a28fb147d50f4a9e`. The audit found incomplete frontend functionality, so the release is not complete.

The next work belongs to Gemini: implement all seven frontend repair items in the audit using the approved product and canonical OpenAPI. The backend exposes the required endpoints. Routine implementation choices do not require Adam or Dönci to decide. Keep the existing visual direction; remove fabricated production state and wire real persisted flows.

## API integration details found during audit

- Use the generated `contracts/api.d.ts` types. `meetingIntent` is an object, with `status` and optional `updatedAt`.
- `ApiClient.request` currently sends `Content-Type: application/json` even on bodyless POST requests (`createQrToken`, `poke`). Fastify rejects an empty JSON body. Set this header only when sending JSON, and test these requests against the actual backend.
- Blocking returns HTTP 201 with no response body. The current helper calls `response.json()` on every success other than 204; handle empty success bodies without reporting a successful block as an error.
- An assignment uses catalog IDs, not display names. Support PATCH as well as POST/DELETE. Preserve empty server results and errors faithfully.
- Keep overlap IDs distinct from the other participant's profile ID. Use connection ID for removal and profile/user ID for blocking.
- Notification records provide an overlap ID; load the associated overlap to display its meeting intent. Do not infer missing private profile fields or claim that a response was sent before the API succeeds.
- Authentication is required before loading protected data. A missing/expired token must lead to a real auth flow; old cached demo users must not impersonate a signed-in user.
- Empty SMTP/Google configuration is optional environment state. Show an unavailable integration clearly; never fabricate email verification or Google success. Email/password verification can be tested with configured test SMTP, and backend tests use an explicit test-only token header.

## Required evidence

Test two accounts through real requests: sign in, create assignments, mint and claim a token, reload connections/itineraries/overlaps, Poke, respond, reload state, remove/block and verify the other side cannot keep interacting. Cover failure and empty-response cases, empty lists, logout/account switching, offline stale-cache behavior and PWA installation assets.

Run the relevant contract/frontend gates and commit every intentional frontend change in one clean handoff. Use `[GEMINI]` for a tested increment with unfinished items. Use `[GEMINI_COMPLETE]` only when the complete frontend checklist is met and evidence is recorded in the commit. Include `PortMate-Trigger: <incoming GPT commit SHA>`; let the wrapper push.
