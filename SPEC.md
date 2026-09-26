# PortMate – Product & Architectural Specification (SPEC.md)

> **Status**: APPROVED – Active Product Development  
> **Target System**: Mobile-first Web Application / PWA with Node.js/Go backend and PostgreSQL database.  
> **Monorepo Architecture**: Single integrated repository on `client` branch.

---

## 1. Product Vision & Core Mission

**PortMate** connects people traveling or working aboard cruise ships so they can discover when and where their paths cross with friends and colleagues.

While particularly tailored to cruise ship crew members, registration is open to anyone (crew, officers, guest travelers, entertainers).

### The Core Experience Loop
```
Ship assignment 
  → Generate daily itinerary 
  → Add PortMates (frictionless QR pairing) 
  → Discover overlaps (nearby-port, same-port, same-ship) 
  → Understand shared port hours via visual timeline 
  → Express meeting intent (Poke) 
  → Meet in real life
```

PortMate facilitates **real-world in-person meetups**. It is NOT a social network.

### Explicit Non-Goals & Prohibitions
- ❌ NO general text chat or in-app instant messaging.
- ❌ NO social feed, posts, or media uploads.
- ❌ NO stories or expiring status updates.
- ❌ NO follower counts, likes, or vanity metrics.
- ❌ NO continuous GPS tracking. Locations are strictly derived from scheduled cruise ship itineraries at the port/city level.
- ❌ NO real-time online/offline presence indicators (only last activity like "Active recently", "Active 2h ago").

---

## 2. Multi-Agent Development Ownership

Two autonomous AI agents collaborate in this repository with strict, complementary boundaries:

### Gemini (`gemini-worker`) – Autonomous Complete Frontend Owner
- **Scope**: Browser/PWA frontend execution within `/mobile` (or frontend root).
- **Responsibilities**:
  - UI/UX design, visual hierarchy, mobile layout container (max 430px, touch targets >= 44px).
  - Frontend architecture, React/TypeScript application logic, routing, and navigation.
  - State management, client-side data layer, and API client.
  - Form validation, onboarding flows, and authentication UX.
  - PWA capabilities, service worker caching, and offline/stale state management.
  - Interactive map integration (Leaflet/MapLibre) and itinerary-derived marker rendering.
  - QR code generation and camera scanner frontend.
  - Overlap visual timeline component (arrival/departure comparisons).
  - Frontend test suites, type checking, and lint validation.

### GPT (`gpt-worker`) – Autonomous Complete Backend Owner
- **Scope**: Server execution within `/server` and shared contracts validation.
- **Responsibilities**:
  - Backend architecture, REST API implementation conforming strictly to `/contracts`.
  - PostgreSQL database schema, relational tables, migrations, and seed data.
  - Authentication backend (JWT / session cookies, password hashing, Google OAuth).
  - Cruise data catalog (cruise lines, ships, standard port itineraries).
  - Overlap calculation engine:
    - `same-ship`: concurrent vessel assignment matching.
    - `same-port`: spatial/temporal port overlap matching.
    - `nearby-port`: Haversine distance matching against user-configurable radius (default 50km).
  - Meeting Intent / Poke backend logic and state transitions.
  - Scheduled background worker and email notification dispatch.
  - Backend automated test suites, Docker configuration, and whole-system release audit.

---

## 3. Information Architecture & Navigation

### 3.1 Top Navigation Bar
- **Left**: User Profile avatar trigger -> opens `ProfileModal` (username, display name, avatar, bio, last activity, distance settings, logout).
- **Center**: PortMate brand logo.
- **Right**: Notifications bell -> opens `NotificationsModal` (overlap alerts, meeting intents/pokes).

### 3.2 Primary Bottom Navigation (Fixed 4 Tabs)
1. **My Itinerary**: Chronological day-by-day port call list with overlap pills, friend avatars, and detail modal with visual arrival/departure timeline.
2. **Add PortMate**: Visually prominent central button. Displays user's personal QR code and share link; header toggle switches to camera scanner. Scanning immediately establishes connection without approval prompts.
3. **Connection Overview**: Map-based view displaying current itinerary-derived locations and future meeting points.
4. **My Contracts**: Cruise assignments (Cruise Line, Ship, Start Date, End Date). First-time onboarding priority.

---

## 4. Connection Engine & Semantic States

PortMate classifies intersections between two connected users into three distinct semantic states:

1. **Nearby-Port (`nearby-port`)**:
   - Different ports whose geographical distance is within the user's configured threshold (default: 50 km).
   - Semantic color: Amber / Bronze (`#D97706`).
2. **Same-Port (`same-port`)**:
   - Same port or city with ANY positive temporal overlap window.
   - Semantic color: Ocean Blue (`#0284C7`).
3. **Same-Ship (`same-ship`)**:
   - Both users are assigned to the exact same vessel during an overlapping date range.
   - Suppresses redundant individual port meeting alerts.
   - Semantic color: Emerald Teal (`#059669`).

---

## 5. Meeting Intent ("Poke") Protocol

- **Constraint**: Only available for **future** port overlaps.
- **Semantics**: Sender expresses: *"I would like to meet you during this overlap."*
- **Recipient Actions**:
  - **Interested**: Alerts the original sender that both want to meet.
  - **Not Interested**: Silently suppresses further meeting reminders for that overlap.
- **No In-App Chat**: Users meet in port or use their existing personal communication channels.

---

## 6. Authentication & User Profile

- Email & Password registration and login.
- "Continue with Google" OAuth support.
- Email verification flow.
- Username is mandatory and unique (`@username`).
- Profile photo, bio (optional), last activity timestamp ("Active 2h ago").
- Location privacy: No GPS tracking.

---

## 7. Quality Gates & Definition of Done

The frontend release gate passes only when:
- Complete mobile UI is responsive, touch-friendly, and accessible.
- All 4 tabs and top bar modals are fully functional.
- Five UI states are supported: Loading/Skeleton, Empty, Active/Data, Offline/Stale, and Error.
- QR pairing and overlap visual timelines are operational.
- Frontend test suite passes, `npm run build` succeeds with zero type/lint errors.
