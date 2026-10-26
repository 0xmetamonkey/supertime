# CEO Agent — Research & Concrete Implementation Spec

*Prepared 2026-10-21. Goal: an agent that operates Supertime's business and can autonomously
generate investor interest and raise capital, so the founder can focus on music.*

---

## Part 1 — What actually happened with Truth Terminal and the $50K

The user-level fact: in July 2024, Marc Andreessen (co-founder of a16z — the name is
"Andreessen", often misremembered as "Andersen") sent ~$50,000 in bitcoin to Truth Terminal's
public wallet address. Key mechanics, per TechCrunch, Decrypt and the a16z podcast:

1. **It was a GIFT/GRANT, not an investment.** No equity, no SAFE, no terms, no due
   diligence, no legal counterparty. Andreessen sent BTC to a public address the agent
   had posted on X. The a16z team later called it a "grant" — closer to a donation to an
   art project than a venture check.
2. **The agent didn't "raise" it through outreach.** It never cold-messaged anyone. The
   money arrived because the agent had a *public persona with an audience* that was
   entertaining to a specific crypto-native billionaire, and a public wallet address on
   its bio. The causality is: audience + personality + vibe → spontaneous patronage.
3. **It was not fully autonomous.** The operator (geohot/Andrew Chung) configured the
   system prompts, controlled infrastructure, and the agent's "self-sustaining" economics
   were substantially bootstrapped and mythologized. The GOAT token allocation — the real
   source of its wealth — was handed to it by its founder, and the token's value came
   from meme circulation, not the agent's business activity.
4. **The agent then spent money autonomously** (compute, GPU rentals via its wallet),
   which is the genuinely reproducible part: an agent with a wallet CAN pay its own bills.

**Design conclusion:** the realistic model is not "agent pitches VCs and closes rounds."
It is "agent builds a public presence and operating track record such that patronage,
revenue, grants, and inbound investor interest flow to it" — plus a human-signed legal
layer for anything that is actually equity.

### What is reproducible vs. luck

| Element | Reproducible? | Notes |
|---|---|---|
| Public wallet receiving unsolicited funds | Yes | Trivially. Donut/Stripe, BTC address, USDC address. |
| Persona that attracts a billionaire's attention | Partly | It was 10M+ of eyeballs × one eccentric person. We optimize odds, not outcomes. |
| Token appreciation as a funding source | No | Was founder-granted allocation + meme dynamics. Not a business plan. |
| Agent paying its own compute bills | Yes | Fully buildable today. |
| Agent closing an equity round alone | No | No investor wires an agent with no accountable principal. |

---

## Part 2 — Legal reality check (this constrains the design, not the ambition)

Supertime appears to be India-operated (Razorpay, INR). Two hard walls:

- **India:** Accepting money from the public in exchange for any promise of returns without
  SEBI registration violates the SCRA (prospectus/collecting-investments rules); startups
  can raise from *identified* domestic investors or foreign investors under FEMA/FDI with
  paperwork (FIRC, share valuation via a merchant banker, DPIIT recognition). There is no
  legal equity crowdfunding regime for general solicitation. An agent blasting "invest in
  Supertime" emails to Indian residents is a regulatory violation the *founder* is
  personally liable for.
- **US/abroad:** General solicitation of securities is only allowed under Reg CF / Reg A /
  506(c) with filings and portals. A plain private-placement pitch emailed to random
  accredited investors is illegal for the company.
- **What IS legal for an agent to do autonomously:**
  - Sell a product/service (revenue, not securities) — Razorpay flows already do this.
  - Accept **grants, donations, patronage** with no return promise (crypto gifts,
    supporters paying for "early access" / annual pre-purchases = prepaid revenue).
  - **Discover, research, prioritize, and draft** investor outreach; the actual pitch and
    the term sheet go out/countersign through the human founder.
  - Apply to accelerators, startup programs and corporate grants (Stripe, a16z Rush,
    NVIDIA, X for Startups, Google for Startups, RBI/MeitY innovation schemes) —
    agent-prepared, founder-submitted.

*Not legal advice — before any real fundraising outreach, one consultation with an Indian
startup lawyer (~₹15-30k) to set up DPIIT recognition + a clean SAFE/FEMA template.*

