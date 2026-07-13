# CLAUDE.md — Supertime Engineering Briefing

> *Written for engineers joining this codebase. Read this before touching a single file.*

---

## What Is This?

Supertime is a **creator monetization platform** built on the belief that a person's time, attention, and presence are the most valuable commodities on the internet — and right now, platforms extract that value without giving it back to the creator.

We're building the infrastructure that flips that. Supertime lets any creator — a coach, a musician, a thinker, a founder — **monetize their existence directly**. No sponsorships, no ads, no algorithm begging. Just pure, direct exchange between a creator and the people who want access to them.

Think of it like this: Stripe gives developers a payment primitive. Supertime gives *creators* a presence primitive — a URL (`supertime.wtf/[username]`) that is equal parts live stage, booking system, vault, podcast studio, and direct line.

This is not a side project. This is a bet on a future where the creator economy has real infrastructure.

---

## The Stack

```
Framework     Next.js 16.1.4 (App Router, Turbopack)
Auth          Clerk  — middleware-enforced, session-aware
Database      Vercel KV (Upstash Redis)  — KV for everything: state, locks, ledgers
Video/Audio   Agora RTC SDK  — WebRTC for 1:1 calls & broadcasts
Realtime      Ably  — signaling, chat, collaborative features
Payments      Razorpay  — INR + global, webhook-verified
Storage       Firebase Admin  — blobs (audio, video recordings, profile images)
Email         Resend  — transactional receipts and creator notifications
Deployment    Vercel  — edge functions, KV, CDN, all in one
Monitoring    Sentry  — error tracking in production
```

There are no microservices. No Docker. No Kubernetes. This is a **monolith that ships fast** — one repo, one deploy command, one URL. That's a deliberate choice. We add complexity only when we earn it.

---

## Routing Map

```
/                      Landing page
/[username]            Creator's public profile — the "storefront"
/studio                Creator's Mission Control — the "cockpit"
/dashboard             Admin panel — analytics, settings, vault
/talktime/[roomId]     Shared TalkTime room — podcast + collaborative pad
/live/[roomId]         Generic broadcast/call room
/explore               Creator discovery feed
/wallet                Creator earnings & withdrawal
```

The `[username]` route is the product's beating heart. It's a **server-rendered public profile** that fetches live broadcast status, rates, and presence from KV on every request — meaning a creator going live shows up for visitors in real-time, no polling.

---

## Key Architectural Patterns

### Data Model (KV Key Convention)
Everything in Redis follows a strict key schema. **Do not deviate from this.**

```
user:[email]:isLive              boolean  — is creator broadcasting?
user:[email]:isAcceptingCalls    boolean  — available for 1:1?
user:[email]:rate:video          number   — credits per minute (video)
user:[email]:rate:audio          number   — credits per minute (audio)
user:[email]:artifacts           array    — saved session recordings
user:[email]:socials             json     — social links
user:[email]:username            string   — claimed username
owner:[username]                 string   — maps username → email
meeting:[roomId]                 json     — any room (call, talktime, instant)
```

Never store user data by Clerk `userId`. Always use **lowercase email** as the primary key. The `owner:[username]` → email mapping is how we resolve public profile requests server-side.

### Ably Channel Naming Convention
This matters. Getting it wrong causes signaling bugs that are almost impossible to debug.

```
user:[lowercase_email]           — 1:1 call signaling (incoming call pings)
room-[username]                  — public broadcast channel
broadcast:[channelName]          — broadcast chat & tips
talktime-pad:[roomId]            — TalkTime shared writing pad sync
call:[callerId]-[receiverId]-[ts] — 1:1 Agora call channel
```

### Agora UID Hashing
Agora UIDs must be integers. We hash string identifiers using a simple djb2-style hash in `CallStage.tsx`. If you're creating a new Agora-powered component, **use the same `hashUID()` function** — don't invent another approach.

---

## The Features (What We've Built)

### 1. The Creator Profile (`/[username]`)
A server-rendered page that is simultaneously: a public bio, a booking interface, a live broadcast viewer, and a storefront. When a creator is live, visitors see the stream inline. When they're available for calls, visitors can initiate a paid 1:1 session with one click.

