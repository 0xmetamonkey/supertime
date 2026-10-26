/**
 * Zero-Dependency Cryptographic Wallet Generator for Monkey (@0xmetamonkey)
 * Generates:
 * 1. Bitcoin (BTC) address & private key
 * 2. EVM (Base / Ethereum) address & private key
 * 3. Solana (SOL) address & private key
 *
 * Uses only native Node.js crypto engine. Zero external dependencies. Zero disk bloat.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Base58 encoder
function base58Encode(buffer) {
  let num = BigInt('0x' + buffer.toString('hex'));
  let str = '';
  while (num > 0n) {
    const rem = num % 58n;
    num = num / 58n;
    str = ALPHABET[Number(rem)] + str;
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    str = '1' + str;
  }
  return str;
}

// Base58Check encoder for Bitcoin
function base58Check(buffer) {
  const hash1 = crypto.createHash('sha256').update(buffer).digest();
  const hash2 = crypto.createHash('sha256').update(hash1).digest();
  const checksum = hash2.subarray(0, 4);
  const data = Buffer.concat([buffer, checksum]);
  return base58Encode(data);
}

// Pure JS Keccak-256 for EVM (Ethereum / Base)
function keccak256(msg) {
  const R = [
    [0, 36, 3, 41, 18],
    [1, 44, 10, 45, 2],
    [62, 6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39, 8, 14]
  ];
  const RC = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
    0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
    0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
    0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
    0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
  ];
  const state = Array.from({ length: 5 }, () => Array(5).fill(0n));
  const rate = 136; // 1088 bits / 8
  const buf = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
  const padLen = rate - (buf.length % rate);
  const padded = Buffer.alloc(buf.length + padLen);
  buf.copy(padded);
  padded[buf.length] = 0x01;
  padded[padded.length - 1] |= 0x80;

  for (let i = 0; i < padded.length; i += rate) {
    for (let j = 0; j < rate / 8; j++) {
      const x = j % 5;
      const y = Math.floor(j / 5);
      const val = padded.readBigUInt64LE(i + j * 8);
      state[x][y] ^= val;
    }
    for (let round = 0; round < 24; round++) {
      const C = Array(5).fill(0n);
      for (let x = 0; x < 5; x++) C[x] = state[x][0] ^ state[x][1] ^ state[x][2] ^ state[x][3] ^ state[x][4];
      const D = Array(5).fill(0n);
      for (let x = 0; x < 5; x++) {
        const left = C[(x + 4) % 5];
        const right = C[(x + 1) % 5];
        const rotRight = ((right << 1n) | (right >> 63n)) & 0xffffffffffffffffn;
        D[x] = left ^ rotRight;
      }
      for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) state[x][y] ^= D[x];

      const B = Array.from({ length: 5 }, () => Array(5).fill(0n));
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const r = BigInt(R[x][y]);
          const val = state[x][y];
          const rot = ((val << r) | (val >> (64n - r))) & 0xffffffffffffffffn;
          B[y][(2 * x + 3 * y) % 5] = rot;
        }
      }
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          state[x][y] = B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y]);
        }
      }
      state[0][0] ^= RC[round];
    }
  }

  const out = Buffer.alloc(32);
  for (let j = 0; j < 4; j++) {
    const x = j % 5;
    const y = Math.floor(j / 5);
    out.writeBigUInt64LE(state[x][y], j * 8);
  }
  return out;
}

function generateWallets() {
  console.log('⚡ Generating Sovereign Cryptographic Vaults for Monkey (@0xmetamonkey)...\n');

  // 1. Bitcoin (BTC)
  const btcEcdh = crypto.createECDH('secp256k1');
  btcEcdh.generateKeys();
  const btcPriv = btcEcdh.getPrivateKey('hex');
  const btcPubCompressed = btcEcdh.getPublicKey(null, 'compressed');
  const btcSha = crypto.createHash('sha256').update(btcPubCompressed).digest();
  const btcRmd = crypto.createHash('ripemd160').update(btcSha).digest();
  const btcAddress = base58Check(Buffer.concat([Buffer.from([0x00]), btcRmd]));

  // 2. EVM (Base / Ethereum / Polygon)
  const evmEcdh = crypto.createECDH('secp256k1');
  evmEcdh.generateKeys();
  const evmPriv = evmEcdh.getPrivateKey('hex');
  const evmPubUncompressed = evmEcdh.getPublicKey(); // 65 bytes: 0x04 + 64 bytes
  const evmPubRaw = evmPubUncompressed.subarray(1); // 64 bytes
  const evmHash = keccak256(evmPubRaw);
  const evmAddress = '0x' + evmHash.subarray(12).toString('hex');

  // 3. Solana (SOL)
  const solPair = crypto.generateKeyPairSync('ed25519');
  const solPrivDer = solPair.privateKey.export({ type: 'pkcs8', format: 'der' });
  // In PKCS#8 ed25519, the 32-byte seed is at the end:
  const solSeed = solPrivDer.subarray(solPrivDer.length - 32);
  const solPubDer = solPair.publicKey.export({ type: 'spki', format: 'der' });
  // In SPKI ed25519, the 32-byte public key is at the end:
  const solPub = solPubDer.subarray(solPubDer.length - 32);
  const solAddress = base58Encode(solPub);
  const solFullKey = Buffer.concat([solSeed, solPub]);
  const solPrivBase58 = base58Encode(solFullKey);

  const keys = {
    generatedAt: new Date().toISOString(),
    operator: '@0xmetamonkey',
    mission: 'Capitalize Human Creative Time (Goal: 1000 Crores)',
    addresses: {
      bitcoin: btcAddress,
      evm_base: evmAddress,
      solana: solAddress
    },
    secrets: {
      bitcoin_private_key_hex: btcPriv,
      evm_private_key_hex: '0x' + evmPriv,
      solana_private_key_base58: solPrivBase58
    }
  };

  // Write secret backup
  const secretPath = path.join(__dirname, '..', 'research_docs', 'monkey-keys.secret.json');
  fs.writeFileSync(secretPath, JSON.stringify(keys, null, 2), 'utf-8');

  // Update manifesto sequence with real addresses
  const manifestoPath = path.join(__dirname, '..', 'research_docs', 'monkey-manifesto-sequence.md');
  if (fs.existsSync(manifestoPath)) {
    let content = fs.readFileSync(manifestoPath, 'utf-8');
    content = content.replace('[INSERT_MONKEY_BTC_ADDRESS]', btcAddress);
    content = content.replace('[INSERT_MONKEY_EVM_ADDRESS]', evmAddress);
    content = content.replace('[INSERT_MONKEY_SOL_ADDRESS]', solAddress);
    fs.writeFileSync(manifestoPath, content, 'utf-8');
  }

  // Append public addresses to .env.local if not already present
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf-8');
    if (!envContent.includes('NEXT_PUBLIC_MONKEY_BTC_ADDRESS')) {
      envContent += `\n# Monkey Sovereign Treasury\nNEXT_PUBLIC_MONKEY_BTC_ADDRESS="${btcAddress}"\nNEXT_PUBLIC_MONKEY_EVM_ADDRESS="${evmAddress}"\nNEXT_PUBLIC_MONKEY_SOL_ADDRESS="${solAddress}"\n`;
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }
  }

  console.log('✅ Wallets successfully generated!\n');
  console.log('====================================================');
  console.log('🟠 BITCOIN (BTC):', btcAddress);
  console.log('🔵 BASE / ETH:   ', evmAddress);
  console.log('🟣 SOLANA (SOL): ', solAddress);
  console.log('====================================================\n');
  console.log('📁 Secret backup written to: research_docs/monkey-keys.secret.json (GITIGNORED)');
  console.log('📄 Manifesto sequence updated: research_docs/monkey-manifesto-sequence.md');
}

generateWallets();
