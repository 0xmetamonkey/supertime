---
name: Supertime Design System
description: The premium, dark-mode-first visual language for Supertime, a next-gen creator monetization and booking platform.
stack: React, Next.js, Tailwind CSS
---

# Supertime Design System

This document captures the visual identity, component patterns, and information architecture of the Supertime platform. It is designed to be consumed by AI generators (like Stitch) to ensure generated screens perfectly match the existing codebase.

## 1. Visual Atmosphere & Philosophy
Supertime is a premium, high-trust creator platform. The design must feel native, sleek, and highly polished, resembling a high-end fintech or exclusive social app.
- **Dark-Mode First:** The platform relies heavily on deep zinc/black backgrounds with high-contrast text. It feels nocturnal and premium.
- **Glassmorphism:** Heavy use of translucent backgrounds (`bg-opacity-50`, `bg-zinc-900/50`) combined with `backdrop-blur-xl` to create depth.
- **Border Radii:** Soft, friendly, but modern. Elements use generous border radii (`rounded-2xl`, `rounded-3xl`, `rounded-full`). Avatars are often `rounded-2xl` (squircles) rather than perfect circles to stand out.
- **Micro-interactions:** Interactive elements always have hover states (`hover:bg-zinc-800`, `transition-all`, `duration-200`).

## 2. Color Palette
Colors are strictly managed via Tailwind's default palette, leaning heavily into Zinc for neutrals.

### Backgrounds
- **App Background:** `bg-gray-50` (Light) / `bg-black` or `bg-zinc-950` (Dark)
- **Card Background:** `bg-white` (Light) / `bg-zinc-900/50` or `bg-zinc-900/80` (Dark)
- **Hover States:** `hover:bg-gray-100` (Light) / `hover:bg-zinc-800` (Dark)
- **Accent Backgrounds:** `bg-zinc-100` (Light) / `bg-zinc-800` (Dark) for secondary buttons.

### Borders
- **Standard Border:** `border-gray-200` (Light) / `border-zinc-800` or `border-zinc-800/50` (Dark)
- **Active/Focus Border:** `ring-2 ring-zinc-500`

### Typography Colors
- **Primary Text:** `text-gray-900` (Light) / `text-white` or `text-zinc-50` (Dark)
- **Secondary/Muted Text:** `text-gray-500` (Light) / `text-zinc-400` (Dark)
- **Tertiary Text:** `text-gray-400` (Light) / `text-zinc-500` (Dark)

### Functional Accents
- **Success / Active (Supercalls, Availability):** `text-emerald-500`, `bg-emerald-500/10`
- **Destructive / Error:** `text-red-500`, `bg-red-500/10`
- **Brand Highlights:** Often uses neutral high-contrast (e.g., White text on Black button, or Black text on White button) rather than a loud brand color.

## 3. Typography & Spacing
- **Font Family:** `font-sans` (Inter or system UI sans-serif).
- **Scale:**
  - H1 / Profile Names: `text-2xl font-bold tracking-tight`
  - H2 / Section Headers: `text-xl font-semibold tracking-tight`
  - Body: `text-sm` or `text-base`
  - Meta/Subtext: `text-xs font-medium text-zinc-400`
- **Spacing (Tailwind Scale):**
  - Inner padding for cards is generally generous: `p-4` to `p-6`.
  - Gap between stacked elements: `gap-4` or `space-y-4`.
  - Section spacing: `py-8` or `gap-8`.

## 4. Core Component Patterns

### Cards & Panels
Used for creator storefront items, settings panels, and dashboard widgets.
```html
<div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl">
  <!-- Content -->
</div>
```

### Primary Buttons
High-contrast, fully rounded or squircle buttons.
```html
<button className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl py-3 px-4 transition-transform active:scale-[0.98]">
  Action Text
</button>
```

### Secondary Buttons
Subtle, neutral actions.
```html
<button className="w-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium rounded-xl py-3 px-4 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
  Secondary Action
</button>
```

### Badges & Tags
Used for prices, statuses, or categories.
```html
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
  Label
</span>
```

## 5. Information Architecture & Terminology
When generating layouts, respect the native shape of the data and use exact terminology.

### Vocabulary
- **Supercalls:** The proprietary, native, in-browser real-time video calling engine (do not use "Zoom" or "Google Meet").
- **Feast:** The creator's public timeline/feed where scheduled calls, digital products, and links are displayed chronologically.
- **Inner Circle:** A monthly subscription tier granting access to locked content.
- **Credits / Wallet:** The internal currency used to pay for real-time per-minute Supercalls.
- **Creator Storefront:** The public profile (`/@username`) where fans book time and buy products.
- **Atomic Locks:** The backend mechanism preventing double-bookings.

### Layout Principles
- **Mobile-Optimized Constrained Widths:** Public storefronts are often centered with a max-width (e.g., `max-w-2xl mx-auto`) to look great on mobile and elegant on desktop.
- **Sticky Actions:** Call-to-actions (like "Book Now" or "Pay") often stick to the bottom of the viewport on mobile devices (`sticky bottom-4`).
- **Dashboard Navigation:** Sidebars (`w-64`) on desktop, bottom navigation or hamburger menus on mobile.
