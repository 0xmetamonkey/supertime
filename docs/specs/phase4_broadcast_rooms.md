# Phase 4: Broadcast Rooms — Specification

> **Status:** `DRAFT`
> **Owner:** @0xmetamonkey
> **Last Updated:** 2026-04-21
> **Linked Checklist Items:** [launch_checklist.md — Phase 4](../launch_checklist.md#phase-4-broadcast-rooms-1-to-many)
> **Priority:** 🟠 P1 — Important

---

## 1. Overview

### Problem Statement
Broadcast rooms (1-to-many live streaming) are the highest-visibility feature — visible to all visitors on a creator's public profile when they go live. The current implementation has a broken sidebar chat, no live tip alerts, and the viewer experience lacks a premium overlay UI. This must feel like a polished live streaming product (think: Twitch meets Linktree).

### Definition of Done
1. A creator can go live from the Studio and their profile page immediately shows "LIVE" status.
2. Viewers can join the stream with a single click and see the video full-screen.
3. Sidebar chat is visible and functional for the host.
4. Live tip alerts appear as animated overlays on the host's video.
5. The viewer UI is minimal and non-intrusive — controls fade out automatically.

---

## 2. User Stories

| ID | Story | Priority | Criteria |
|----|-------|----------|----------|
| US-4-01 | As a **viewer**, I want to enter a live broadcast room with one click from the creator's profile. | P0 | AC-4-01 |
| US-4-02 | As a **viewer**, I want the stream UI to be minimal so the video is the focus. | P0 | AC-4-02 |
| US-4-03 | As a **creator (host)**, I want to see a live chat sidebar while I'm broadcasting. | P0 | AC-4-03 |
| US-4-04 | As a **creator (host)**, I want to see animated tip alerts over my video when someone sends a tip. | P1 | AC-4-04 |
| US-4-05 | As a **viewer**, I want to see a clear "LIVE" indicator and viewer count on the profile page. | P1 | AC-4-05 |

---

## 3. Design Spec

### 3.1 Profile Page — Live State

When `isLive: true`:
- Creator's avatar gets a red pulsing `LIVE` badge ring
- A large `"▶ Enter Live Room"` CTA button appears below the bio
- Sub-text: `"🔴 Live now · [X] watching"`
- Tab bar still shows `Store | Live | Book a Call`; the `Live` tab is highlighted

### 3.2 Viewer Room Layout

```
┌──────────────────────────────────────┐
│         [Full-screen video]          │  ← 100dvh, no chrome
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Creator Name  🔴 LIVE  👁 143  │  │  ← Top bar, auto-hides after 3s
│  └────────────────────────────────┘  │
│                                      │
│   [Tip Alert Overlay — slides in]    │  ← Animated, auto-dismisses 4s
│                                      │
│  ┌──────────────────────────────┐    │
│  │  💬  Send Tip  ❤  Leave     │    │  ← Bottom control bar, auto-hides
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

- **No sidebar on mobile.** Chat is a slide-up drawer triggered by 💬 icon.
- **Desktop:** Optional split-view (video 75% | chat sidebar 25%)

### 3.3 Host View Layout (Studio HUD)

```
┌──────────────────────────────────────────┐
│ [Self-video preview, 16:9]               │
├──────────────────────────────────────────┤
│ 🔴 LIVE  ·  00:12:34  ·  👁 143 viewers  │
├──────────────────────────────────────────┤
│ [Chat sidebar — Ably Realtime]           │
│  fan1: "Great content!"                  │
│  fan2: "Sent a $10 tip! 🎉"             │
│  ...                                     │
│ [Message input + Send]                   │
├──────────────────────────────────────────┤
│ [Controls: Mute · Cam Off · End Stream]  │
└──────────────────────────────────────────┘
```

### 3.4 Tip Alert Overlay

| Property | Value |
|---|---|
| Trigger | Successful tip payment webhook |
| Position | Center-top of video, slides down from top |
| Content | `"🎉 [Name] sent ₹[amount]!"` |
| Duration | Visible for `4000ms` |
| Animation | Slide in `300ms ease-out` → hold → fade out `300ms ease-in` |
| Stack behavior | Multiple tips queue and display sequentially |

### 3.5 Motion & Animation

| Trigger | Animation | Duration |
|---|---|---|
| LIVE badge | Pulsing red ring scale `1→1.2→1` | `1500ms` loop |
| Tip alert in | Slide down + fade in | `300ms ease-out` |
| Tip alert out | Fade out + scale `1→0.95` | `300ms ease-in` |
| Control bar | Auto-hide after 3s inactivity (fade out) | `200ms` |
| Control bar reveal | Reveal on tap/mousemove | `150ms` |
| Viewer count | Animated number counter on change | `400ms` |

---

## 4. API Contract

### 4.1 `POST /api/stream/start`

- **Auth required:** Yes (creator only)

**Response:**
```typescript
{
  success: true;
  agoraToken: string;   // RTC token for host role
  channelName: string;  // Based on creator username
  agoraUid: number;
}
```

**KV keys written:**
```
user:[email]:isLive          → true
user:[email]:streamStartedAt → Unix timestamp
```

### 4.2 `POST /api/stream/end`

- **Auth required:** Yes (creator only)

**KV keys written:**
```
user:[email]:isLive          → false
user:[email]:streamStartedAt → null
```

### 4.3 `GET /api/stream/token/[username]`

- **Auth required:** No (public — viewers need a token to join)

**Response:**
```typescript
{
  success: true;
  agoraToken: string;   // RTC token for audience role
  channelName: string;
  agoraUid: number;     // Random UID assigned to viewer
  isLive: boolean;      // If false, stream has ended
}
```

### 4.4 Tip Alert — Realtime Signaling (Ably)

When a tip is verified via `/api/tip/verify`, the server publishes to:
- **Channel:** `stream:[creatorUsername]:alerts`
- **Message:**
```typescript
{
  type: "TIP_ALERT";
  tipperName: string;
  amount: number;
  currency: string;
}
```
The Studio HUD subscribes to this channel and renders the overlay.

---

## 5. Acceptance Criteria

| ID | Given | When | Then | Test ID |
|----|-------|------|------|---------|
| AC-4-01 | Creator `isLive: true` | Visitor opens `/[username]` | `"Enter Live Room"` button is visible | `live-cta-visible` |
| AC-4-02 | Viewer is in broadcast room | No interaction for 3s | Control bar fades out | `controls-autohide` |
| AC-4-03 | Creator is broadcasting | They look at Studio HUD | Chat sidebar is visible and new messages appear in real-time | `chat-sidebar-renders` |
| AC-4-04 | Tip is verified | Ably message is published | Tip alert animates onto the host's video | `tip-alert-overlay` |
| AC-4-05 | Creator is live | Visitor is on their profile | Live badge ring is pulsing and viewer count is displayed | `live-badge-pulsing` |

---

## 6. Out of Scope

- Stream recording for broadcast (covered in a future "Replay" feature)
- Co-host / guest invites to the broadcast
- Moderation tools (ban, timeout viewer)
- Stream quality selector for viewers

---

## 7. Open Questions

| ID | Question | Priority | Status |
|----|----------|----------|--------|
| Q-4-01 | Should viewers need to be authenticated to join a broadcast, or is it fully public? | P0 | **Open** |
| Q-4-02 | Is there a max viewer count enforced by Agora tier? What is it? | P1 | **Open** |
