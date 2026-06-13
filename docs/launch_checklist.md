# Supertime v1.0 Launch Master Checklist

This is the definitive "50-point list" tracking every remaining feature, edge-case, and security requirement needed before we can safely launch Supertime to creators. 

> [!NOTE] 
> This is a living document. We will aggressively tackle these in vertical slices (design → frontend → backend → test).
> Each phase now has a **full specification document** in `docs/specs/`. The spec is the source of truth for design, API contracts, and acceptance criteria. **Do not build without a spec.**

## Spec Index
| Phase | Spec Document | Status |
|---|---|---|
| Phase 1: Platform Integrity | [phase1_platform_integrity.md](docs/specs/phase1_platform_integrity.md) | `DRAFT` |
| Phase 2: Creator Storefront | [phase2_creator_storefront.md](docs/specs/phase2_creator_storefront.md) | `APPROVED` |
| Phase 3: Calling Engine | [phase3_calling_engine.md](docs/specs/phase3_calling_engine.md) | `DRAFT` |
| Phase 4: Broadcast Rooms | [phase4_broadcast_rooms.md](docs/specs/phase4_broadcast_rooms.md) | `DRAFT` |
| Phase 5: Dashboard | [phase5_dashboard.md](docs/specs/phase5_dashboard.md) | `DRAFT` |
| Phase 6: Admin & Infra | [phase6_admin_infra.md](docs/specs/phase6_admin_infra.md) | `DRAFT` |
| Template | [_SPEC_TEMPLATE.md](docs/specs/_SPEC_TEMPLATE.md) | — |

---

## Phase 1: Core Platform Integrity (Getting the Basics Flawless)
> 📄 **Spec:** [phase1_platform_integrity.md](docs/specs/phase1_platform_integrity.md)
**Goal:** Authentication, Routing, and basic Creator Profiles must be bulletproof.

- [ ] **Authentication Polish**
  - [ ] Custom Domain Email integration (Clerk -> Resend via `supertime.wtf`)
  - [x] Mobile-optimized Login/Signup UI (no horizontal scrolling, clean glassmorphism)
  - [ ] OTP / Magic Link flow styling
- [ ] **Onboarding Flow**
  - [ ] Username claim logic (disallow reserved names: admin, supertime, api)
  - [ ] Initial Avatar upload / crop
  - [ ] "Complete your profile" progress widget on Dashboard
- [ ] **Global Routing & Layout**
  - [ ] PWA Manifest configuration (Add to Home Screen banner, icons, splash screens)
  - [ ] Mobile Bottom Navigation (sticky, safe-area padded)
  - [ ] 404 / User Not Found fallback pages

---

## Phase 2: The Creator Storefront (The Money Maker)
> 📄 **Spec:** [phase2_creator_storefront.md](docs/specs/phase2_creator_storefront.md) · 🧪 **Tests:** [tests/launch-specs.spec.ts](tests/launch-specs.spec.ts)
**Goal:** The public `/[username]` profile must look premium and handle payments flawlessly.

- [ ] **Store UI Polish**
  - [ ] Empty states for stores with no products
  - [ ] Premium glassmorphism product cards
  - [ ] Social Link clustering below bio
- [x] **Product Delivery System**
  - [x] Secure file download links (signed URLs for Digital downloads)
  - [x] Automated Email receipt to buyer upon purchase
  - [x] Automated "Sale Made!" email to creator
- [x] **Payments & Tipping (Razorpay)**
  - [x] Tip Jar UI polish (Preset amounts + custom entry + Confetti animation)
  - [x] Razorpay Webhook listener (async fulfillment verification)
  - [x] Refund/Dispute protocol documentation

---

## Phase 3: The Calling Engine (Scheduled & Real-Time)
> 📄 **Spec:** [phase3_calling_engine.md](docs/specs/phase3_calling_engine.md)
**Goal:** 1:1 Video Calls must be scheduled seamlessly, avoiding the technical friction of "browser ringing".

- [ ] **Calendar & Booking System**
  - [ ] Availability Calendar UI on Creator Storefront (Timezone aware)
  - [ ] Booking Checkout Flow (Razorpay integration for paid calls)
  - [ ] Automated Calendar Invites (.ics) emailed to Creator and Fan
- [ ] **Call Location Provider Options**
  - [ ] **Option 1: Supertime Native (Agora)** - Generate private room link for the scheduled time.
  - [ ] **Option 2: Google Meet** - OAuth integration to auto-generate GMeet links.
  - [ ] **Option 3: Custom/Zoom** - Allow creator to paste their static personal meeting room link.
- [ ] **Supertime Native Room Polish**
  - [ ] Mobile-first Viewport (hide browser chrome, full screen video)
  - [ ] Permissions graceful fallback (Help I can't enable my camera!)
  - [ ] "Director's Console" for Creator Call controls (Mute, Flip Cam)

---

## Phase 4: Broadcast Rooms (1-to-Many)
> 📄 **Spec:** [phase4_broadcast_rooms.md](docs/specs/phase4_broadcast_rooms.md)
**Goal:** Restoring the premium streaming experience.

- [ ] **Host View**
  - [ ] Sidebar Chat restore & style
  - [ ] Live tip alerts (animations over video)
- [ ] **Viewer View**
  - [ ] Minimalist transparent UI over video stream
  - [ ] "Enter Room" / "Live Broadcast" CTA on the creator's profile

---

## Phase 5: The Dashboard (Creator Management)
> 📄 **Spec:** [phase5_dashboard.md](docs/specs/phase5_dashboard.md)
**Goal:** Creators must clearly understand their earnings and data.

- [ ] **Wallet & Payouts**
  - [ ] Earnings historical chart / list
  - [ ] Bank Account withdrawal request flow (Admin payout queue)
- [ ] **Analytics (House of Extsy)**
  - [ ] Track Page Views vs Link Clicks
  - [ ] Conversion rate metrics per product

---

## Phase 6: Admin & Infrastructure (Scale & Security)
> 📄 **Spec:** [phase6_admin_infra.md](docs/specs/phase6_admin_infra.md)
**Goal:** Behind-the-scenes control and cost management.

- [ ] **Super Admin Panel**
  - [ ] Creator search & impersonation (for debugging)
  - [ ] Global Payout queue (click to mark as "Paid")
  - [ ] Broadcast cost tracking (Agora minutes used)
- [ ] **Platform Security & SEO**
  - [ ] Rate limiting on sensitive APIs (Login, Checkout)
  - [ ] Dynamic OpenGraph tags (Twitter cards/iMessage previews) for Creator Profiles

---

## Phase 7: Meta & External Integrations (Launch Prep)
**Goal:** Bringing the advanced marketing tools online.

- [ ] **Instagram Bot (Native Login)**
  - [ ] Record end-to-end Demo Video of Bot setup & triggering.
  - [ ] Submit App to Meta for `instagram_manage_messages` Review.
  - [ ] App approved -> Switch from Dev to Live.
- [ ] **Push Notifications / Marketing**
  - [ ] User opt-in request for Web Push (Firebase/Vapid)
  - [ ] Mailchimp/Resend Audience sync

---

## Pre-Launch Final Checks
- [ ] **Desktop QA Pass:** Verify across Chrome, Safari, Edge
- [ ] **Mobile iOS QA Pass:** FaceID/Safari quirks, safe-area-inset
- [ ] **Mobile Android QA Pass:** Chrome PWA behavior
- [ ] **Load Testing:** Simulate 50 concurrent checkouts/calls
