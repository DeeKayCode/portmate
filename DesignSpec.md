# PortMate – Mobile Design Specification (`DesignSpec.md`)

> **Target Audience:** `gemini-worker` (Frontend / UI / UX) and `gpt-worker` (Application & State Logic).  
> **Purpose:** Canonical design tokens, component architecture, layout guidelines, and UI/state interfaces for the PortMate mobile application.

---

## 1. Design Philosophy & Maritime Operating Constraints

PortMate is tailored specifically for **cruise ship crew members and maritime workers**. The UI/UX must strictly account for maritime conditions:

1. **Offline-First Clarity**: Crew members frequently work in zero-cellular or high-latency satellite environments. All views must visually communicate local cache freshness, sync status, and offline functionality without blocking interaction.
2. **High-Contrast Dark & Light Themes**: The interface will be used in varied illumination—from harsh direct sunlight on open decks to dim cabin lighting and bridge red-light conditions. High contrast (WCAG AAA for text, AA for UI controls) is mandatory.
3. **Glanceability & Fatigue Resistance**: Crew members often have brief breaks (e.g. 15–30 minutes in port). Key information (docking times, friend overlaps, shore leave countdowns) must be immediately readable on the primary screen.
4. **Touch Ergonomics**: Minimum tap target of 48×48 dp/pt with 8 dp/pt padding between interactive targets to accommodate one-handed operation on moving vessels.

---

## 2. Design Tokens (JSON-Parsable Definition)

Both agents must bind directly to these token keys. Gemini implements styles; GPT binds theme preferences.

```json
{
  "theme": {
    "mode": ["dark", "light"],
    "colors": {
      "dark": {
        "background": "#0A1118",
        "surface": "#121D28",
        "surfaceElevated": "#1B2A3A",
        "border": "#24374C",
        "borderFocus": "#0096C7",
        "textPrimary": "#F0F6FC",
        "textSecondary": "#8B9EB0",
        "textMuted": "#576A7C",
        "accentNautical": "#0077B6",
        "accentCyan": "#00B4D8",
        "accentCoral": "#FF6B6B",
        "accentGold": "#FFB703",
        "statusSuccess": "#2EC4B6",
        "statusWarning": "#FFB703",
        "statusDanger": "#E63946",
        "statusOffline": "#6C7A89"
      },
      "light": {
        "background": "#F4F7FB",
        "surface": "#FFFFFF",
        "surfaceElevated": "#EAEFF6",
        "border": "#D1DCED",
        "borderFocus": "#0077B6",
        "textPrimary": "#0D1B2A",
        "textSecondary": "#415A77",
        "textMuted": "#778DA9",
        "accentNautical": "#0077B6",
        "accentCyan": "#0096C7",
        "accentCoral": "#E63946",
        "accentGold": "#E09F3E",
        "statusSuccess": "#2A9D8F",
        "statusWarning": "#F4A261",
        "statusDanger": "#E76F51",
        "statusOffline": "#8D99AE"
      }
    },
    "typography": {
      "fontFamily": "System Sans-Serif (-apple-system, Roboto, Segoe UI, sans-serif)",
      "fontFamilyMonospace": "System Monospace (SF Mono, Menlo, Roboto Mono, monospace)",
      "scales": {
        "displayLarge": { "fontSize": 32, "lineHeight": 40, "fontWeight": "700" },
        "headlineMedium": { "fontSize": 24, "lineHeight": 32, "fontWeight": "700" },
        "titleLarge": { "fontSize": 20, "lineHeight": 28, "fontWeight": "600" },
        "titleMedium": { "fontSize": 16, "lineHeight": 24, "fontWeight": "600" },
        "bodyLarge": { "fontSize": 16, "lineHeight": 24, "fontWeight": "400" },
        "bodyMedium": { "fontSize": 14, "lineHeight": 20, "fontWeight": "400" },
        "labelLarge": { "fontSize": 14, "lineHeight": 20, "fontWeight": "600" },
        "labelSmall": { "fontSize": 11, "lineHeight": 16, "fontWeight": "500" }
      }
    },
    "spacing": {
      "none": 0,
      "xxs": 2,
      "xs": 4,
      "sm": 8,
      "md": 16,
      "lg": 24,
      "xl": 32,
      "xxl": 48
    },
    "radii": {
      "sm": 4,
      "md": 8,
      "lg": 16,
      "full": 9999
    }
  }
}
```

---

## 3. Navigation Architecture

PortMate uses a persistent bottom navigation bar with 4 primary destinations and a context-aware header:

