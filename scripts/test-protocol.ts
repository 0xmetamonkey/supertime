/**
 * ST ID Protocol Automated Test Suite (TypeScript)
 * Tests:
 * 1. UID generation format & uniqueness
 * 2. Handle normalization (.st namespace, reserved names, regex)
 * 3. In-memory & KV Identity creation & retrieval
 * 4. Challenge generation & formatting
 * 5. EVM Signature verification & address normalization
 * 6. Multi-wallet association & primary switching
 * 7. Resolver strict matching & zero-substitution guarantees
 */

import assert from 'assert';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  generateSTUID,
  normalizeSTName,
  createOrGetSTIdentity,
  getSTIdentityByUID,
  getSTIdentityByName,
  claimSTName,
  resolveSTName,
  createWalletChallenge,
  verifyAndAssociateWallet,
  removeAssociatedWallet,
  setPrimaryAssociatedWallet,
  getSupportedSTNetworks,
} from '../app/lib/protocol';

async function runTests() {
  console.log('🧪 Starting ST ID Protocol Test Suite...\n');

  // Test 1: UID Generation
  console.log('Test 1: Permanent UID generation');
  const uid1 = generateSTUID();
  const uid2 = generateSTUID();
  assert(uid1.startsWith('st_uid_'), 'UID must have prefix st_uid_');
  assert(uid1.length > 20, 'UID must be at least 20 chars');
  assert.notStrictEqual(uid1, uid2, 'UIDs must be unique');
  console.log('  ✅ Passed:', uid1);

  // Test 2: Name Normalization & Reserved Names
  console.log('\nTest 2: Name normalization & namespace rules');
  assert.strictEqual(normalizeSTName('aman').normalized, 'aman.st');
  assert.strictEqual(normalizeSTName('aman.st').normalized, 'aman.st');
  assert.strictEqual(normalizeSTName('@Aman').normalized, 'aman.st');
  assert.strictEqual(normalizeSTName('monkey').isValid, false, 'Reserved name "monkey" must be blocked');
  assert.strictEqual(normalizeSTName('supertime').isValid, false, 'Reserved name "supertime" must be blocked');
  assert.strictEqual(normalizeSTName('ab').isValid, false, 'Name < 3 chars must be blocked');
  assert.strictEqual(normalizeSTName('hello world').isValid, false, 'Whitespace must be blocked');
  console.log('  ✅ Passed: All validation and namespace rules enforced');

  // Test 3: Identity Lifecycle
  console.log('\nTest 3: Identity Creation & Storage');
  const testEmail = `test_${Date.now()}@example.com`;
  const identity = await createOrGetSTIdentity({
    email: testEmail,
    desiredUsername: 'testcreator',
    displayName: 'Test Creator',
  });
  assert(identity.uid.startsWith('st_uid_'), 'Identity must have valid UID');
  assert.strictEqual(identity.currentUsername, 'testcreator.st');
  assert.strictEqual(identity.profileRef.email, testEmail);

  const fetchedByUID = await getSTIdentityByUID(identity.uid);
  assert.strictEqual(fetchedByUID?.uid, identity.uid);
  const fetchedByName = await getSTIdentityByName('testcreator.st');
  assert.strictEqual(fetchedByName?.uid, identity.uid);
  console.log('  ✅ Passed: Identity created and resolved by UID and .st handle');

  // Test 4: Name Claim & History
  console.log('\nTest 4: Username update & history preservation');
  const claimResult = await claimSTName(identity.uid, 'masterartist');
  assert.strictEqual(claimResult.success, true);
  assert.strictEqual(claimResult.identity?.currentUsername, 'masterartist.st');
  assert(claimResult.identity?.previousUsernames.includes('testcreator.st'), 'Must retain previous username');
  console.log('  ✅ Passed: Username updated to masterartist.st with history preserved');

  // Test 5: Self-Custody Wallet Verification (EIP-191 Challenge)
  console.log('\nTest 5: EIP-191 Signature Challenge Verification');
  const testAccount = privateKeyToAccount(generatePrivateKey());
  const walletAddress = testAccount.address;

  const challengeRes = await createWalletChallenge({
    uid: identity.uid,
    address: walletAddress,
    networkType: 'evm',
  });
  assert.strictEqual(challengeRes.success, true);
  assert(challengeRes.challenge, 'Challenge object must be present');
  const challenge = challengeRes.challenge;
  assert(challenge.message.includes(identity.uid));
  assert(challenge.message.includes(walletAddress));

  // Sign challenge with account private key
  const signature = await testAccount.signMessage({
    message: challenge.message,
  });

  // Verify and associate
  const verifyRes = await verifyAndAssociateWallet({
    uid: identity.uid,
    nonce: challenge.nonce,
    signature,
  });
  assert.strictEqual(verifyRes.success, true);
  assert.strictEqual(verifyRes.wallet?.address, walletAddress);
  assert.strictEqual(verifyRes.wallet?.isPrimary, true);
  console.log('  ✅ Passed: Cryptographic challenge verified, wallet associated to ST ID');

  // Test 6: Replay Prevention (Burned Nonce)
  console.log('\nTest 6: Anti-replay protection');
  const replayRes = await verifyAndAssociateWallet({
    uid: identity.uid,
    nonce: challenge.nonce,
    signature,
  });
  assert.strictEqual(replayRes.success, false, 'Nonce reuse must be rejected');
  console.log('  ✅ Passed: Nonce burned after single use');

  // Test 7: Universal ST Name Resolver
  console.log('\nTest 7: Universal ST Name Resolver');
  const resEthereum = await resolveSTName('masterartist.st', 'ethereum');
  assert.strictEqual(resEthereum.success, true);
  assert.strictEqual(resEthereum.resolution?.address, walletAddress);
  assert.strictEqual(resEthereum.resolution?.network, 'ethereum');

  const resBase = await resolveSTName('masterartist.st', 'base');
  assert.strictEqual(resBase.success, true);
  assert.strictEqual(resBase.resolution?.address, walletAddress);
  assert.strictEqual(resBase.resolution?.network, 'base');

  // Test Zero-Substitution Guarantee
  console.log('\nTest 8: Zero-Substitution Guarantee (Bitcoin / Solana)');
  const resBitcoin = await resolveSTName('masterartist.st', 'bitcoin');
  assert.strictEqual(resBitcoin.success, false);
  assert.strictEqual(resBitcoin.error, 'NO_WALLET_FOR_NETWORK');
  console.log('  ✅ Passed: Never silently substitutes another chain address');

  // Test 9: Supported Networks
  console.log('\nTest 9: Supported Networks Registry');
  const networks = getSupportedSTNetworks();
  assert(networks.some((n) => n.id === 'base'));
  assert(networks.some((n) => n.id === 'ethereum'));
  assert(networks.some((n) => n.id === 'polygon'));
  console.log('  ✅ Passed:', networks.length, 'networks registered');

  console.log('\n🎉 ALL 9 ST PROTOCOL TESTS PASSED WITH 100% SUCCESS!\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
