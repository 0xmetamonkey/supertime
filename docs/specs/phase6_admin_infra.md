# Phase 6: Admin & Infrastructure — Specification

> **Status:** `DRAFT`
> **Owner:** @0xmetamonkey
> **Last Updated:** 2026-04-21
> **Linked Checklist Items:** [launch_checklist.md — Phase 6](../launch_checklist.md#phase-6-admin--infrastructure-scale--security)
> **Priority:** 🟡 P2 — Required before public launch

---

## 1. Overview

### Problem Statement
Without an admin panel, the platform is unmanageable at scale — there's no way to process payouts, debug creator accounts, or monitor Agora costs. Without rate limiting on sensitive endpoints, the platform is vulnerable to abuse. Without Open Graph tags, links shared on Twitter/iMessage look blank and unprofessional.

### Definition of Done
1. An admin (you) can view all creators, search by username, and see their sales/withdrawal queue.
2. Pending withdrawals can be marked as "Paid" with one click.
3. Rate limiting is active on `/api/checkout/initiate` and `/api/tip`.
4. Sharing `/[username]` on Twitter/iMessage shows a rich preview card with the creator's avatar, name, and bio.

---

## 2. User Stories

| ID | Story | Priority | Criteria |
|----|-------|----------|----------|
| US-6-01 | As an **admin**, I want to search for any creator by username. | P0 | AC-6-01 |
| US-6-02 | As an **admin**, I want to view and process the payout withdrawal queue. | P0 | AC-6-02 |
| US-6-03 | As an **admin**, I want to see total Agora broadcast minutes used this month. | P1 | AC-6-03 |
| US-6-04 | As a **fan**, when I share a creator's profile link, I want it to show a rich preview. | P0 | AC-6-04 |
| US-6-05 | As the **platform**, I want to rate-limit checkout and tip endpoints to prevent abuse. | P0 | AC-6-05 |

---

## 3. Design Spec

### 3.1 Admin Panel Layout (`/admin`)

> Protected by Clerk — only `SUPERTIME_ADMIN_USER_ID` has access (env variable).

```
┌─────────────────────────────────────────────┐
│  Admin Panel                   [Search bar] │
├─────────────────────────────────────────────┤
│  Tab: Creators  |  Withdrawals  |  Costs    │
├─────────────────────────────────────────────┤
│  [Creators Tab]                             │
│  Username · Email · Total Sales · Actions  │
│  @monkeyman   journ@...  ₹12,500  [View]   │
│  @someone     foo@...    ₹0       [View]   │
│                                             │
│  [Withdrawals Tab]                          │
│  Creator · Amount · Requested · Status     │
│  @monkeyman   ₹3,000   2026-04-10  [Pay]  │
│                                             │
│  [Costs Tab]                                │
│  Agora Minutes Used: 1,240 / 10,000 this month
└─────────────────────────────────────────────┘
```

### 3.2 Open Graph (OG) Tags — Per Creator Profile

Every `/[username]` page must dynamically generate these meta tags:

```html
<title>[Creator Display Name] | Supertime</title>
<meta name="description" content="[First 120 chars of bio]" />

<!-- Open Graph -->
<meta property="og:title" content="[Display Name] on Supertime" />
<meta property="og:description" content="[Bio snippet]" />
<meta property="og:image" content="[avatarUrl or /api/og?username=[username]]" />
<meta property="og:url" content="https://supertime.wtf/[username]" />
<meta property="og:type" content="profile" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Display Name] on Supertime" />
<meta name="twitter:description" content="[Bio snippet]" />
<meta name="twitter:image" content="[OG image URL]" />
```

> **OG Image Strategy:** Use `@vercel/og` to generate dynamic images server-side. The image should show the creator's avatar, name, and a `"supertime.wtf"` watermark on a dark gradient background.

### 3.3 Rate Limiting Rules

| Endpoint | Limit | Window | Strategy |
|---|---|---|---|
| `POST /api/checkout/initiate` | 10 requests | per IP, per 1 min | Block + 429 response |
| `POST /api/tip` | 5 requests | per IP, per 1 min | Block + 429 response |
| `POST /api/username/check` | 30 requests | per IP, per 1 min | Block + 429 response |
| `POST /api/booking/create` | 5 requests | per IP, per 5 min | Block + 429 response |

**Implementation:** Use `@upstash/ratelimit` with the existing Vercel KV (Upstash Redis) — no new infrastructure needed.

**Error response (429):**
```typescript
{
  success: false;
  error: "RATE_LIMITED";
  retryAfter: number; // seconds until reset
}
```

---

## 4. API Contract

### 4.1 `GET /api/admin/creators`

- **Auth required:** Yes (admin only — middleware checks `SUPERTIME_ADMIN_USER_ID`)

**Response:**
```typescript
{
  creators: Array<{
    username: string;
    email: string;
    totalSales: number;
    totalEarned: number;
    pendingWithdrawal: number;
  }>;
}
```

### 4.2 `POST /api/admin/withdrawal/mark-paid`

- **Auth required:** Yes (admin only)

**Request body:**
```typescript
{
  withdrawalId: string;
  transactionRef?: string; // Bank transfer reference (optional note)
}
```

**Response — 200:**
```typescript
{ success: true; }
```

**KV keys updated:**
```
withdrawal:[withdrawalId]:status   → "paid"
withdrawal:[withdrawalId]:paidAt   → Unix timestamp
user:[email]:withdrawable          → balance reduced by withdrawal amount
```

### 4.3 `GET /api/og` (Edge Function)

- **Auth required:** No (public — called by social media crawlers)
- **Returns:** PNG image (via `@vercel/og`)

**Query params:**
```
?username=[username]
```

**Renders:**
- Dark gradient background (`#0a0a0a → #1a0a2e`)
- Creator avatar (circular, 120px)
- Display name (bold, 48px, white)
- Bio snippet (max 100 chars, 18px, `--muted-foreground`)
- `supertime.wtf` watermark (bottom-right, 14px)

---

## 5. Acceptance Criteria

| ID | Given | When | Then | Test ID |
|----|-------|------|------|---------|
| AC-6-01 | Admin is logged in at `/admin` | They type a username in search | The matching creator row appears | `admin-search-works` |
| AC-6-02 | A withdrawal is pending | Admin clicks `"Pay"` | Status updates to `"paid"` in KV | `withdrawal-mark-paid` |
| AC-6-03 | Creator profile is shared on Twitter | Twitter crawler fetches the URL | `og:image` returns a valid PNG with creator info | `og-image-renders` |
| AC-6-04 | 11 checkout requests come from the same IP in 1 minute | 11th request hits `/api/checkout/initiate` | Response is `429` with `retryAfter` field | `rate-limit-429` |
| AC-6-05 | Non-admin user accesses `/admin` | Request hits the admin route | Redirected to `sign-in` or `403` page | `admin-protected` |

---

## 6. Out of Scope

- Automated payouts via Razorpay Payouts API (manual queue for v1)
- Creator banning / account suspension UI (handled via Clerk dashboard for v1)
- Cost dashboard beyond Agora minutes (Vercel, KV costs are monitored externally)

---

## 7. Open Questions

| ID | Question | Priority | Status |
|----|----------|----------|--------|
| Q-6-01 | Should the admin panel be at `/admin` (protected by middleware) or a completely separate internal tool? | P1 | **Open** |
| Q-6-02 | Is `@upstash/ratelimit` already installed, or does it need to be added? | P0 | **Open** |
