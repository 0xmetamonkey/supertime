/**
 * SUPERTIME LOCAL ADMIN TOOL
 * 
 * Usage:
 *   node admin.js                  -> Phase 1: Read-only report of all users and stats
 *   node admin.js verify <email>   -> Phase 2: Mark a user as verified
 *   node admin.js unverify <email> -> Phase 2: Unverify a user
 *   node admin.js disable <email>  -> Phase 2: Disable a user account
 *   node admin.js enable <email>   -> Phase 2: Re-enable a user account
 *   node admin.js give <email> <amount> -> Phase 2: Add tokens to user
 * 
 * Note: This script runs LOCALLY and connects to your Vercel KV instance via .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');
const readline = require('readline');

const args = process.argv.slice(2);
const command = args[0];
const targetEmail = args[1];
const targetAmount = args[2];

async function main() {
  if (!process.env.KV_URL) {
    console.error("❌ Error: KV_URL not found. Make sure .env.local exists and contains your Vercel KV credentials.");
    process.exit(1);
  }

  try {
    if (!command) {
      await runReadOnlyReport();
    } else {
      await runAdminAction(command, targetEmail, targetAmount);
    }
  } catch (error) {
    console.error("❌ An unexpected error occurred:", error);
  } finally {
    process.exit(0);
  }
}

// ==========================================
// PHASE 1: READ-ONLY REPORT
// ==========================================
async function runReadOnlyReport() {
  console.log('\n🔍 --- SUPERTIME ADMIN REPORT ---\n');

  const ownerKeys = await kv.keys('owner:*');
  const balanceKeys = await kv.keys('balance:*');
  
  const verifiedKeys = await kv.keys('user:*:verified');
  const disabledKeys = await kv.keys('user:*:disabled');

  const users = new Map();

  const getUser = (email) => {
    if (!users.has(email)) {
      users.set(email, {
        email: email,
        username: 'N/A',
        role: 'Caller', 
        balance: 0,
        isVerified: false,
        isDisabled: false
      });
    }
    return users.get(email);
  };

  for (const key of ownerKeys) {
    const email = await kv.get(key);
    const username = key.replace('owner:', '');
    if (email) {
      const u = getUser(email);
      u.username = username;
      u.role = 'Creator';
    }
  }

  for (const key of balanceKeys) {
    const email = key.replace('balance:', '');
    const balance = await kv.get(key);
    const u = getUser(email);
    u.balance = typeof balance === 'number' ? balance : 0;
  }

  for (const key of verifiedKeys) {
    const email = key.replace('user:', '').replace(':verified', '');
    const isVerified = await kv.get(key);
    if (isVerified) getUser(email).isVerified = true;
  }
  for (const key of disabledKeys) {
    const email = key.replace('user:', '').replace(':disabled', '');
    const isDisabled = await kv.get(key);
    if (isDisabled) getUser(email).isDisabled = true;
  }

  const userList = Array.from(users.values());
  
  if (userList.length === 0) {
    console.log("No users found in database.");
  } else {
    const pad = (str, len) => (str || '').toString().padEnd(len);
    
    console.log(`${pad('EMAIL', 35)} ${pad('USERNAME', 15)} ${pad('ROLE', 10)} ${pad('BAL', 8)} ${pad('STATUS', 15)}`);
    console.log("-".repeat(85));

    userList.forEach(u => {
      let status = [];
      if (u.isVerified) status.push('✅ Verified');
      if (u.isDisabled) status.push('⛔ DISABLED');
      if (status.length === 0) status.push('Active');

      console.log(
        `${pad(u.email, 35)} ` +
        `${pad(u.username, 15)} ` +
        `${pad(u.role, 10)} ` +
        `${pad(u.balance, 8)} ` +
        `${status.join(', ')}`
      );
    });
  }

  const totalUsers = userList.length;
  const totalCreators = userList.filter(u => u.role === 'Creator').length;
  const totalTokens = userList.reduce((sum, u) => sum + u.balance, 0);

  console.log('\n📊 --- PLATFORM STATS ---');
  console.log(`Total Users:        ${totalUsers}`);
  console.log(`Active Creators:    ${totalCreators}`);
  console.log(`Tokens Outstanding: ${totalTokens} TKN`);
  console.log('------------------------\n');
}

// ==========================================
// PHASE 2: ADMIN ACTIONS
// ==========================================
async function runAdminAction(action, email, amount) {
  const allowedActions = ['verify', 'unverify', 'disable', 'enable', 'give'];
  
  if (!allowedActions.includes(action)) {
    console.error(`❌ Unknown command: ${action}`);
    console.log(`Available commands: ${allowedActions.join(', ')}`);
    return;
  }

  if (!email) {
    console.error(`❌ Missing target email. Usage: node admin.js ${action} <email> [amount]`);
    return;
  }

  if (action === 'give') {
     console.log(`\nExecuting: Giving ${amount} TKN to ${email}...`);
     const amt = parseInt(amount);
     if (isNaN(amt)) {
         console.log('❌ Invalid amount');
         return;
     }
     const current = (await kv.get(`balance:${email}`)) || 0;
     await kv.set(`balance:${email}`, current + amt);
     console.log(`✅ Success! Added ${amt} TKN. New Balance: ${current + amt}`);
     return;
  }

  // Confirmation Prompt
  const confirm = await askQuestion(`⚠️  Are you sure you want to ${action.toUpperCase()} user '${email}'? (yes/no): `);
  if (confirm.toLowerCase() !== 'yes') {
    console.log("Action cancelled.");
    return;
  }

  try {
    switch (action) {
      case 'verify':
        await kv.set(`user:${email}:verified`, true);
        console.log(`✅ User ${email} is now VERIFIED.`);
        break;
      
      case 'unverify':
        await kv.del(`user:${email}:verified`);
        console.log(`✅ User ${email} is now UNVERIFIED.`);
        break;

      case 'disable':
        await kv.set(`user:${email}:disabled`, true);
        console.log(`⛔ User ${email} has been DISABLED.`);
        break;

      case 'enable':
        await kv.del(`user:${email}:disabled`);
        console.log(`✅ User ${email} has been RE-ENABLED.`);
        break;
    }
  } catch (err) {
    console.error("Failed to execute action:", err);
  }
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

main();