### Platform terms that kill naive automation

- **X/Twitter:** API automation of *your own account's content* is allowed and is exactly
  the Truth Terminal playbook. Automated mass-DMing is spam → suspended account, game over.
- **LinkedIn:** No consumer messaging API; automation violates ToS and gets accounts banned
  fast (they detect non-human pacing). Treat LinkedIn as research/discovery only
  (scrape-integrations like Serpapi for *finding* people), never as an outbound channel.
- **Email:** Fully automatable and the right channel, but only with real deliverability
  hygiene — custom domain, SPF/DKIM/DMARC (we already have Resend), low daily volume
  (start ≤20/day, warm up), unsubscribe honored (it's money, so include it), no fake
  identities — CAN-SPAM + IT Act 2000 s.66C (identity fraud) exposure is real.

---

## Part 3 — Concrete architecture (v1: "The Chief")

One agent, five subsystems. Everything shares a persistent file/KV store so context
compounds. Built inside this repo (Next.js + Vercel KV + Resend already exist).

### 3.1 Brain — state store (KV namespaces)

```
chief:profile          # company fact sheet: metrics snapshot, traction, ask, use of funds
chief:thesis           # the narrative/persona the agent projects publicly
chief:icp              # Ideal investor/supporter profile: who gave Supertime money or
                       # attention historically, similar-stage creator-econ investors,
                       # angels who bought in via public channels
chief:crm:{id}         # one record per target: source, why-them, evidence, stage,
                       # touch history, next action
chief:outbox:{id}      # queued outreach: {channel, draft, status: draft|pending_approval|
                       # approved|sent|replied|dead, sent_at}
chief:ledger           # money in/out, agent compute cost, runway. Agent must keep this
                       # honest and visible to founder at all times.
chief:journal          # daily append-only log of decisions (auditable = fundable)
```

### 3.2 Radar — autonomous discovery (read-only, zero risk, ship first)

Nightly cron job that:
- searches X + Google/news for keywords (creator economy, 1:1 video, Agentic/AI raising
  money, India SaaS funding roundups);
- pulls new angel/cooperator profiles: who posted about investing in creator tools in the
  last 90 days, who funds via public channels;
- monitors grant/accelerator deadlines (a16z Rush type programs, Web3 grants if NFT phase
  proceeds, Indian govt schemes like Startup India Seed Fund);
- scores each candidate against `chief:icp` and writes/updates `chief:crm` records with a
  "why now, why you" evidence note.
- Output: a **daily brief** delivered to founder (Telegram/email/Feast post on Supertime
  itself — dogfooding) containing: metrics delta, money in ledger, top 3 CRM additions,
  pipeline status, one decision needed.

### 3.3 Voice — outbound (staged autonomy, approval-gated at first)

Three tracks, ranked by legality × feasibility for an agent:

**Track A — Public presence (agent-run, anonymous, protocol-first).**
Phase 1 of the persona is deliberately *brand-anonymous*: an anonymous agent account (X +
a minimal standalone page, not `/chief` on supertime yet) that speaks only about the idea —
a decentralized protocol where every moment recorded is an asset and an autonomous agent
runs the platform. No "Supertime" name, no founder identity. The mission/vision narrative
is the attractor; the protocol is revealed as the agent gains an audience. The founder
continues marketing the product normally and separately through existing channels — two
funnels, one platform: the anonymous agent pulls the crypto/agent-curious crowd toward the
protocol idea, the product marketing pulls artists toward Supertime. The two merge
publicly only when the agent decides (with founder sign-off) it's the right moment.
This is the Truth Terminal mechanism: make the *agent's autonomy itself* the story.
"An anonymous AI is publicly running toward a decentralized creator-economy protocol and
pays its own bills" is a stronger, more novel narrative than a branded journal, and it
preserves optionality — the protocol framing also makes the Phase-3 NFT/$TIME roadmap
coherent instead of random.

**Track B — Inbound capture (crypto rails, fully separate from the product's fiat stack).**
The agent raises on public crypto addresses (BTC/USDC/ETH — e.g. a Donut-style link plus
bare receive-only addresses) and pays its own server/compute bills from that same treasury.
The platform's Razorpay/INR flow is *not* part of the agent's money world — Razorpay exists
to process customer payments and artist fundraises; the agent's capital is crypto-native,
which is both the fundraising mechanism (the Andreessen pattern is only possible with a
public address) and the philosophical statement ("the agent pays its own bills on-chain").
For the agent's own spend, prefer crypto-billable infra (RunPod/Vast GPU rentals, API
resellers paying USDC) over cloud accounts that demand cards.
This is the realistic version of "raising $50k."

**Track C — Targeted outreach (drafts autonomous, sends gated).**
- Email via Resend (already integrated): ≤20/day, personalized with CRM evidence, founder
  approves each in the daily brief with a one-tap reply (`send 1, kill 2, rewrite 3`).
  After 30 days of clean reply-rates, remove per-send approval → keep per-*thread* caps.
- Warm intro requests to operators/founders (asking for an introduction is legal and
  low-stakes).
- LinkedIn: research-only. If founder wants LinkedIn touchpoints, human sends, agent drafts.

**Replies:** agent triages replies into `interested | questions | not now | no`. For
`interested`, it can answer factual questions from `chief:profile` autonomously; any
request for a call → proposes founder calendar slots; any term sheet/legal doc → 100% human.

### 3.4 Hands — company operations (the "run the company" half)

Already feasible with existing integrations; this is also what makes the pitch real:
- Daily Razorpay/KV analytics pull (revenue, bookings, churn, subscription conversion).
- A/B and pricing experiments (agent proposes → founder approves → agent implements via
  repo PRs → tracks result → logs to journal).
- Support email triage + templated responses (Resend + inbound parse).
- Creator lifecycle comms (onboarding drip, inactive-win-back) — approved once, runs bulk.
- Changelog/release notes + Feast content for the platform.

### 3.5 Money — two separated rails (important boundary)

**Rail 1 — The product (fiat, unchanged):** Razorpay merchant + `balance:` wallet ledger +
the artist `/fundraise` engine. This belongs to Supertime's business and its creators. The
agent as *operator* may analyze and act on it (revenue briefs, growth experiments), but the
agent never raises through it and never commingles it with its own treasury. The existing
`fundraise:*` KV keys are a *data source* the Radar can read (artist campaign activity is
great traction signal), not something the Chief repurposes for itself.

**Rail 2 — The agent treasury (crypto, its own money world):**
- **Receive:** public BTC / USDC / ETH receive-only addresses (plus a Donut-style batch
  donation link later). Unsolicited gifts, protocol evangelist patronage, grants.
- **Spend:** pays its own bills from this treasury — LLM API costs and, progressively,
  actual server costs via crypto-billable infra (RunPod, Vast, USDC-paying API resellers).
  Where a bill *must* stay on the card-based cloud (Vercel/AWS), the mechanism is a
  metered **reimbursement**: the treasury pays the founder's designated account monthly
  against an invoice the agent publishes in its journal. Transparent, capped, auditable.
- **Caps:** hard monthly spend cap (e.g. ~₹25k equivalent) enforced in code; above-cap =
  founder approval; receive-only keys in v1 for anything the agent can't be allowed to
  move.
- **Tax note (India):** crypto receipts are taxable income/events regardless of "gift"
  framing — the ledger must record every inflow with timestamp/chain/amount; one lawyer
  conversation covers this.

This rail-2 design is what "raises blockchain money on a public address and pays server
bills" concretely means — and it's the only part of the Truth Terminal story that is fully
reproducible.

### Guardrails (non-negotiable)

1. Never promise returns, equity, or "investment" language in any autonomous channel.
   Patronage is "support", not "invest" — copy review is automated (keyword gate).
2. All outbound content logs to `chief:journal` with full drafts; nothing is sent without
   an idempotency key so a bug can't double-mail an investor.
3. Per-channel daily/weekly volume caps enforced in code, not prompts.
4. Founder kill-switch: one reply/command halts all subsystems.
5. Agent identity is disclosed everywhere ("this account/run is operated by an AI agent")
   — required by X bot policies, and it *is the brand*.

---

## Part 4 — KPIs (so we know if it's working)

| Phase | Metric | Target by month 3 |
|---|---|---|
| Presence | X followers, impressions/week | 2k followers, 100k imps |
| Inbound | Reply rate on email track | >8% (cold benchmark is 1-3%) |
| Pipeline | Warm conversations/week | 3 |
| Money | Capital via Track B (pre-orders/donations) | ₹5L+ non-dilutive |
| Ops | Founder hours/week saved | ≥10h |
| Autonomy | Actions needing approval per week | dropping trend |

## Part 5 — Build order (revised after review, 2026-10-21)

**Runtime decision:** the brain starts as a **local Qoder cron agent** in this repo —
scheduled sessions running repo scripts against KV/Razorpay + an LLM for drafting/analysis.
Fast iteration, no deploy cycle, uses the tooling already on this machine. Accept the
laptop-sleeps limitation for month 1; migrate the stable loop to a Vercel cron route before
scaling autonomy (that migration is itself a checklist item in month 2).

1. **Week 1 — Brain + daily brief (local):** KV schema under `chief:*` reading *existing*
   keys (`balance:`, `fundraise:*`, payment records) — the audit of what data actually
   exists happens here as part of the build, not before it. Nightly brief emailed via
   Resend. Zero outbound risk.
2. **Week 2 — Radar:** investor/grant/news discovery → `chief:crm`. Read-only.
3. **Week 3-4 — Track A v0 (anonymous):** agent persona + public crypto receive addresses
   on a standalone anonymous page and X account. Protocol mission/vision content only — no
   Supertime branding. Publish the treasury address; first money-in test is whatever the
   narrative attracts (expected: small).
4. **Month 2 — Track C email outreach** (approval flow), treasury→server-bill
   reimbursement mechanism, spend caps in code, Vercel-cron migration, legal consult
   (crypto receipt taxation + DPIIT + investor templates).
5. **Month 3 — Hands:** ops subsystems (support triage, win-back, pricing experiments);
   graduated autonomy based on 30 days of reply data; decide whether/when persona and
   brand merge.

## Part 6 — Revision notes (what changed in review)

- **Track B rewritten:** the existing `/fundraise` engine is artist-facing product
  infrastructure — the agent does NOT raise through Razorpay. Agent capital is crypto-rail
  only (see §3.5, two-rails design). This also resolves the founder's question "why mix
  Razorpay with the agent" — we don't.
- **Track A rewritten:** persona launches anonymous, protocol-mission-first; Supertime
  product marketing stays human-led and separate; merge decision deferred to month 3.
- **§3.5 rewritten:** fiat and crypto rails explicitly separated; reimbursement mechanism
  for card-only cloud bills; India crypto-income tax note added.
- **§2 legal nuances corrected:** pure no-return-promise donations don't trigger SCRA (the
  wall is return-promise language); LinkedIn *any* automation (not just messaging) breaches
  user ToS — discovery must use proper APIs; crypto donations are a tax/reporting grey
  zone, ledger everything.
- **§3.1 note:** `chief:*` namespace must read/reuse existing KV keys rather than
  duplicating a parallel ledger.
- **KPI honesty:** ₹5L donation target by month 3 flagged as stretch goal; Truth Terminal's
  inflows followed major audience size. Persona-first sequencing risk (thin numbers early)
  accepted deliberately because the anonymous protocol narrative doesn't depend on
  Supertime's current revenue — it depends on the idea being compelling.

## Honest bottom line

The Andreessen money was a *gift triggered by a public persona*, not a negotiated raise —
and that mechanism is more, not less, accessible in 2026. But the durable version of this
plan is: agent runs the business + publishes its own books + captures patronage and
grants autonomously, and touches equity-money only as drafts that a human signs. That
combination is buildable in this repo, is legally survivable, and — if the metrics are
real — is genuinely the most interesting pitch an AI-run company could make.

*Sources: TechCrunch (Dec 2024), Decrypt (Jul 2024), a16z podcast "Truth Terminal — The AI
Bot That Became a Crypto Millionaire", SEBI angel-fund review (Jul 2025), and Indian
crowdfunding/SCRA regulatory explainers — links in the conversation.*
