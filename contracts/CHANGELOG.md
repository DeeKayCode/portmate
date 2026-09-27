# Contract changelog

## Authority and consistency correction

- OpenAPI is the canonical HTTP contract. All API models and shared TypeScript types are now generated and freshness-checked.
- `Overlap.meetingIntent` uses the OpenAPI object with `status` and optional `updatedAt`; the old standalone string enum is removed.
- Frontend API types and backend response validation consume these generated definitions.

## 1.0.1

- Added the optional `emailNotifications` setting used by the approved email notification flow.

## 1.0.0 — 2026-09-27

Initial human-approved PortMate PWA/backend contract baseline: verified authentication, profiles, assignments, itinerary, secure connections, overlaps, meeting intent and notifications.
