# Supertime Open QA & Transparency Tracker

> **Our Vision:** Supertime is a 100% transparent, open platform. We build in public, we listen to our users, and we fix things out in the open. 
> 
> **Our Ultimate Goal:** Every single creator profile on this platform should have the tools, audience, and economic engine to become a billionaire in the next 10 years.

This document serves as our living tracker. We will use this to keep all pages up to date, record user feedback, and systematically test every component, button, text, media, and modal across the platform.

---

## 1. The Public Experience (External)

| Page / Feature | Component File | Status | Notes / User Feedback |
| :--- | :--- | :--- | :--- |
| **Landing Page** | `app/page.tsx` & `LandingPageClient.tsx` | 🟢 Reviewed / Active | *Fixed mobile padding, added Next.js Links, fixed creator grid alignment.* |
| **Explore Directory** | `app/explore/page.tsx` | 🟡 Needs Review | *Check layout and creator discoverability.* |
| **Creator Profile (Storefront)** | `app/[username]/page.tsx` & `CreatorClient.tsx` | 🟡 Needs Review | *Core revenue engine. Needs rigorous testing on mobile.* |
| **Checkout & Booking** | `app/components/BookingModal.tsx` | 🟡 Needs Review | *Check payment flows and Calendar UI.* |
| **Feedback Widget** | `app/components/FeedbackWidget.tsx` | 🟢 Active | *Widget is live. Logs need monitoring.* |

## 2. The Creator Experience (Internal)

| Page / Feature | Component File | Status | Notes / User Feedback |
| :--- | :--- | :--- | :--- |
| **Creator Dashboard** | `app/dashboard/page.tsx` & `OverviewTab.tsx` | 🟡 Needs Review | *Check analytics formatting and layout.* |
| **Dashboard: Storefront** | `app/dashboard/StorefrontTab.tsx` | 🟡 Needs Review | *Test product creation, editing, and UI states.* |
| **Dashboard: Tools** | `app/dashboard/ToolsTab.tsx` | 🟡 Needs Review | *Check third-party integration toggles.* |
| **Dashboard: Wallet** | `app/dashboard/WalletTab.tsx` | 🟡 Needs Review | *Verify payout mechanics and transaction history.* |
| **Dashboard / Studio (Content Management)** | `app/studio/page.tsx` & `StudioClient.tsx` | 🟢 Reviewed / Active | *Fixed routing, injected vision copy, built Immersive Command Center modal, standard theme.* |
| **Global Studio Recorder** | `app/dashboard/GlobalStudioRecorder.tsx` | 🟢 Updated | *Floating/docking feature added. Await feedback on touch.* |
| **Account Setup / Onboarding** | `app/setup/page.tsx` | 🟡 Needs Review | *Check for friction in the 0-to-1 onboarding.* |

## 3. The Live Product (Real-time)

| Page / Feature | Component File | Status | Notes / User Feedback |
| :--- | :--- | :--- | :--- |
| **Live Call / Broadcasting** | `app/live/page.tsx` & `LiveRoomClient.tsx` | 🟡 Needs Review | *Check Agora connection stability, mic/cam buttons.* |
| **Fundraise / Tip Overlays** | `app/fundraise/page.tsx` | 🟡 Needs Review | *Check UI for live donations.* |

## 4. Administrative & Legal

| Page / Feature | Component File | Status | Notes / User Feedback |
| :--- | :--- | :--- | :--- |
| **Admin Panel** | `app/admin/page.tsx` | 🟡 Needs Review | *Ensure super-admin controls are secure.* |
| **Terms / Privacy** | `app/terms/page.tsx` & `app/privacy/page.tsx` | 🟡 Needs Review | *Verify layout and readability.* |
| **Roadmap** | `app/roadmap/page.tsx` & `ROADMAP.md` | 🟡 Needs Review | *Ensure roadmap is visible and transparent.* |

---

## How to use this Tracker
- As user feedback comes in, log it directly under the **Notes / User Feedback** column.
- Change the **Status** emoji as we fix and test things:
  - 🔴 Broken / Urgent
  - 🟡 Needs Review / Testing
  - 🟢 Reviewed / Active
- Check the designated `tsx` component file whenever a bug is reported for that section.
