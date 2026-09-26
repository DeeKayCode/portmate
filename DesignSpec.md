# PortMate – AI-Centric Design Specification (DesignSpec.md)

> **Authority**: Authoritative frontend design specification for autonomous agents (`gemini-worker`, `gpt-worker`).  
> **Platform Target**: Mobile-first Web Application / PWA (responsive phone viewport container, touch-first, installable).  
> **Primary Philosophy**: Absolute frictionlessness. Real-world crew & traveler connectivity through instant QR pairing. Zero unnecessary forms, zero chat/feed fluff.

---

## 1. Machine-Parsable Design Tokens (JSON)

Agents MUST consume and strictly implement these centralized design tokens.

```json
{
  "system": "PortMate Design System",
  "version": "2.0.0",
  "theme": "light-default",
  "viewport": {
    "mobileMax": "430px",
    "minTouchTarget": "44px",
    "safeAreaInsetBottom": "env(safe-area-inset-bottom, 16px)",
    "safeAreaInsetTop": "env(safe-area-inset-top, 12px)"
  },
  "tokens": {
    "colors": {
      "brand": {
        "primary": "#0F4C81",
        "primaryLight": "#1E6091",
        "primaryDark": "#0B365B",
        "accent": "#F59E0B",
        "accentHover": "#D97706"
      },
      "background": {
        "screen": "#F8FAFC",
        "card": "#FFFFFF",
        "cardMuted": "#F1F5F9",
        "overlay": "rgba(15, 23, 42, 0.65)"
      },
      "text": {
        "primary": "#0F172A",
        "secondary": "#475569",
        "muted": "#94A3B8",
        "inverse": "#FFFFFF",
        "accent": "#0F4C81"
      },
      "border": {
        "light": "#E2E8F0",
        "focus": "#0F4C81",
        "subtle": "#F1F5F9"
      },
      "semanticConnections": {
        "nearby": {
          "code": "nearby-port",
          "label": "Nearby Port",
          "bg": "#FEF3C7",
          "border": "#F59E0B",
          "text": "#92400E",
          "hex": "#D97706",
          "description": "Port calls within configurable radius (default: 50 km)"
        },
        "samePort": {
          "code": "same-port",
          "label": "Same Port",
          "bg": "#E0F2FE",
          "border": "#0284C7",
          "text": "#075985",
          "hex": "#0284C7",
          "description": "Identical port/city on overlapping dates (any duration)"
        },
        "sameShip": {
          "code": "same-ship",
          "label": "Same Ship",
          "bg": "#DCFCE7",
          "border": "#10B981",
          "text": "#065F46",
          "hex": "#059669",
          "description": "Both mates assigned to the same vessel concurrently"
        }
      },
      "feedback": {
        "success": "#10B981",
        "warning": "#F59E0B",
        "error": "#EF4444",
        "offline": "#64748B",
        "stale": "#D97706"
      }
    },
    "typography": {
      "fontFamily": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      "scale": {
        "display": { "size": "1.75rem", "lineHeight": "2.25rem", "weight": "700" },
        "titleLg": { "size": "1.25rem", "lineHeight": "1.75rem", "weight": "600" },
        "titleMd": { "size": "1.125rem", "lineHeight": "1.5rem", "weight": "600" },
        "titleSm": { "size": "1.0rem", "lineHeight": "1.5rem", "weight": "600" },
        "body": { "size": "0.875rem", "lineHeight": "1.25rem", "weight": "400" },
        "bodyMedium": { "size": "0.875rem", "lineHeight": "1.25rem", "weight": "500" },
        "caption": { "size": "0.75rem", "lineHeight": "1.0rem", "weight": "400" },
        "badge": { "size": "0.6875rem", "lineHeight": "0.875rem", "weight": "600" }
      }
    },
    "radii": {
      "sm": "0.375rem",
      "md": "0.5rem",
      "lg": "0.75rem",
      "xl": "1.0rem",
      "full": "9999px"
    },
    "shadows": {
      "card": "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)",
      "floating": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      "nav": "0 -2px 10px rgba(0, 0, 0, 0.05)"
    },
    "spacing": {
      "cardPad": "1rem",
      "screenPadX": "1rem",
      "bottomNavHeight": "4rem",
      "topBarHeight": "3.5rem"
    },
    "animation": {
      "tapBounce": "scale(0.97)",
      "springDuration": "200ms",
      "fadeDuration": "150ms"
    }
  }
}
```

---

## 2. Information Architecture & Navigation Framework

PortMate employs a fixed, mobile-first single container layout constrained to a maximum width of `430px` (centered with a subtle shadow on desktop viewports).

```
+-------------------------------------------------------+
|  TOP BAR                                              |
|  [Profile Avatar]       PortMate       [Notifications]|
+-------------------------------------------------------+
|                                                       |
|                     ACTIVE TAB                        |
|                                                       |
|  1. My Itinerary                                      |
|  2. Add PortMate                                      |
|  3. Connection Overview (Map)                         |
|  4. My Contracts                                      |
|                                                       |
+-------------------------------------------------------+
|  BOTTOM NAVIGATION (Fixed 4 Tabs)                     |
|  [Itinerary]   [+] Add Mate   [Map]   [Contracts]     |
+-------------------------------------------------------+
```

