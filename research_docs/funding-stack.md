# Funding stack — how the protocol actually pays its bills

*Written 2026-11-20. Goal: ~$10,000/month of operating money so building continues.
This is the plan behind the `/protocol` treasury page and `npm run treasury:update`.*

---

## 1. The honest math first

$10,000/month is **$120,000/year** — seed-round territory, not tip-jar territory.
Two different numbers are hiding inside that target:

- **Current burn** — the stack that exists today (Vercel, KV, Agora, Ably, Firebase,
  Resend, Sentry). Realistically a few hundred dollars a month. The meter defaults to
  **$300/month**; set the true number in `TREASURY_MONTHLY_BURN_USD`.
- **Target budget** — $10k/month, which is what lets you add GPU/compute, replace
  hardware, keep a backup machine, and pay for help. That is a *budget*, not a burn.
  The meter shows runway at both so the gap is visible instead of hand-waved.

What $10k/month can honestly buy:

| Line | Range / month |
|---|---|
| Existing SaaS + storage | $200–500 |
| Compute / GPU / VPS (crypto-payable where possible) | $500–2,000 |
| Hardware replacement fund (Mac, drives, backup) | $500–1,000 amortized |
| One part-time contractor (editor, support, ops) | $2,000–4,000 |
| Buffer + tax reserve | remainder |

A ₹1,000 Crore headline is a narrative. The **milestone ladder** on the page is the
conversion path: $1 deploys the contract, $300 is one month of today's stack, $1,000 is
storage and backup hardware, $3,000 is a working machine, $10,000 is one month at the
target budget. People fund the next rung, not the mountain.

---

## 2. The four channels, ranked by realism

### A. Patronage (direct, one-time) — live now

Direct BTC / ETH / USDC / SOL to the published addresses. No custodian, no promise of
return, no securities claim. This is the only channel that works with **zero legal
setup, zero audience, and zero gas**.

Constraint: at $10 average, $10k/month needs **1,000 people every month**. That is an
audience problem, not a payments problem. The page is the cash register; the X persona
is the storefront. Truth Terminal's $50k arrived after millions of eyeballs — the gift
was luck, the audience was the repeatable part.

### B. Recurring streams — available without any contract deployment

Superfluid (and similar streaming protocols) let a supporter open a **USDC stream on
Base** to the treasury address. No contract of ours to deploy, no gas beyond the
supporter's own. 100 supporters at $20/month = $2,000/month, which covers today's stack
several times over.

The `/protocol` page links to Superfluid and explains the Base address. Later, a native
"start a stream" flow (viem + wallet connect) can replace the outbound link.

### C. Patron pass (NFT membership) — deploy when the first dollars land

A small ERC-1155 on Base with three tiers (e.g. $25 / $100 / $1,000) and non-financial
perks: name in the ledger, early access, a seat in the stewards' room. It is **not** a
share, a yield, or a claim on revenue — that distinction is the whole legal ballgame.

Why wait: deploying needs gas, and the wallet is at $0. The manifesto already says the
first milestone is $1 to fund contract deployment. That is the correct order. When the
first inflow clears, deploy the pass, then use it as the recurring on-ramp.

### D. Grants and credits — the most underrated, and the fastest for infra

Non-dilutive, no audience required, and they directly cover the "storage and servers"
line. Credits are boring and they are real money. Program list (amounts vary by tier;
confirm current terms before applying):

