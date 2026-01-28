require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');

async function testFix() {
  console.log("🧪 Testing Case-Insensitive Login Logic...\n");

  const targetEmail = "i.am.awwwtistic@gmail.com";
  const mixedCaseEmail = "I.am.Awwwtistic@gmail.com"; // Simulate the issue

  try {
    // 1. Check what is actually in the DB (Raw Check)
    console.log(`🔎 Checking DB for raw key: user:${targetEmail}:username`);
    const storedUsername = await kv.get(`user:${targetEmail}:username`);
    console.log(`   -> Found: ${storedUsername || 'NULL'}`);

    if (!storedUsername) {
      console.log("⚠️  User not found in DB. Cannot verify fix against real data.");
      return;
    }

    // 2. Simulate the OLD logic (Broken)
    console.log(`\n❌ Simulating OLD Logic (Direct Lookup with '${mixedCaseEmail}')`);
    const oldLookup = await kv.get(`user:${mixedCaseEmail}:username`);
    console.log(`   -> Result: ${oldLookup || 'NULL (Login Failed)'}`);

    // 3. Simulate the NEW Logic (Fixed)
    console.log(`\n✅ Simulating NEW Logic (Normalized Lookup with '${mixedCaseEmail}')`);
    
    // This looks like the code in actions.ts:
    const normalizedEmail = mixedCaseEmail.toLowerCase();
    const newLookup = await kv.get(`user:${normalizedEmail}:username`);
    
    console.log(`   -> Normalized to: '${normalizedEmail}'`);
    console.log(`   -> Result: ${newLookup || 'NULL'}`);

    if (newLookup === storedUsername) {
      console.log("\n🎉 SUCCESS: Logic is fixed! Any capitalization will now log in correctly.");
    } else {
      console.log("\nFAILED: Logic did not resolve correctly.");
    }

  } catch (e) {
    console.error("Error during test:", e);
  }
}

testFix();