### 2. SuperCalls (1:1 Paid Sessions)
The core revenue primitive. A visitor on a creator's profile initiates a call (audio or video). The creator gets an incoming ring (`IncomingCallRing.tsx`). They accept. An Agora channel spins up. Both sides get a `CallStage.tsx` — the premium HUD with mic/cam toggles, screen share, recording with consent, in-call chat, tipping, and a draggable PiP. Credits are deducted per-minute from the visitor's wallet and credited to the creator.

### 3. Live Broadcast
A creator hits "Go Live" in Studio. Their profile immediately shows the stream to all visitors via `BroadcastViewer.tsx` (Agora subscriber). The Studio hosts with `BroadcastHost.tsx`. Live chat runs over Ably.

### 4. TalkTime (`/talktime/[roomId]`)
The newest feature. A creator hits `/ TalkTime` anywhere in the Studio and gets an instant private room — think Joe Rogan inviting a guest, but spinnable in 2 seconds from a phone. The room is a split-panel experience: Agora audio/video on the left, a real-time **SharedOmniPad** on the right (text + media, synced over Ably with typing indicators). Guests join via a magic link, no account required.

### 5. The Studio HUD (`/studio`)
The creator's nerve center. Live/offline toggle, call availability toggle, TalkTime launcher, a Command Center modal with analytics charts, earnings, and a Highlights Vault of recorded sessions. The studio never loads stale broadcast state — it always starts in "offline" mode to prevent phantom sessions.

### 6. OmniPad
A rich-media capture pad that lives inside the Studio. Text, camera shots, file drops. Now has the `/ TalkTime` shortcut embedded in its toolbar.

### 7. Payments & Wallet
Razorpay handles checkout (booking pre-payments and digital product purchases). The platform takes a 10% commission. Creator withdrawals go through a UPI ID withdrawal request flow. All balances are tracked in KV ledgers, not in a traditional database.

---

## What To Know Before You Write Code

**1. The Studio is the only place that controls broadcast state.**
Never add a "Go Live" button anywhere except `/studio`. The broadcast standard is documented. Legacy paths that created random room IDs are deprecated and gone.

**2. KV is your database. Think in keys, not tables.**
There's no Postgres, no Prisma, no ORM. If you need to store something, design a KV key. If you're reading something per-request, it comes from KV in the server component. Keep key names consistent with the schema above.

**3. Client components use Ably. Server components use KV.**
The rendering boundary is clean: server fetches static/persistent state from KV, client subscribes to realtime events via Ably. Never import Ably in a server component. Never fetch KV in a client component (use API routes).

**4. The `[username]` route is high-traffic. Keep it fast.**
It runs on every profile visit, for every creator. No heavy computation here. KV reads are fast — keep it that way.

**5. Agora tokens come from `/api/agora/token`.**
Every Agora channel join — whether it's a call, a broadcast, or a TalkTime — fetches its token from this route. Don't hardcode tokens. Don't add a second token endpoint unless you have a very good reason.

**6. Middleware protects `/studio` and `/dashboard`.**
These routes require an active Clerk session. Everything else (including `/talktime/[roomId]`) is intentionally public — guests need to join without accounts.

---

## The Vision (Why This Matters)

Most creator tools are built by people who don't think creators are serious. They're built to be "easy" at the cost of being shallow. Supertime is built on the opposite assumption: **creators are the most serious operators on the internet**, and they deserve infrastructure that matches that.

The roadmap goes toward NFT minting of recorded sessions, DAO governance with `$TIME` tokens, and on-chain reputation. But right now, in this season, we're laser-focused on making the core loop — **show up, be available, get paid, own your recordings** — as tight and reliable as possible.

If you're reading this and you're joining: welcome. You're not working on a CRUD app. You're working on something that could genuinely change how people earn a living. Build accordingly.

---

## Running Locally

```bash
# Install
npm install

# Env setup (copy and fill in your keys)
cp .env.local.example .env.local

# Start dev server
npm run dev
# → http://localhost:3000
```

Required env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, `ABLY_API_KEY`, `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_APP_URL`.

For local dev without KV, most read paths degrade gracefully. The `/studio` page guards its KV calls behind `process.env.KV_URL`. TalkTime rooms work without KV in local dev — the client renders regardless and Agora/Ably still connect normally.

---

*Last updated by the founding engineer. If something here is wrong or outdated, fix the doc when you fix the code.*
