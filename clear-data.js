// Clear all user data and start fresh
require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');

async function clearAll() {
  try {
    // Clear owner mappings
    const ownerKeys = await kv.keys('owner:*');
    for (const key of ownerKeys) {
      await kv.del(key);
      console.log(`Deleted: ${key}`);
    }

    // Clear user mappings
    const userKeys = await kv.keys('user:*');
    for (const key of userKeys) {
      await kv.del(key);
      console.log(`Deleted: ${key}`);
    }

    // Clear email mappings (if any)
    const emailKeys = await kv.keys('email:*');
    for (const key of emailKeys) {
      await kv.del(key);
      console.log(`Deleted: ${key}`);
    }

    console.log('\n✅ All user data cleared! Fresh start.');
  } catch (e) {
    console.error('Error:', e);
  }
}

clearAll();
