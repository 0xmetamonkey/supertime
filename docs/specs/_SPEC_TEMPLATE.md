# [Phase X]: [Phase Name] — Specification

> **Status:** `DRAFT` | `IN REVIEW` | `APPROVED` | `IN PROGRESS` | `DONE`
> **Owner:** [Name]
> **Last Updated:** YYYY-MM-DD
> **Linked Checklist Items:** [launch_checklist.md Phase X](../launch_checklist.md)

---

## 1. Overview

### Problem Statement
> *What problem does this solve? For whom? Why does it matter?*

### Definition of Done
> *When is this phase truly complete? What would a non-technical person observe that would tell them this is done?*

- [ ] ...
- [ ] ...

---

## 2. User Stories

> Format: `As a [role], I want [goal], so that [benefit].`
> Priority: `P0` = launch blocker · `P1` = important · `P2` = nice to have

| ID | Story | Priority | Acceptance Criteria ID |
|----|-------|----------|------------------------|
| US-X-01 | As a **[role]**, I want to [goal], so that [benefit]. | P0 | AC-X-01 |
| US-X-02 | As a **[role]**, I want to [goal], so that [benefit]. | P1 | AC-X-02 |

---

## 3. Design Spec

### 3.1 Layout & Grid

| Property | Value |
|---|---|
| Max-width | `1200px` (desktop), `100%` (mobile) |
| Column grid | 12-col (desktop), 4-col (mobile) |
| Spacing unit | `8px` base |
| Breakpoints | `sm: 640px` · `md: 768px` · `lg: 1024px` · `xl: 1280px` |

### 3.2 Design Tokens Used

> Reference `app/globals.css` for canonical values.

| Token | Usage in this phase |
|---|---|
| `--background` | Page background |
| `--card` | Card/panel backgrounds |
| `--primary` | CTA buttons, links |
| `--muted-foreground` | Placeholder text, secondary labels |
| `--radius` | All rounded corners |
| `--glass-bg` | Glassmorphic surface backgrounds |
| `--glass-border` | Glassmorphic surface borders |

### 3.3 Component State Matrix

> Every interactive component must have all these states designed and tested.

| Component | Default | Hover | Loading | Error | Empty | Disabled |
|---|---|---|---|---|---|---|
| [Component A] | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [Component B] | ✓ | ✓ | — | ✓ | ✓ | — |

### 3.4 Wireframes

> Mid-fidelity wireframes. These define layout and component hierarchy — not exact visual polish.

#### Screen: [Screen Name]
![Wireframe: [Screen Name]](./wireframes/phaseX-[screen-name].png)

**Key layout rules:**
- [Rule 1]
- [Rule 2]

### 3.5 Motion & Animation

| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Page enter | Fade in + slide up | `300ms` | `ease-out` |
| Card hover | Scale `1.01` + shadow lift | `150ms` | `ease-in-out` |
| Button press | Scale `0.97` | `80ms` | `ease-in` |
| Loading state | Skeleton shimmer | `1200ms` | `linear` loop |

---

## 4. API Contract

### 4.1 Endpoints

#### `[METHOD] /api/[route]`

- **Auth required:** Yes / No (Clerk `userId`)
- **Description:** [What this endpoint does]

**Request body:**
```typescript
{
  field: string;     // Description
  field2: number;    // Description
}
```

**Response — 200 OK:**
```typescript
{
  success: true;
  data: {
    field: string;
  };
}
```

**Response — 4xx Errors:**
```typescript
// 400 — Bad Request
{ success: false; error: "INVALID_PAYLOAD"; }

// 401 — Unauthorized
{ success: false; error: "UNAUTHORIZED"; }

// 404 — Not Found
{ success: false; error: "NOT_FOUND"; }
```

**KV keys read/written:**
```
user:[email]:[key]  →  [Description of value]
```

---

## 5. Acceptance Criteria

> Format: Given [context] / When [action] / Then [observable result]
> Tests live in `tests/phaseX-[name].spec.ts`

| ID | Given | When | Then | Test ID |
|----|-------|------|------|---------|
| AC-X-01 | User is logged in as a creator | They navigate to `/[username]` | The storefront renders within 2s | `storefront-renders` |
| AC-X-02 | A product exists in the store | A visitor clicks "Buy" | The Razorpay modal opens | `buy-opens-modal` |

### Edge Cases & Error Handling

| Scenario | Expected Behavior |
|---|---|
| [Edge case 1] | [What should happen] |
| Network timeout on checkout | Show toast "Payment failed — please retry" |

---

## 6. Open Questions

> Track anything still undecided here. Do NOT start building until P0 questions are resolved.

| ID | Question | Priority | Owner | Status |
|----|----------|----------|-------|--------|
| Q-X-01 | [Question] | P0 | [Name] | Open |

---

## 7. Out of Scope

> Explicitly document what this phase does NOT include, to prevent scope creep.

- [Feature that sounds related but is deferred]
- [Integration that will be addressed in a later phase]
