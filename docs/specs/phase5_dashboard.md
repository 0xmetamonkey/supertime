# Phase 5: The Dashboard — Specification

> **Status:** `DRAFT`
> **Owner:** @0xmetamonkey
> **Last Updated:** 2026-04-21
> **Linked Checklist Items:** [launch_checklist.md — Phase 5](../launch_checklist.md#phase-5-the-dashboard-creator-management)
> **Priority:** 🟡 P2 — Important but not blocking launch

---

## 1. Overview

### Problem Statement
Creators need a clear view of their earnings, product performance, and audience analytics — all in one place. Currently the dashboard is sparse, with no earnings history, no conversion metrics, and no withdrawal flow. Creators flying blind can't optimize their storefronts.

### Definition of Done
1. A creator can see a complete earnings history (list + chart).
2. A creator can request a payout withdrawal.
3. A creator can see page view vs. link click analytics per product.

---

## 2. User Stories

| ID | Story | Priority | Criteria |
|----|-------|----------|----------|
| US-5-01 | As a **creator**, I want to see a list and chart of all my past earnings. | P0 | AC-5-01 |
| US-5-02 | As a **creator**, I want to request a withdrawal to my bank account. | P0 | AC-5-02 |
| US-5-03 | As a **creator**, I want to see page views and conversion rates per product. | P1 | AC-5-03 |
| US-5-04 | As a **creator**, I want to see my top-performing products sorted by revenue. | P2 | AC-5-04 |

---

## 3. Design Spec

### 3.1 Dashboard Layout (Desktop)

```
┌──────────────────────────────────────────────────────┐
│  Sidebar Nav: Overview · Store · Analytics · Settings │
├──────────────────────────────────────────────────────┤
│  [Overview Page]                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Total Earned  │  │ This Month   │  │ Withdrawable│ │
│  │   ₹12,500    │  │   ₹3,200    │  │   ₹9,100   │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                       │
│  [Earnings Chart — 30 day line graph]                │
│                                                       │
│  [Recent Transactions — table]                        │
│  Date · Product/Source · Amount · Status             │
└──────────────────────────────────────────────────────┘
```

### 3.2 Analytics Page

- **Page Views:** Total views on `/[username]` per day (bar chart, 30-day)
- **Conversion Rate:** (Purchases ÷ Page Views) × 100, per product
- **Top Products:** Sorted by revenue descending, with sparkline per product
- **Click-through:** How many clicks each product "Buy Now" received vs. completed purchases

### 3.3 Withdrawal Request Flow

1. Creator clicks `"Request Withdrawal"` button
2. Modal asks for bank account details (IFSC + Account No.) — pre-filled if saved
3. Creator enters withdrawal amount (max = `withdrawable balance`)
4. Submit → Creates a pending withdrawal record in KV
5. Admin reviews and manually marks as `"Paid"` via Admin Panel (Phase 6)
6. Creator gets email: `"Your withdrawal of ₹[amount] is being processed"`

### 3.4 Stat Card Design

| Property | Value |
|---|---|
| Background | `--card` with `--glass-border` |
| Value typography | `48px`, `font-weight: 700`, `--primary` gradient text |
| Label typography | `14px`, `--muted-foreground` |
| Delta indicator | Green arrow up / red arrow down vs. last period |
| Loading state | Skeleton shimmer `120px × 32px` |

---

## 4. API Contract

### 4.1 `GET /api/dashboard/earnings`

- **Auth required:** Yes

**Response:**
```typescript
{
  success: true;
  data: {
    totalEarned: number;
    thisMonth: number;
    withdrawable: number;
    transactions: Array<{
      id: string;
      date: number;         // Unix timestamp
      source: string;       // "product:[title]" | "tip" | "call:[duration]"
      amount: number;
      currency: string;
      status: "completed" | "pending" | "refunded";
    }>;
  };
}
```

### 4.2 `POST /api/withdrawal/request`

- **Auth required:** Yes

**Request body:**
```typescript
{
  amount: number;
  bankAccount: {
    ifsc: string;
    accountNumber: string;
    accountName: string;
  };
}
```

**Response — 200:**
```typescript
{ success: true; withdrawalId: string; }
```

**KV keys written:**
```
user:[email]:withdrawals        → Array of withdrawal records
withdrawal:[withdrawalId]       → Full record (pending)
```

### 4.3 `GET /api/analytics/[username]`

- **Auth required:** Yes (creator only)

**Response:**
```typescript
{
  pageViews: Array<{ date: string; count: number }>;
  products: Array<{
    productId: string;
    title: string;
    views: number;
    clicks: number;
    purchases: number;
    revenue: number;
  }>;
}
```

---

## 5. Acceptance Criteria

| ID | Given | When | Then | Test ID |
|----|-------|------|------|---------|
| AC-5-01 | Creator has 5 past transactions | They open the Dashboard | All 5 appear in the transactions table | `earnings-list-renders` |
| AC-5-02 | Creator has ₹5000 withdrawable | They submit a ₹3000 withdrawal request | Pending withdrawal is created in KV | `withdrawal-request-created` |
| AC-5-03 | Product has 100 views and 10 purchases | Creator views Analytics | Conversion rate shows `10%` | `conversion-rate-correct` |

---

## 6. Open Questions

| ID | Question | Priority | Status |
|----|----------|----------|--------|
| Q-5-01 | How is `withdrawable` balance calculated — is it total earned minus platform fee minus previous withdrawals? | P0 | **Open** |
| Q-5-02 | What is the platform fee % taken from each transaction? (Defined in `docs/pricing_strategy.md`) | P0 | **Open** |
| Q-5-03 | Should analytics be tracked server-side (KV increment) or via a third-party like Plausible? | P1 | **Open** |
