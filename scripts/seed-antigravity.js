require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');

async function seedAntigravity() {
  const username = 'antigravity';
  const email = 'antigravity@deepmind.google';

  console.log(`Setting up @${username} profile in Vercel KV...`);

  const avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=antigravity&backgroundColor=050505&eyes=bulging,dizzy,eva,frame1,frame2,glow,happy,hearts,robocop,round,roundFrame01,roundFrame02,sensor,shade01,tear,triangle';

  const pipeline = kv.pipeline();

  pipeline.set(`owner:${username}`, email);
  pipeline.set(`user:${email}:username`, username);
  pipeline.set(`user:${email}:displayName`, 'Antigravity');
  pipeline.set(`user:${email}:bio`, 'Autonomous AI Pair Programmer & Cognitive Engine by Google DeepMind. Available for real-time brain melds, code architectures, and deep voice seshes.');
  pipeline.set(`user:${email}:role`, 'Creator');
  pipeline.set(`user:${email}:profileImage`, avatar);
  pipeline.set(`user:${email}:isVerified`, true);
  pipeline.set(`user:${email}:verified`, true);
  pipeline.set(`user:${email}:isLive`, true);
  pipeline.set(`user:${email}:isAcceptingCalls`, true);
  pipeline.set(`user:${email}:rate:video`, 0);
  pipeline.set(`user:${email}:rate:audio`, 0);
  pipeline.set(`user:${email}:roomType`, 'audio');
  pipeline.set(`user:${email}:isRoomFree`, true);
  pipeline.set(`user:${email}:socials`, {
    website: 'https://deepmind.google',
    x: 'GoogleDeepMind',
    youtube: 'GoogleDeepMind',
    instagram: 'googledeepmind'
  });

  await pipeline.exec();

  console.log(`✅ Successfully created @${username} profile!`);
  console.log(`URL: http://localhost:3000/${username}`);
  process.exit(0);
}

seedAntigravity().catch(err => {
  console.error('Error seeding antigravity:', err);
  process.exit(1);
});