### 2.1 Top Navigation Bar (Always Visible)
- **Left**: `Profile Avatar Button`
  - Visual: User avatar (36x36px circular image or initials fallback).
  - Tap: Opens the **Profile & Settings Modal / Slide-over**.
  - Information: Display name, username (`@handle`), last activity indicator, nearby distance threshold setting, logout.
- **Center**: `PortMate Wordmark`
  - Subtle maritime anchor/compass emblem + bold sans-serif text.
- **Right**: `Notifications Bell Button`
  - Visual: Lucide `Bell` icon (20px).
  - Unread Badge: Coral red dot (`#EF4444`) with unread count if > 0.
  - Tap: Opens the **Notifications Sheet** (upcoming overlaps, Pokes/meeting intents received).

### 2.2 Bottom Navigation Bar (4 Canonical Tabs)
Exactly four main areas:
1. **My Itinerary** (`CalendarDays` or `ListFilter` icon)
   - Label: `Itinerary`
   - Chronological port calls day-by-day.
2. **Add PortMate** (`UserPlus` or `QrCode` icon)
   - Visual: **Visually prominent central action button** (elevated, accent brand color `#0F4C81` or `#1E6091`).
   - Frictionless QR display & scanner toggle.
3. **Connection Overview** (`Map` or `Compass` icon)
   - Label: `Overview`
   - Map-based visualization of mates' itinerary-derived locations and future meeting points.
4. **My Contracts** (`Ship` or `FileText` icon)
   - Label: `Contracts`
   - Cruise line, vessel assignments, active/upcoming sailing dates.

---

## 3. Core Screens & Feature Workflows

### 3.1 Tab 1: My Itinerary
The daily home feed displaying upcoming port stops and PortMate intersections.

- **Layout Structure**:
  - **Date Navigator / Header**: Quick jump to "Today", "This Week", or month selector.
  - **Chronological Day Cards**:
    - Header: Date (e.g. `Thu, Oct 15`), Port & Country (e.g. `Cozumel, Mexico`), Scheduled Berth (`08:00 – 17:00`).
    - Ship Badge: Vessel name (e.g. `Wonder of the Seas`).
    - **PortMate Overlap Badges**:
      - If mates are in port/region, display horizontal avatar row with semantic status ring.
      - State pills:
        - `[Green] Same Ship: Alex (Crew)`
        - `[Blue] Same Port: Maria (Docked Pier 2)`
        - `[Amber] Nearby (18km): Carlos (Playa del Carmen)`
  - **Card Tap Action -> Port Overlap Detail Modal / Sheet**:
    - **Visual Timeline**: Two parallel horizontal bars showing:
      1. User's stay: `[08:00 === USER BERTH === 17:00]`
      2. Mate's stay: `[10:00 === MATE BERTH === 19:00]`
      3. Overlap window highlighted: `[10:00 – 17:00 (7 hrs shared)]`
    - **Meeting Intent / Poke Button**:
      - Prominent CTA: `"Interested in meeting?"`
      - State toggle: Send Poke -> Status `"Poke sent - Waiting for response"`.

---

### 3.2 Tab 2: Add PortMate (Frictionless In-Person Pairing)
The primary organic growth engine: `Meet -> PortMate -> QR -> Scan -> Connected`.

- **Top Sub-Navigation / Toggle**:
  - `[My QR Code]` (Default active view)
  - `[Scan Camera]` (Instantly turns on camera scanner)
- **View A: My QR Code Screen**:
  - High-contrast, scannable QR code centered on a clean white card.
  - User's profile photo and `@handle` below.
  - Unique QR Payload format: `portmate://connect?u=<user_id>&token=<temp_or_permanent_token>`.
  - Share link button (`Copy Link` or Web Share API: `portmate.app/c/<share_code>`).
- **View B: Scan Camera Screen**:
  - Full-width viewfinder with scanning reticle overlay.
  - Flashlight / Torch toggle button.
  - Manual code input fallback link.
- **Connection Protocol (Zero-Friction Rule)**:
  - Scanning a valid mate's QR code **IMMEDIATELY creates the two-way PortMate connection**.
  - **NO approval dialog, NO confirmation forms, NO pending request queues**.
  - Immediate tactile feedback: Success haptic vibration, animated green checkmark, brief toast: `"Connected with @maria! Found 3 upcoming overlaps."`
  - Automatically redirects to the newly discovered overlaps.
- **Connection Management List**:
  - Below QR, list current PortMates with simple overflow menu (`Remove Connection`, `Block User`).

---

### 3.3 Tab 3: Connection Overview (Map-Based)
Answers at a glance: *"Where are my PortMates now, and where will our paths cross?"*

