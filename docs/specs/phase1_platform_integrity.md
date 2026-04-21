# Phase 1: Core Platform Integrity — Specification

> **Status:** `DRAFT`
> **Owner:** @0xmetamonkey
> **Last Updated:** 2026-04-21
> **Linked Checklist Items:** [launch_checklist.md — Phase 1](../launch_checklist.md#phase-1-core-platform-integrity-getting-the-basics-flawless)
> **Priority:** 🔴 P0 — Launch Blocker

---

## 1. Overview

### Problem Statement
Authentication, onboarding, and global navigation are the **entry point** for every user on the platform. Broken or confusing flows here mean no one ever reaches the monetization features. Mobile experience, reserved username protection, and profile completeness are foundational.

### Definition of Done
1. A new user can sign up, claim a username (excluding reserved names), and reach a functional dashboard.
2. The sign-in/sign-up UI has no horizontal scroll on mobile.
3. A 404 page exists for unknown routes and unknown usernames.
4. The PWA manifest is configured so the app can be added to a home screen.

---

## 2. User Stories

| ID | Story | Priority | Criteria |
|----|-------|----------|----------|
| US-1-01 | As a **new creator**, I want to claim a username during onboarding so I have a unique profile URL. | P0 | AC-1-01 |
| US-1-02 | As a **new creator**, I want to see a "complete your profile" progress widget so I know what's left to do. | P1 | AC-1-02 |
| US-1-03 | As any **user on mobile**, I want the auth pages to display without horizontal scrolling. | P0 | AC-1-03 |
| US-1-04 | As a **visitor**, I want to see a helpful 404 page when I visit a non-existent username. | P1 | AC-1-04 |
| US-1-05 | As a **mobile user**, I want to add Supertime to my home screen as a PWA. | P2 | AC-1-05 |

---

## 3. Design Spec

### 3.1 Reserved Usernames (Block List)
These usernames must be rejected at the username claim step:

```
admin, supertime, api, root, support, help, www, mail,
blog, store, live, studio, dashboard, me, you, creator,
login, logout, signup, signin, about, terms, privacy
```

### 3.2 Username Validation Rules
- **Min length:** 3 characters
- **Max length:** 30 characters
- **Allowed characters:** `a-z`, `0-9`, `_`, `-`
- **No spaces, no uppercase** (auto-lowercased on input)
- **Real-time availability check:** debounced 500ms after typing stops
- **Visual feedback:** green checkmark (available) / red X (taken or reserved)

### 3.3 Profile Completeness Widget

| Item | Points |
|---|---|
| Username claimed | 20 |
| Avatar uploaded | 20 |
| Bio written | 20 |
| At least 1 product added | 20 |
| At least 1 social link added | 20 |

Total: 100 points → shown as a progress bar labeled `"Profile [X]% complete"`

### 3.4 Mobile Auth Layout
- Max-width: `400px`, centered
- No fixed widths on input fields — use `width: 100%`
- Font size minimum `16px` on inputs (prevents iOS zoom)
- Safe-area padding for notched phones: `env(safe-area-inset-*)`

### 3.5 404 Page Design
- Full-page centered layout
- Large `404` heading in gradient text
- Sub-heading: `"This creator doesn't exist... yet."`
- CTA button: `"Go Home"` → `/`
- Optional secondary CTA: `"Claim this username"` → `/sign-up`

---

## 4. API Contract

### 4.1 `POST /api/username/check`

- **Auth required:** Yes (must be signed in to claim)
- **Description:** Checks if a username is available and not reserved.

**Request body:**
```typescript
{ username: string; }
```

**Response:**
```typescript
{ available: boolean; reason?: "TAKEN" | "RESERVED" | "INVALID_FORMAT"; }
```

### 4.2 `POST /api/username/claim`

- **Auth required:** Yes
- **Description:** Claims a username for the authenticated user.

**Request body:**
```typescript
{ username: string; }
```

**Response — 200 OK:**
```typescript
{ success: true; username: string; }
```

**Response — 409 Conflict:**
```typescript
{ success: false; error: "USERNAME_TAKEN" | "USERNAME_RESERVED"; }
```

**KV keys written:**
```
owner:[username]         → user's email (for profile routing)
user:[email]:username    → the claimed username
```

---

## 5. Acceptance Criteria

> Tests live in `tests/phase1-platform-integrity.spec.ts`

| ID | Given | When | Then | Test ID |
|----|-------|------|------|---------|
| AC-1-01 | New user is in onboarding | They enter `"admin"` as username | Error: `"This username is reserved"` | `reserved-username-blocked` |
| AC-1-02 | Creator has no avatar or bio | They open the Dashboard | Profile completeness widget shows `< 100%` | `profile-completeness-shows` |
| AC-1-03 | On a 375px wide screen | User visits `/sign-up` | No horizontal scroll exists on the page | `auth-mobile-no-scroll` |
| AC-1-04 | No user exists at `/fake-xyz-9999` | A visitor navigates there | 404 page renders with "Go Home" CTA | `404-page-renders` |
| AC-1-05 | User opens the app in Chrome on Android | They tap "Add to Home Screen" | App installs as PWA with correct icon and name | Manual test |

---

## 6. Out of Scope

- Magic link / OTP flow visual design (Clerk handles UI — just styling overrides)
- Avatar cropping tool (basic upload only for v1)
- Email verification customization

---

## 7. Open Questions

| ID | Question | Priority | Status |
|----|----------|----------|--------|
| Q-1-01 | Should username changes be allowed after claiming? If so, with what restrictions? | P1 | **Open** |
| Q-1-02 | Does the profile completeness widget block publishing the storefront, or is it just advisory? | P1 | **Open** |
