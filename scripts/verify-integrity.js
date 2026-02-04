require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');

async function verify() {
  const emailLower = "i.am.awwwtistic@gmail.com";
  // Common variations to check
  const emailsToCheck = [
    "I.am.Awwwtistic@gmail.com",
    "I.Am.Awwwtistic@gmail.com",
    "i.am.Awwwtistic@gmail.com"
  ];

  console.log("🔍 Checking integrity for:", emailLower);

  // 1. Check User Mapping
  const uLower = await kv.get(`user:${emailLower}:username`);
  console.log(`User (Lower - ${emailLower}): ${uLower}`);

  // 2. Check Balance Lower
  const bLower = await kv.get(`balance:${emailLower}`);
  console.log(`Balance (Lower - ${emailLower}): ${bLower}`);

  // 3. Check Variations
  for (const mixed of emailsToCheck) {
    const uMixed = await kv.get(`user:${mixed}:username`);
    const bMixed = await kv.get(`balance:${mixed}`);
    
    if (uMixed || bMixed) {
        console.log(`\n⚠️  FOUND DATA AT MIXED CASE: ${mixed}`);
        console.log(`   User: ${uMixed}`);
        console.log(`   Balance: ${bMixed}`);
    }
  }

  console.log("\n✅ Check Complete.");
}

verify();