| Program | What it typically gives | Fit |
|---|---|---|
| [Vercel for Startups](https://vercel.com/startups) | Up to ~$30k in credits | Hosting — direct |
| [Google for Startups Cloud](https://cloud.google.com/startup) | Up to ~$350k tiered; small bootstrap tier | Firebase/GCP/storage |
| [AWS Activate](https://aws.amazon.com/startups/) | Up to ~$100k in credits | Backup compute |
| [Microsoft for Startups Founders Hub](https://www.microsoft.com/en-us/startups) | Azure + OpenAI credits | Models, backup |
| [Cloudflare for Startups](https://www.cloudflare.com/forstartups/) | Credits / discounted plans | CDN, DNS, storage |
| [Sentry for Startups](https://sentry.io/for/startups/) | Error-tracking credits | Already using Sentry |
| [NVIDIA Inception](https://www.nvidia.com/en-us/startups/) | GPU discounts / credits | Inference, media |
| [Base Builder Grants](https://docs.base.org/get-started/base-ecosystem-fund) | Small rolling grants for onchain builders | Protocol work on Base |
| [Base Ecosystem Fund](https://docs.base.org/get-started/base-ecosystem-fund) | Larger ecosystem investment | Later, once traction is public |
| [Gitcoin](https://www.gitcoin.co/) | Community grants rounds | Open-source protocol work |
| [Optimism Retro Funding](https://optimism.io/) | Retroactive rewards for impact | Later — needs measured impact |
| Startup India Seed Fund / MeitY TIDE | Seed grants via incubators | High paperwork; needs DPIIT/entity |

The practical wedge: an agent drafts every application from one fact sheet
(what the product does, live metrics, use of funds, links), and the human submits and
signs. Grants require a legal entity and a bank account in most cases; crypto patronage
does not. Do both, but don't confuse them.

**Product revenue (Razorpay) is a separate rail.** Artist bookings, the 10% commission,
and artist fundraisers are Supertime's business money — not the protocol treasury. Never
commingle. Product revenue is the long-term answer to "day-to-day money"; the crypto
rail is the protocol's answer.

**A token is not an operating-budget tool.** India taxes VDA gains at 30% plus 1% TDS,
and selling a token with any expectation of profit invites securities analysis. A token
belongs to the ownership phase, after the contribution ledger and a legal wrapper. Do
not launch one to pay a $300 Vercel bill.

---

## 3. What is already built

- `app/lib/treasury.ts` — reads BTC, Base/Ethereum ETH, USDC on Base and Solana, and
  SOL from public RPCs; prices via CoinGecko; computes runway at current and target
  burn; returns recent inflows; degrades per asset instead of failing whole.
- `app/api/treasury` — cached live snapshot for the page.
- `app/protocol/ProtocolClient.tsx` — live total, asset ledger, runway at both burns,
  milestone ladder, latest inflow, recurring-stream link.
- `scripts/treasury-monitor.mts` + `npm run treasury:update` — cron entry point that
  writes `research_docs/chief/treasury.json` and a dated brief.
- The three vault addresses are already published on `/protocol` and in the manifesto.

Environment knobs:

```
TREASURY_MONTHLY_BURN_USD=300
TREASURY_TARGET_BUDGET_USD=10000
NEXT_PUBLIC_MONKEY_BTC_ADDRESS=…
NEXT_PUBLIC_MONKEY_EVM_ADDRESS=…
NEXT_PUBLIC_MONKEY_SOL_ADDRESS=…
```

---

## 4. The automation loop (what "raise onchain on automation" means concretely)

1. **Daily** — `treasury:update` snapshots balances and inflows, writes the brief. Any
   new inflow becomes a journal line: amount, chain, date, hash.
2. **On inflow** — the journal entry is the receipt; the public page updates within the
   cache window (2 minutes).
3. **Weekly** — the agent drafts the next X transmission from real numbers ("$23 in,
   11 days of compute funded, here is what it paid for"). No invented metrics.
4. **When runway < 14 days at the target budget** — the agent drafts a specific "need"
   post with the gap and the next milestone, for human approval.
5. **Grants** — a weekly pass over open programs; each draft is stored and submitted by
   the human.

The loop can run on a local Qoder cron today; move it to a Vercel cron route once the
page is deployed. The treasury read path has no secrets, so it is safe to run anywhere.

---

## 5. Sequence from here

1. Publish `/protocol` and the X thread; confirm the addresses against the journal.
2. Set the real burn numbers and run `treasury:update` daily.
3. Apply to the infra credit programs first — they cover servers/storage without
   needing an audience or a legal entity.
4. When the first $1–$100 lands: deploy the Belief/Patron pass on Base, enable the
   native stream flow, and start issuing the weekly receipt posts.
5. Only after there is a contribution ledger and a legal wrapper: revisit ownership
   and any tradeable instrument.

---

## 6. Guardrails (non-negotiable)

- Never promise returns, yield, equity, or "investment" in any copy — that is the SCRA
  line. Say "support", "patronage", "pre-order", "membership".
- Record every crypto inflow (timestamp, chain, amount, hash). In India, VDA receipts
  are taxable events; one CA conversation before the first meaningful inflow.
- Keep the treasury addresses immutable once published; announce any change in the
  journal before it takes effect.
- Receiving foreign crypto can raise FEMA/FDI questions for an Indian entity. Small
  unsolicited patronage is a different risk profile from a public raise; get advice
  before scaling either.
- The product's Razorpay money and the protocol treasury never touch.

*Not legal or tax advice.*
