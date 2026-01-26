// Fix user mapping - run this after finding your user ID from the session
require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');

// Replace with your actual user ID (we'll get it from the session)
const USER_ID = process.argv[2];
const USERNAME = process.argv[3];

async function fixMapping() {
  if (!USER_ID || !USERNAME) {
    console.log('Usage: node fix-user.js <user-id> <username>');
    console.log('Example: node fix-user.js abc123 mani');
    return;
  }

  try {
    // Set the bidirectional mapping
    await kv.set(`owner:${USERNAME}`, USER_ID);
    await kv.set(`user:${USER_ID}:username`, USERNAME);
    
    console.log(`✅ Fixed! ${USERNAME} is now owned by ${USER_ID}`);
  } catch (e) {
    console.error('Error:', e);
  }
}

fixMapping();