- **Map Engine**: Lightweight, mobile-optimized tile map (Leaflet / MapLibre).
- **Location Privacy Rule**:
  - **Strictly NO live GPS tracking**.
  - Location is entirely itinerary-derived based on active ship contracts and port schedules.
  - Pin precision is port/harbor/city level, never cabin or meter level.
- **Layer Toggle / Filter Pills**:
  - `All Mates` | `Same Port Only` | `Nearby (<50km)` | `Future Overlaps`
- **Map Markers**:
  - **Current Locations**: Solid circular avatar marker with status badge.
  - **Future Meeting Points**: Star / diamond pin with calendar date callout.
  - Marker clusters for ports with 3+ friends.
- **Marker Tap -> Bottom Peek Sheet**:
  - Port name, Country.
  - PortMates docked there and their respective vessels.
  - Shared overlap window and direct link to Itinerary details.

---

### 3.4 Tab 4: My Contracts (Assignment Management)
The foundational data entry point driving the entire matching engine.

- **Onboarding Priority**:
  - For any new user, an empty contract state prominently prompts: `"Add your first ship assignment to discover who is sailing with you."`
- **Contract Fields**:
  - `Cruise Line`: Searchable dropdown (e.g. Royal Caribbean, Carnival, MSC, Norwegian, Celebrity, Virgin, etc.).
  - `Ship Name`: Filtered by selected Cruise Line (e.g. `Wonder of the Seas`, `Celebrity Apex`).
  - `Role / Category`: Optional (e.g. `Crew`, `Guest`, `Entertainer`, `Officer`).
  - `Start Date`: Date picker.
  - `End Date`: Date picker.
- **Contract Card List**:
  - **Current Sailing** (active badge, dates remaining).
  - **Upcoming Contracts** (chronological order).
  - **Past Contracts** (archived for historical overlap memories).
- **Actions**: Add new contract (+), Edit, Delete with confirm.

---

### 3.5 Top Bar Actions: Profile & Notifications

#### Profile View (`ProfileModal`)
- Avatar upload / camera capture / initials generator.
- Username (`@username`) [Mandatory, unique].
- Display Name [Optional].
- Bio / Short note [Optional, max 120 chars, e.g. "Stage manager @ Royal"].
- **Activity Status**:
  - Strictly **NO real-time online/offline dot**.
  - Display last activity timestamp: `"Active recently"`, `"Active 2h ago"`, `"Active yesterday"`.
- **Settings**:
  - Nearby Overlap Radius slider: `10 km` to `100 km` (default: `50 km`).
  - Email notification preferences (Upcoming overlap digests, poke notifications).
  - Account logout.

#### Notifications View (`NotificationsModal`)
- Minimalist, action-focused feed:
  1. **Overlap Alerts**: `"You and @alex will both be in Nassau on Nov 4."`
  2. **Poke / Meeting Intent Received**:
     - Card: `"@david wants to meet in Cozumel on Oct 18."`
     - Two direct action buttons:
       - `[Interested]` -> Sends affirmative notification to David.
       - `[Not Interested]` -> Dismisses reminder quietly without awkward notification.
  3. Clear all / Mark read.

---

## 4. Strict Social Media Constraints

To maintain extreme focus and speed, PortMate explicitly prohibits:
- ❌ NO general text chat or instant messaging (users meet in real life or use their own preferred chat apps).
- ❌ NO social feed, posts, or status updates.
- ❌ NO stories or expiring media.
- ❌ NO follower counts, likes, or algorithmic popularity metrics.
- ❌ NO live GPS tracking or map stalking.

---

## 5. UI State Specifications

Every view and component must strictly implement all 5 states:

| State | Visual Treatment | Example |
| :--- | :--- | :--- |
| **1. Loading / Skeleton** | Shimmering gray rounded rectangles (`animate-pulse`), preserving final layout dimensions. | Gray placeholders for port cards, avatar circles. |
| **2. Empty State** | Engaging icon, clear friendly explanation, and ONE primary call-to-action button. | No contracts: *"No upcoming sailings yet"* -> `[+ Add Ship Contract]` |
| **3. Active / Data** | Crisp cards, standard typography tokens, semantic color badges. | Full itinerary listing with port times and mates. |
| **4. Offline / Stale** | Subtle top banner: *"Offline – Showing cached schedule"*, cached data remains readable. | Last synced itinerary displayed with gray timestamp. |
| **5. Error State** | Clear non-technical error description, reload icon, and retry CTA. | *"Could not sync latest port stops"* -> `[Try Again]` |

---

## 6. Implementation Conventions for AI Agents

- **Component Names**:
  - `BottomNav`, `TopBar`, `ItineraryCard`, `OverlapTimeline`, `QrDisplayCard`, `QrScannerView`, `ConnectionMap`, `ContractCard`, `PokeActionSheet`, `NotificationItem`.
- **CSS Architecture**: Tailwind CSS utility classes mapped to the JSON design tokens.
- **Icons**: `lucide-react` icons exclusively.
- **State Store**: Lightweight reactive client store (Zustand or React Context) with optimistic offline caching (`localStorage` / IndexedDB).