```text
┌────────────────────────────────────────────────────────┐
│ Header: [Ship/Port Pill] [Offline Indicator] [Profile] │
├────────────────────────────────────────────────────────┤
│                                                        │
│                     Active Screen                      │
│                                                        │
├────────────────────────────────────────────────────────┤
│  [🚢 Itinerary]  [🎯 Overlaps]  [📍 Map]  [👤 Profile] │
└────────────────────────────────────────────────────────┘
```

1. **`Itinerary` (Timeline)**: Complete schedule of ports, sea days, docking status, and contract countdowns.
2. **`Overlaps` (Radar)**: Port-sharing matchmaker highlighting friends docked in the same port at the same time.
3. **`Map` (Locations)**: Map-oriented view of itinerary-derived port calls and qualifying overlap locations. It never uses continuous GPS tracking.
4. **`Profile`**: Account, assignments, distance threshold, notification and privacy settings.

---

## 4. Screen Specifications & Component Hierarchy

### Screen 1: `ItineraryTimelineScreen`
- **Purpose**: Displays past, active, and upcoming ports of call for the user's assigned vessel.
- **Components**:
  - `VesselStatusBanner`: Displays vessel name (e.g. *Wonder of the Seas*), voyage code, and current navigation status (`DOCKED`, `AT_SEA`, `TENDER`).
  - `TimelineCard`:
    - Port Name & Country code + flag.
    - Arrival & All-Aboard timestamps (formatted in Port Local Time and Ship Time).
    - Shore leave duration badge (`e.g. "8h in port"`).
    - Overlap indicator pill (`e.g. "3 friends docked"` with avatar stack).
  - `SyncStatusBar`: Subtle top bar showing time of last satellite sync and manual retry button.

### Screen 2: `PortOverlapRadarScreen`
- **Purpose**: High-priority social discovery view answering: *"Who is in port with me today or this week?"*
- **Components**:
  - `FilterChipBar`: `[All Ports]`, `[Today]`, `[This Week]`, `[Specific Vessel]`.
  - `OverlapMatchCard`:
    - Port hero header with docking window (`e.g. "Cozumel, Mexico • 08:00 - 18:00"`).
    - Overlapping friend list:
      - Friend Avatar + Name + Vessel Name (`e.g. "Carnival Celebration"`).
      - Overlap window (`e.g. "Overlapping: 10:00 - 17:00 (7 hours)"`).
      - Quick Action: `[I'm interested]` for an eligible future overlap.
  - `EmptyState`: Friendly nautical illustration with notification toggle: *"Notify me when friends dock in my ports"*.

### Screen 3: `PortMapScreen`
- **Purpose**: Map and list view of itinerary-derived port calls and future/current PortMate overlaps.
- **Components**:
  - `PortMapHeader`: Current assignment and cached-itinerary freshness.
  - `PortCallMarker`: Port name, docking window and overlap count.
  - `OverlapLocationCard`: Connection, qualifying interval, same-port/nearby/same-ship relationship and meeting-intent action.

### Screen 4: `ProfileAssignmentScreen`
- **Purpose**: Manage the optional profile, current ship assignment, notification settings and account controls.
- **Components**:
  - `AssignmentCard`: Current ship and active assignment dates.
  - `SettingsControls`: Nearby-overlap radius, email notification, profile visibility and account actions.

---

## 5. UI Component States & Feedback Rules

Every component implemented by `gemini-worker` must support 5 standard states defined in coordination with `gpt-worker`:

| State | Visual Treatment |
|---|---|
| **Loading / Skeleton** | Shimmer animation using `surfaceElevated` on `surface` background. No raw spinners on full pages. |
| **Empty** | Centered nautical vector icon, descriptive title, one actionable primary button. |
| **Error / Failed Sync** | Non-blocking inline banner with retry action. Never block cached read-only content. |
| **Offline Mode** | Distinct `statusOffline` badge with timestamp of cached data. |
| **Interactive Press** | Scale transformation (0.98x) and opacity transition (0.85) on tap. |

---

## 6. Integration Contract Protocol (Gemini ↔ GPT)

1. **State Injection**:
   - `gemini-worker` consumes standardized View Model interfaces (e.g. `useItineraryTimeline()`, `usePortOverlaps()`).
   - `gpt-worker` provides mock data implementations in unit tests and concrete stores in production.
2. **Prop Interface Safety**:
   - Every UI component in `/mobile/src/components/` must export strict TypeScript / typed interfaces for its props.
   - UI components must never directly call network APIs; all interactions dispatch actions or trigger repository methods exposed by GPT.
3. **Accessibility**:
   - All interactive elements must carry `accessibilityLabel`, `accessibilityRole`, and `accessibilityHint`.
