
const { createClient } = require('@vercel/kv');
require('dotenv').config({ path: '.env.local' });

async function fix() {
  const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const email = 'extsystudios@gmail.com';
  const targetUsername = 'aman';
  
  console.log(`Setting user:${email}:username to ${targetUsername}...`);
  await kv.set(`user:${email}:username`, targetUsername);
  
  console.log(`Ensuring owner:${targetUsername} is ${email}...`);
  await kv.set(`owner:${targetUsername}`, email);

  // We leave owner:noposter as is, it's just a dead mapping now or they can keep it as a backup
  
  console.log('Fix complete.');
}

fix().catch(console.error);
