# SuperTime Roadmap Execution Tracking

## Phase 1: Persistent Studio "Live" Status [DONE]
- [x] Update API to handle `isLive` state saving.
- [x] Update Studio Server component to fetch `isLive` state.
- [x] Update Studio Client to sync `isLive` state and handle persistence.
- [x] Reflect "Live" status on the Public Creator Profile.

## Phase 2: Custom Call Templates [DONE]
- [x] Design data structure for templates (duration, expectation, price).
- [x] Add template management UI to Studio Settings.
- [x] Store templates in KV database.
- [x] Display templates as booking options on the Public Profile.

## Phase 3: Call Scheduler [DONE]
- [x] Implement availability slots (weekly schedule management).
- [x] Create booking flow for visitors to pick a time.
- [x] Add "Booked Sessions" view to Studio.
- [x] Handle booking storage and retrieval.

## Phase 4: UI/UX Polish [DONE]
- [x] Enhance "Slick" theme with more dynamic animations and gradients.
- [x] Improve mobile responsiveness and visual hierarchy.
- [x] Refine call stage interactions and billing visualizers.
- [x] Standardize Brutalist theme with high-contrast elements.

## Phase 5: Call Recording & Artifacts [DONE]
- [x] Implement `MediaRecorder` logic in `CallStage`.
- [x] Add recording UI (⏺️ REC button) to the call controls.
- [x] Auto-upload recordings to `@vercel/blob` on stop.
- [x] Save recording URLs as "Artifacts" to creator KV data.
- [x] Display "Artifact Library" on the public profile.

## Phase 6: Recording Consent [DONE]
- [x] Implement Agora Stream Messaging for in-call signaling.
- [x] Add recording request logic (REQ_REC).
- [x] Implement consent overlay for the other party.
- [x] Create consent response logic (RES_REC_OK / RES_REC_NO).
- [x] Ensure recording only starts after explicit consent is granted.

## Phase 7: Live Analytics & Performance [IN PROGRESS]
- [x] Implement visitor tracking for Creator Profiles.
- [x] Add "Session History" data visualization (Earnings over time).
- [ ] Optimize Agora connection speeds and retry logic.
- [ ] Implement SEO metadata for social sharing.

## 🛠️ The Refinement Backlog (Design Debt)
*These are ongoing UI/UX tasks that aren't blockers but need a "Polish Sprint" later.*
- [ ] **Theme Variable Audit**: Standardize all `--neo-shadow` and `--neo-border` colors to react automatically to `.dark`.
- [ ] **Design Theory Sync**: Align spacing (8pt grid) across all components.
- [ ] **The "Perfect" Toggle**: Refine the 150ms transition curves for dark mode to prevent "layout flickering".
- [ ] **Mobile Touch Targets**: Audit all neo-buttons for tap-usability on small screens.
