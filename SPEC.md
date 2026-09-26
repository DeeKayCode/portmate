# PortMate – Product Specification

> [!WARNING]
> **STATUS: BOOTSTRAP PLACEHOLDER**
> The formal product specification has not yet been approved for autonomous implementation.
> Worker agents MUST NOT begin product feature development until this placeholder is replaced with the approved specification.

## 1. Product Vision
**PortMate** is an itinerary tracking and social connectivity mobile platform specifically designed for cruise ship crew members and workers. It enables crew members to track ports of call, discover overlapping schedules with friends across different vessels, and stay connected while at sea and in port.

## 2. Core Pillars (Target Scope)
1. **Profile & Vessel Assignment**: Crew profile, role, current vessel, and historical assignments.
2. **Itinerary Management**: Personal and vessel cruise itinerary tracking, offline-first port schedule.
3. **Port Overlap Calculation**: Automated matching to identify when friends or former colleagues are docked in the same port at the same time.
4. **Social & Communication**: Crew meetups, recommendations for port amenities (Wi-Fi spots, crew discounts, supplies).
5. **Event-Driven Updates**: Port schedule changes, delay notifications, meetup invites.

## 3. Architecture Overview
- **Mobile Client**:
  - UI/UX layer owned by `gemini-worker` (Gemini / Antigravity).
  - Application logic, data store, offline caching, and API client owned by `gpt-worker` (Codex / GPT).
- **Backend Server**:
  - Owned by ÓE GenAI on the `server` branch.
  - Debian LXC containerized deployment with Docker Compose.
- **Contract-Driven Integration**:
  - All communication is strictly governed by schemas in `/contracts`.

---
*Specification revision: bootstrap-v1.0 (Awaiting final product contract approval)*
