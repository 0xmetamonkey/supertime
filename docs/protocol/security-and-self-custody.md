# ST ID Protocol — Security & Self-Custody Architecture (v0.1)

---

## 1. The Core Threat Model

The ST ID Protocol enforces six immutable security invariants:

1. **No Private Key Ingestion:** Private keys are never accepted, processed, stored, or derived by any Supertime server or database.
2. **Cryptographic Proof of Control:** An address can only be associated with an ST Identity by presenting a valid cryptographic signature over a fresh, server-issued challenge nonce.
3. **Anti-Replay Protection:** Challenge nonces are cryptographically random (16 bytes), time-bounded (300 seconds), and immediately burned upon first verification.
4. **Permanent Identifier Independence:** The permanent UID (`st_uid_...`) is generated via cryptographically random entropy and has zero correlation with email, handle, or wallet addresses.
5. **Zero-Substitution Resolution:** The name resolver will fail with an explicit `NO_WALLET_FOR_NETWORK` error rather than substitute an address from another chain.
6. **No Smart Contract Custody:** The user's assets are held in their own external self-custody wallet (e.g. MetaMask, Hardware Wallet, Safe). Supertime smart contracts never hold custodial balances.

---

## 2. Challenge-Response Verification Flow

```
User (Browser + Wallet)                       Supertime ST Protocol
        |                                                |
        |--- 1. POST /api/st/wallet/challenge ---------->|
        |    { address, networkType: 'evm' }             |
        |                                                | (Generates 16-byte nonce)
        |                                                | (Saves st_challenge:{nonce} EX 300)
        |<-- 2. Returns Challenge Message + Nonce -------|
        |                                                |
        | (Prompts User Wallet: personal_sign)           |
        | (User inspects message on hardware/screen)     |
        |                                                |
        |--- 3. POST /api/st/wallet/verify ------------->|
        |    { nonce, signature }                        |
        |                                                | (Checks nonce validity & TTL)
        |                                                | (Recovers signer address via viem)
        |                                                | (Asserts signer === challenge.address)
        |                                                | (BURNS nonce immediately)
        |                                                | (Appends wallet to st_identity:{uid})
        |<-- 4. Returns Verified Associated Wallet ------|
```

---

## 3. Account Recovery & Key Rotation

Because ST ID separates identity from wallet custody:
* **If a user loses their private key:**
  * They authenticate via Clerk session $\to$ navigate to Settings $\to$ remove the compromised wallet $\to$ connect their new replacement self-custody wallet.
  * Their permanent ST UID, reputation, creative artifacts, and history remain 100% intact.
* **If a user loses access to their email/Clerk:**
  * Clerk account recovery policies apply.
  * Future phases will support on-chain cryptographic recovery where a secondary cold wallet can sign an identity recovery challenge.

---

## 4. Multi-Wallet Governance

* Users can bind multiple wallets to a single ST ID (e.g., hot wallet for mobile micro-tips + cold ledger for large commissions).
* One wallet is designated as `isPrimary: true`.
* The Resolver defaults to the primary wallet when resolving generic queries for an ecosystem.
