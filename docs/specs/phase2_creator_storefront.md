# Phase 2: The Creator Storefront — Full Specification

> **Status:** `APPROVED`
> **Owner:** @0xmetamonkey
> **Last Updated:** 2026-04-21
> **Linked Checklist Items:** [launch_checklist.md — Phase 2](../launch_checklist.md#phase-2-the-creator-storefront-the-money-maker)
> **Priority:** 🔴 P0 — Launch Blocker

---

## 1. Overview

### Problem Statement
A creator's public profile (`/[username]`) is the **only monetization surface** on the platform. Currently it lacks premium polish, has no structured product presentation, and the payment flow has critical UX gaps. Visitors who land on a creator's page must immediately understand the value, be able to browse offerings, and complete a purchase with zero friction.

### User Value
- **Creators**: A beautiful, conversion-optimized storefront that makes their content feel premium and trustworthy.
- **Fans/Visitors**: A clear, fast path from discovering a creator to paying them — without friction or confusion.

### Definition of Done
This phase is complete when a first-time visitor can:
1. Land on a creator's `/[username]` page and understand what the creator offers within 5 seconds.
2. Purchase a digital product and receive a confirmation email.
3. Send a tip with confetti feedback.
4. See the creator's social links and contact options.

---

## 2. User Stories

| ID | Story | Priority | Criteria |
|----|-------|----------|----------|
| US-2-01 | As a **fan**, I want to see a creator's products clearly displayed so I can decide what to buy. | P0 | AC-2-01 |
| US-2-02 | As a **fan**, I want to complete a product purchase in under 3 clicks. | P0 | AC-2-02 |
| US-2-03 | As a **fan**, I want to send a tip with a fun, satisfying animation. | P1 | AC-2-03 |
| US-2-04 | As a **fan**, I want to see empty state messaging when a creator has no products yet. | P1 | AC-2-04 |
| US-2-05 | As a **creator**, I want buyers to receive an automated email receipt after purchase. | P0 | AC-2-05 |
| US-2-06 | As a **creator**, I want to be notified via email when I make a sale. | P1 | AC-2-06 |
| US-2-07 | As a **fan**, I want to see the creator's social links below their bio. | P2 | AC-2-07 |

---

## 3. Design Spec

### 3.1 Layout & Grid

| Property | Desktop | Mobile |
|---|---|---|
| Max content width | `900px` (centered) | `100%` |
| Column grid | 2-col product cards | 1-col product cards |
| Horizontal padding | `32px` | `16px` |
| Section gap | `48px` | `32px` |
| Breakpoint (collapse) | `< 768px` | — |

### 3.2 Design Tokens (from `globals.css`)

| Token | Usage |
|---|---|
| `--background` | Page background |
| `--card` | Product card and Tip Jar surfaces |
| `--card-foreground` | Text inside cards |
| `--primary` | "Buy Now" CTA, active tab indicator |
| `--muted-foreground` | Price secondary text, placeholder bio |
| `--radius` | All card and button corners (`12px`) |
| `--glass-bg` | Creator profile header background |
| `--glass-border` | Header and card border |
| `--border` | Dividers, tab bar underline |

> **Rule**: No hardcoded hex colors in component code. All colors MUST reference a CSS variable.

### 3.3 Component State Matrix

| Component | Default | Hover | Loading | Error | Empty |
|---|---|---|---|---|---|
| Product Card | Image + title + price + CTA | Scale 1.02 + shadow lift | Skeleton shimmer | "Failed to load" text | — |
| Buy Now Button | Solid `--primary` fill | Lighten 10% + cursor:pointer | Spinner icon replaces text | Shake animation | — |
| Tip Preset Button | Outlined pill | Filled `--primary` | — | — | — |
| Send Tip Button | Gradient fill | Glow shadow | Spinner | Error toast | — |
| Product Grid | 2-col cards | — | Skeleton (2 cards) | Error message | **Empty state component** |
| Creator Avatar | Circular, 120px | — | Skeleton circle | Fallback initials | — |

#### Empty State (US-2-04)
When a creator has no products:
- Centered icon (shopping bag outline)
- Heading: `"Nothing for sale yet"`
- Sub-text: `"Check back soon — [Creator Name] is setting things up."`
- **No** broken grid, **no** placeholder cards

### 3.4 Wireframes

> Mid-fidelity wireframes. These define layout hierarchy and component placement — not exact visual polish. Final visual polish references `globals.css` design tokens.

#### Screen 1: Creator Storefront (Main)
![Wireframe: Creator Storefront](./wireframes/phase2-creator-storefront.png)

**Key layout rules:**
- Profile header is always visible above the tab bar (sticky optional on mobile)
- Avatar is `120px` diameter, circular, with a thin `--glass-border` ring
- Bio is max 2 lines on mobile, clamped with `line-clamp-2`; expandable on tap
- Social links cluster horizontally below bio, icon-only on mobile (tooltip on hover for desktop)
- Tab bar (`Store | Live | Book a Call`) uses underline-style active indicator, NOT pill/filled tabs
- Product cards are `equal height` in a row — no masonry layout

---

#### Screen 2: Checkout Modal
![Wireframe: Checkout Modal](./wireframes/phase2-checkout-modal.png)

**Key layout rules:**
- Modal appears on `Buy Now` click — NO page navigation
- Backdrop: `blur(8px)` + `rgba(0,0,0,0.6)` overlay
- Modal max-width: `480px`, centered, `--radius` corners
- Product summary at top (thumbnail + title + price)
- Form fields: Name, Email (required), no card details here — Razorpay handles payment
- CTA text: `"Pay ₹[amount]"` or `"Pay $[amount]"` — dynamic based on creator's currency config
- Trust badge: lock icon + `"Secured by Razorpay"` — always visible at bottom of modal
- Escape key or click-outside closes modal

---

#### Screen 3: Tip Jar
![Wireframe: Tip Jar](./wireframes/phase2-tip-jar.png)

**Key layout rules:**
- Positioned as a card section below the product grid
- Preset buttons: `$5 | $10 | $25 | Custom` — only one can be selected at a time
- Selecting "Custom" reveals an animated slide-down text input
- Send Tip button is disabled until an amount is selected/entered
- On success: full-screen confetti burst (canvas overlay), toast `"Tip sent! 🎉"`
- On error: toast `"Payment failed — please try again"`

### 3.5 Motion & Animation

| Trigger | Animation | Duration | Easing | Notes |
|---|---|---|---|---|
| Page load | Staggered card fade-in (top → bottom) | `400ms` | `ease-out` | 80ms delay between each card |
| Card hover | `scale(1.02)` + `box-shadow` lift | `150ms` | `ease-in-out` | — |
| Buy Now click | Button scale `0.97` | `80ms` | `ease-in` | |
| Modal open | Fade in + scale from `0.95 → 1` | `200ms` | `ease-out` | |
| Modal close | Fade out + scale `1 → 0.95` | `150ms` | `ease-in` | |
| Tip success | Confetti burst (`canvas-confetti` lib) | `3000ms` | — | Triggered after Razorpay success callback |
| Custom amount reveal | Slide down + fade in | `200ms` | `ease-out` | CSS max-height transition |
| Skeleton loading | Shimmer sweep (`left → right`) | `1200ms` | `linear` loop | Use CSS `@keyframes` |

---

## 4. API Contract

### 4.1 `GET /api/profile/[username]`

- **Auth required:** No (public)
- **Description:** Fetches all data needed to render a creator's storefront.

**Response — 200 OK:**
```typescript
{
  success: true;
  data: {
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    socials: {
      twitter?: string;
      instagram?: string;
      youtube?: string;
      website?: string;
    };
    isLive: boolean;
    isAcceptingCalls: boolean;
    products: Array<{
      id: string;
      title: string;
      description: string;
      price: number;           // in paise (INR) or cents (USD)
      currency: "INR" | "USD";
      imageUrl: string;
      type: "digital" | "link" | "service";
      downloadUrl?: string;    // signed URL, for digital type only
    }>;
  };
}
```

**Response — 404:**
```typescript
{ success: false; error: "USER_NOT_FOUND"; }
```

**KV keys read:**
```
owner:[username]              → creator email
user:[email]:displayName
user:[email]:bio
user:[email]:avatarUrl
user:[email]:socials
user:[email]:isLive
user:[email]:isAcceptingCalls
user:[email]:products         → JSON array
```

---

### 4.2 `POST /api/checkout/initiate`

- **Auth required:** No (public — any visitor can purchase)
- **Description:** Creates a Razorpay order and returns an `orderId` for the frontend Razorpay SDK.

**Request body:**
```typescript
{
  productId: string;       // ID of the product being purchased
  creatorUsername: string; // To resolve which creator this purchase is for
  buyerName: string;       // Provided by buyer in checkout form
  buyerEmail: string;      // For receipt email
}
```

**Response — 200 OK:**
```typescript
{
  success: true;
  orderId: string;           // Razorpay order ID
  amount: number;            // Amount in smallest currency unit
  currency: "INR" | "USD";
  key: string;               // Razorpay public key (safe to expose)
}
```

**Response — 400 Errors:**
```typescript
{ success: false; error: "PRODUCT_NOT_FOUND"; }
{ success: false; error: "INVALID_PAYLOAD"; }
```

---

### 4.3 `POST /api/checkout/verify`

- **Auth required:** No (webhook-style, verified by Razorpay signature)
- **Description:** Called after Razorpay payment success. Verifies the payment signature, fulfills the order (sends emails, logs sale), and returns the download URL for digital products.

**Request body:**
```typescript
{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  productId: string;
  creatorUsername: string;
  buyerEmail: string;
  buyerName: string;
}
```

**Response — 200 OK:**
```typescript
{
  success: true;
  message: "Payment verified";
  downloadUrl?: string; // Only for digital products. Signed, expires in 24h.
}
```

**Response — 400 Errors:**
```typescript
{ success: false; error: "SIGNATURE_MISMATCH"; } // Payment tampered
{ success: false; error: "ALREADY_FULFILLED"; }  // Duplicate webhook
```

**Side effects:**
- Sends buyer receipt email via Resend
- Sends creator "Sale Made!" notification email via Resend
- Appends sale record to `user:[creatorEmail]:sales` KV key

---

### 4.4 `POST /api/tip`

- **Auth required:** No
- **Description:** Creates a Razorpay order for a tip payment.

**Request body:**
```typescript
{
  creatorUsername: string;
  amount: number;          // in paise (INR) or cents (USD)
  currency: "INR" | "USD";
  tipperName?: string;     // Optional display name
}
```

**Response — 200 OK:**
```typescript
{
  success: true;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}
```

---

## 5. Acceptance Criteria

> Tests live in `tests/phase2-storefront.spec.ts`

| ID | Given | When | Then | Test ID |
|----|-------|------|------|---------|
| AC-2-01 | Creator has 2 products in KV | A visitor navigates to `/[username]` | Both products render in a 2-column grid within 2s | `storefront-renders-products` |
| AC-2-02 | Visitor clicks "Buy Now" on a product | The checkout modal opens | Modal is visible with product title, price, and form fields | `buy-now-opens-modal` |
| AC-2-03 | Visitor completes Razorpay payment (mocked) | Payment success callback fires | Confetti animation plays and success toast appears | `tip-confetti-on-success` |
| AC-2-04 | Creator has 0 products | Visitor navigates to their storefront | Empty state with "Nothing for sale yet" renders (no broken grid) | `empty-state-renders` |
| AC-2-05 | Razorpay payment is verified | `/api/checkout/verify` is called | Buyer receives email receipt within 30s | `buyer-email-receipt` |
| AC-2-06 | A sale is completed | `/api/checkout/verify` succeeds | Creator receives "Sale Made!" email within 30s | `creator-sale-email` |
| AC-2-07 | Creator has Instagram + Twitter set | Storefront loads | Both social link icons appear below bio and link to correct URLs | `social-links-render` |

### Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Creator page doesn't exist | 404 page with "Creator not found" messaging |
| Razorpay payment fails or is cancelled | Toast: `"Payment didn't go through — please try again"`. Modal stays open. |
| Buyer submits form with invalid email | Inline validation error: `"Please enter a valid email"` before Razorpay loads |
| Product download URL is expired | Error page with "Link expired — contact [creator]" + creator email |
| Network error on storefront load | Skeleton → Error state with "Couldn't load store" + retry button |
| Creator has no avatar set | Render initials avatar (e.g. `"JD"` for "John Doe") with `--primary` background |

---

## 6. Out of Scope (This Phase)

- **Discount codes / coupons** — deferred to post-launch
- **Subscription products** — deferred to Phase 5
- **Product review / rating system** — deferred
- **Multi-currency auto-detection** — currency is set by creator in their settings; not auto-detected
- **Google Meet / Zoom booking links** — covered in Phase 3

---

## 7. Open Questions

| ID | Question | Priority | Status |
|----|----------|----------|--------|
| Q-2-01 | Is the currency fixed to INR or should creators be able to switch to USD? | P1 | **Open** |
| Q-2-02 | Should download links be single-use or time-limited (24h)? | P0 | **Open** |
| Q-2-03 | Who sends transactional emails — Resend or another provider? | P0 | **Open** |
