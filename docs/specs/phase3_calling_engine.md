# Phase 3: The Calling Engine — Specification

> **Status:** `DRAFT`
> **Owner:** @0xmetamonkey
> **Last Updated:** 2026-04-21
> **Linked Checklist Items:** [launch_checklist.md — Phase 3](../launch_checklist.md#phase-3-the-calling-engine-scheduled--real-time)
> **Priority:** 🟠 P1 — Important

---

## 1. Overview

### Problem Statement
1:1 video calls are the **core product differentiator** for Supertime. Currently the booking flow has timezone issues, the call UI is not mobile-first, and there is no option for creators to offer their own meeting link (Google Meet, Zoom) as an alternative to Supertime Native. Scheduled calls must be confirmed end-to-end.

### Definition of Done
1. A fan can view a creator's availability, pick a time, and pay for a booked call.
2. Both creator and fan receive calendar invite (.ics) emails after booking.
3. Creator can choose: Supertime Native (Agora), Google Meet, or Custom link as the call location.
4. The Supertime Native call room is mobile-first with no browser chrome.

---

## 2. User Stories

| ID | Story | Priority | Criteria |
|----|-------|----------|----------|
| US-3-01 | As a **fan**, I want to view a creator's available time slots in my local timezone. | P0 | AC-3-01 |
| US-3-02 | As a **fan**, I want to book and pay for a 1:1 call in one checkout flow. | P0 | AC-3-02 |
| US-3-03 | As a **fan and creator**, I want to receive a calendar invite (.ics) after booking. | P0 | AC-3-03 |
| US-3-04 | As a **creator**, I want to set my own Google Meet link as the call location. | P1 | AC-3-04 |
| US-3-05 | As a **creator**, I want the Supertime Native call room to feel mobile-optimized. | P1 | AC-3-05 |

---

## 3. Design Spec

### 3.1 Availability Calendar UI

- **Display:** Month view, accessible via a scrollable week strip on mobile
- **Available slots:** Highlighted in `--primary` tint
- **Booked slots:** Greyed out, non-clickable
- **Timezone selector:** Dropdown at top of calendar, defaulting to visitor's `Intl.DateTimeFormat().resolvedOptions().timeZone`
- **Duration options:** Pulled from creator's call templates (30min, 60min, etc.)

### 3.2 Call Location Options (Creator Settings)

| Option | UI Label | Behavior |
|---|---|---|
| Supertime Native | `"Supertime Room (Default)"` | Agora-powered. System generates a private room link for the booking time. |
| Google Meet | `"Google Meet"` | Creator connects Google account via OAuth. System auto-generates meet link per booking. |
| Custom Link | `"My Zoom / Custom Room"` | Creator pastes their static personal meeting room URL. Same link used for all calls. |

### 3.3 Native Call Room Layout (Mobile-First)

- Full viewport height (`100dvh`), no browser address bar visible
- Remote video: full-screen background
- Local video: PiP (picture-in-picture) overlay, draggable, `180x240px`
- Controls bar: pinned to bottom, auto-hides after 3s of inactivity
- Controls: Mute mic · Mute camera · Flip camera (mobile) · End call · Timer
- Timer: live elapsed time display, top-center, subtle `rgba` background

---

## 4. API Contract

### 4.1 `POST /api/booking/create`

**Request body:**
```typescript
{
  creatorUsername: string;
  slotTimestamp: number;   // Unix timestamp (UTC) of the selected slot
  durationMinutes: number;
  buyerName: string;
  buyerEmail: string;
  razorpay_payment_id?: string; // For paid calls
}
```

**Response — 200:**
```typescript
{
  success: true;
  bookingId: string;
  callLink: string;   // Agora room URL, Meet URL, or custom URL
  icsUrl: string;     // Signed URL to download .ics file
}
```

**KV keys written:**
```
user:[creatorEmail]:bookings  → Array of booking objects
booking:[bookingId]           → Full booking record
```

### 4.2 `GET /api/booking/availability/[username]`

**Response:**
```typescript
{
  slots: Array<{
    timestamp: number;     // UTC Unix
    available: boolean;
    durationOptions: number[]; // [30, 60] minutes
  }>;
}
```

---

## 5. Acceptance Criteria

| ID | Given | When | Then | Test ID |
|----|-------|------|------|---------|
| AC-3-01 | Creator has Mon 3pm–5pm availability (UTC) | Fan in UTC+5:30 views calendar | Slot shows as `8:30pm–10:30pm IST` | `timezone-display-correct` |
| AC-3-02 | Fan picks a slot and completes payment | Booking is confirmed | Booking record is created in KV | `booking-created-in-kv` |
| AC-3-03 | A booking is created | Both emails are sent | Creator and fan each receive .ics attachment | `ics-emails-sent` |
| AC-3-04 | Creator has Google Meet set | A booking is made | Call link in confirmation is a meet.google.com URL | `meet-link-in-booking` |
| AC-3-05 | User opens Native call room on a 375px screen | Page renders | Controls are at bottom, video fills screen, no horizontal scroll | `mobile-call-room-layout` |

---

## 6. Open Questions

| ID | Question | Priority | Status |
|----|----------|----------|--------|
| Q-3-01 | Does Google Meet OAuth require a separate app review? What's the timeline? | P1 | **Open** |
| Q-3-02 | For unpaid calls (free creators), is booking still required or can they share a direct link? | P1 | **Open** |
| Q-3-03 | What happens if a creator cancels a booked call? Refund flow? | P0 | **Open** |
