// Quick KV check script
require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');

async function checkKV() {
  try {
    // Get all owner mappings
    const ownerKeys = await kv.keys('owner:*');
    console.log('\n=== USERNAMES CLAIMED ===');
    for (const key of ownerKeys) {
      const userId = await kv.get(key);
      const username = key.replace('owner:', '');
      console.log(`${username} -> ${userId}`);
    }

    // Get all user->username mappings  
    const userKeys = await kv.keys('user:*:username');
    console.log('\n=== USER ID -> USERNAME ===');
    for (const key of userKeys) {
      const username = await kv.get(key);
      const userId = key.replace('user:', '').replace(':username', '');
      console.log(`${userId} -> ${username}`);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkKV();
