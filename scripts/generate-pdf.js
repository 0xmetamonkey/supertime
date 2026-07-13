const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Supertime Onboarding Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-size: 14px;
    }

    .page {
      padding: 40px;
      page-break-after: always;
      position: relative;
      box-sizing: border-box;
      height: 297mm; /* Standard A4 height */
      width: 210mm;  /* Standard A4 width */
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Header styling */
    .header {
      border-bottom: 2px solid #000000;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -1px;
      text-transform: uppercase;
    }

    .doc-type {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #666;
    }

    /* Typography */
    h1 {
      font-size: 36px;
      font-weight: 800;
      margin-top: 60px;
      margin-bottom: 10px;
      letter-spacing: -1.5px;
      line-height: 1.1;
    }

    .subtitle {
      font-size: 18px;
      color: #666;
      font-weight: 400;
      margin-bottom: 40px;
    }

    h2 {
      font-size: 20px;
      font-weight: 700;
      margin-top: 30px;
      margin-bottom: 15px;
      letter-spacing: -0.5px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 8px;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 8px;
    }

    p {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333333;
    }

    /* Highlights & callouts */
    .hero-box {
      background-color: #f9f9f9;
      border-left: 4px solid #000000;
      padding: 24px;
      margin-bottom: 30px;
      border-radius: 4px;
    }

    .hero-box p:last-child {
      margin-bottom: 0;
    }

    .accent-text {
      font-weight: 600;
      color: #000;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      font-size: 13px;
    }

    th {
      background-color: #f0f0f0;
      color: #1a1a1a;
      text-align: left;
      font-weight: 700;
      padding: 12px;
      border: 1px solid #e5e5e5;
    }

    td {
      padding: 12px;
      border: 1px solid #e5e5e5;
      color: #333;
    }

    tr:nth-child(even) td {
      background-color: #fafafa;
    }

    /* Bullet points */
    ul {
      margin-top: 0;
      margin-bottom: 20px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 8px;
      color: #333;
    }

    .footer {
      position: absolute;
      bottom: 40px;
      left: 40px;
      right: 40px;
      border-top: 1px solid #e5e5e5;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #999;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: INTRODUCTION & CORE SERVICES -->
  <div class="page">
    <div class="header">
      <div class="logo">⚡ SUPERTIME</div>
      <div class="doc-type">Onboarding & Operations Brief</div>
    </div>

    <h1>Welcome to Supertime</h1>
    <div class="subtitle">A Business and Platform Overview for New Team Members</div>

    <div class="hero-box">
      <p class="accent-text">Supertime is a creator monetization platform built on a simple premise: a person's time, attention, and presence are the most valuable commodities on the internet.</p>
      <p style="margin-top: 10px;">Traditional social networks extract billions in advertising value from creators while offering very little in return. Supertime flips this model by providing a direct exchange of value between a creator and their audience without any middle-man algorithms.</p>
    </div>

    <h2>Our Core Philosophy</h2>
    <p>We build tools that treat creators like serious business operators. Our goal is to give every creator their own direct monetization engine via a clean, personal URL (e.g., <code>supertime.wtf/username</code>). From this single node, creators can host live shows, sell digital goods, book paid video calls, and manage recurring subscriptions.</p>

    <h2>The Core Platform Features</h2>
    <ul>
      <li><strong>SuperCalls (1:1 Paid Calls):</strong> Fans can book 1:1 voice or video sessions directly on a creator's calendar. Billing is calculated on a per-minute basis, allowing creators to monetize high-intent conversations directly.</li>
      <li><strong>Live Broadcasts (Streaming):</strong> Creators can instantly go live to their public profile feed. Viewers watch the stream in real-time, interact via live chat, and send tips/donations.</li>
      <li><strong>TalkTime (Instant Podcasts):</strong> A split-screen media room combining Agora audio/video with a real-time collaborative writing pad. Creators can host guests instantly without requiring them to register an account.</li>
      <li><strong>Inner Circle Subscriptions:</strong> A recurring month-to-month access pass that lets fans support creators and unlock private editorial content (the "Feast" feed).</li>
    </ul>

    <div class="footer">
      <span>Supertime Operations Briefing</span>
      <span>Page 1 of 3</span>
    </div>
  </div>

  <!-- PAGE 2: BUSINESS MODEL & NUMBERS -->
  <div class="page">
    <div class="header">
      <div class="logo">⚡ SUPERTIME</div>
      <div class="doc-type">Business & Financial Model</div>
    </div>

    <h2>How the Economics Work</h2>
    <p>Supertime operates on a simple, transparent fee structure. We align our success with the creators' success: we only make money when they make money.</p>

    <div class="hero-box" style="border-left-color: #008080;">
      <p class="accent-text" style="color: #008080;">The Split: 90% / 10%</p>
      <p style="margin-top: 8px;">The creator keeps <strong>90%</strong> of all revenue generated on the platform. Supertime takes a flat <strong>10%</strong> platform commission. This commission is automatically calculated and deducted before funds hit the creator's ledger.</p>
    </div>

    <h2>Financial Flow and Revenue Primitives</h2>
    <table>
      <thead>
        <tr>
          <th>Revenue Channel</th>
          <th>Pricing Mechanism</th>
          <th>Creator Share (90%)</th>
          <th>Platform Commission (10%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1:1 Video SuperCall</strong></td>
          <td>Default ₹100 per minute</td>
          <td>₹90 / minute</td>
          <td>₹10 / minute</td>
        </tr>
        <tr>
          <td><strong>1:1 Audio SuperCall</strong></td>
          <td>Default ₹50 per minute</td>
          <td>₹45 / minute</td>
          <td>₹5 / minute</td>
        </tr>
        <tr>
          <td><strong>Direct Tips / Support</strong></td>
          <td>Custom fan amount</td>
          <td>90% of tip amount</td>
          <td>10% of tip amount</td>
        </tr>
        <tr>
          <td><strong>Digital Products</strong></td>
          <td>Set by creator (e.g. templates)</td>
          <td>90% of listing price</td>
          <td>10% of listing price</td>
        </tr>
        <tr>
          <td><strong>Inner Circle Subscriptions</strong></td>
          <td>Monthly recurring (e.g. ₹500/mo)</td>
          <td>₹450 / month</td>
          <td>₹50 / month</td>
        </tr>
      </tbody>
    </table>

    <h3>Payment Processing & Ledger System</h3>
    <ul>
      <li><strong>Razorpay:</strong> Handles all incoming checkouts. It securely captures credit card, debit card, and UPI transactions.</li>
      <li><strong>Creator Wallet:</strong> When a user pays, our ledger system (stored securely in Redis) instantly splits the funds. The creator's withdrawable balance goes up by 90%, and the platform's commission goes to the company treasury.</li>
      <li><strong>UPI Withdrawals:</strong> Creators can click "Withdraw" in their dashboard. They enter their UPI ID (e.g., <code>name@okaxis</code>) to request a payout, which operations verifies and fulfills directly.</li>
    </ul>

    <div class="footer">
      <span>Supertime Operations Briefing</span>
      <span>Page 2 of 3</span>
    </div>
  </div>

  <!-- PAGE 3: RESEARCH & STRATEGIC PLAYBOOK -->
  <div class="page">
    <div class="header">
      <div class="logo">⚡ SUPERTIME</div>
      <div class="doc-type">Strategic Research Playbook</div>
    </div>

    <h2>Research & Operations Action Plan</h2>
    <p>As our research and numbers lead, your goal is to help us identify growth corridors, map creator economics, and optimize our pricing systems.</p>

    <h3>1. Competitor Monetization Audit</h3>
    <p>Perform research on our primary competitors. We need you to build a numbers sheet comparing our pricing structure against other platforms. Specifically, research the transaction and payout fees for:</p>
    <ul>
      <li><strong>Patreon:</strong> Base platform fees (5% to 12%) + payment processing fees (~2.9% + $0.30) + payout transfer costs.</li>
      <li><strong>OnlyFans:</strong> Flat 20% platform fee.</li>
      <li><strong>Buy Me A Coffee:</strong> Flat 5% platform fee + transaction gateway fees.</li>
      <li><strong>Gumroad:</strong> Flat 10% platform fee + credit card processing fees.</li>
    </ul>

    <h3>2. Creator Yield Model (Numbers Projections)</h3>
    <p>Help us model the "Supertime Yield" for prospective creators. Draft calculations demonstrating how much an active creator with a specific audience size (e.g., 50k Instagram followers or 10k Twitter followers) can expect to earn compared to standard platform ad splits (like YouTube's AdSense or TikTok's Creator Fund).</p>
    
    <div class="hero-box" style="border-left-color: #3b82f6; background-color: #f5f9ff;">
      <p class="accent-text" style="color: #1d4ed8;">Operational Research Exercise:</p>
      <p style="margin-top: 8px; font-size: 13px;">If a creator with 10,000 active followers has a <strong>1% conversion rate</strong> (100 core fans):</p>
      <ul style="margin-top: 6px; margin-bottom: 0; font-size: 13px;">
        <li>20 fans book a 15-minute Video Call (₹1,500 each) = ₹30,000</li>
        <li>30 fans subscribe to the Inner Circle (₹400/month) = ₹12,000/month</li>
        <li>10 fans buy a digital template (₹1,000 each) = ₹10,000</li>
        <li><strong>Total Monthly Earnings: ₹52,000 (Creator net: ₹46,800 | Supertime commission: ₹5,200)</strong></li>
      </ul>
    </div>

    <h3>3. India UPI & Payment Corridor Review</h3>
    <p>Research the operational overhead of instant bank payouts via Razorpay Route or UPI API automation in India. Identify any compliance thresholds (e.g., daily transaction limits, KYC requirements for individual vs. business accounts) to keep our withdrawal mechanisms scalable.</p>

    <div class="footer">
      <span>Supertime Operations Briefing</span>
      <span>Page 3 of 3</span>
    </div>
  </div>

</body>
</html>
`;

(async () => {
  const htmlPath = path.resolve('public/onboarding.html');
  const pdfPath = path.resolve('Supertime_Onboarding_Brief.pdf');

  console.log('Writing onboarding.html...');
  fs.writeFileSync(htmlPath, htmlContent);

  console.log('Launching browser to print PDF...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
  await page.waitForLoadState('networkidle');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  await browser.close();
  console.log('PDF successfully generated at:', pdfPath);
})();
