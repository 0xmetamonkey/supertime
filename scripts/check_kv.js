
const { createClient } = require('@vercel/kv');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const email = 'extsystudios@gmail.com';
  const username1 = 'aman';
  const username2 = 'noposter';

  console.log('--- Checking email ---');
  console.log(`user:${email}:username =>`, await kv.get(`user:${email}:username`));
  console.log(`email:${email}:username =>`, await kv.get(`email:${email}:username`));

  console.log('--- Checking usernames ---');
  console.log(`owner:${username1} =>`, await kv.get(`owner:${username1}`));
  console.log(`owner:${username2} =>`, await kv.get(`owner:${username2}`));
}

check().catch(console.error);
