# ⚡ Supertime

### The Direct Economy of Human Interaction

Supertime is a high-fidelity "Time Sharing" platform designed for artists, learners, and admirers to exchange value through real-time communication. We believe that human presence is the most valuable asset, and we've built the engine to monetize it directly, transparently, and beautifully.

#### 🚀 The Vision: Build in Public
We are transitioning to an open-source, profitable model. This repository is our stage. 
- **Direct Approach**: No middleman bloat. Just creators and their admirers.
- **Neo-Brutalist Aesthetic**: A UI that feels alive, intentional, and bold.
- **Pay-Per-Moment**: Integrated wallet systems using Razorpay/UPI for instant value transfer.

---

## 🛠️ Tech Stack

- **Core**: [Next.js](https://nextjs.org/) (App Router)
- **Communication Engine**: [Agora RTC](https://www.agora.io/) (High-fidelity audio/video)
- **Persistance**: [Vercel KV](https://vercel.com/storage/kv) (Redis-backed signaling & state)
- **Styling**: Vanilla CSS + Tailwind + Framer Motion (Neo-Brutalism)
- **Payments**: Razorpay / UPI Integration

---

## 🏗️ Getting Started

### 1. Requirements
- Node.js 18+
- Vercel KV Database
- Agora Dev Account (App ID & Certificate)

### 2. Environment Variables
Create a `.env.local` with:
```bash
# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate

# Vercel KV
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Auth & Payments
NEXTAUTH_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### 3. Installation
```bash
npm install
npm run dev
```

---

## 🎨 Design Philosophy
The Supertime UI follows a **Neo-Brutalist** design system:
- **High Contrast**: Solid black borders (4px-8px).
- **Vibrant Palette**: Neo-Pink, Neo-Yellow, Neo-Green.
- **Interaction**: Micro-animations and hover-state "depth" shifts.

---

## 🗺️ Roadmap
Check [ROADMAP_PROGRESS.md](ROADMAP_PROGRESS.md) for current engineering milestones.

---

*Built with energy for the creators of tomorrow.*
