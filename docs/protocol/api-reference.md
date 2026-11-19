# ST ID Protocol — API Reference (v0.1)

All endpoints reside under `/api/st/`.

---

## 1. Identity Endpoints

### 1.1 Get Current User Identity
* **Endpoint:** `GET /api/st/identity/me`
* **Auth Required:** Yes (Clerk Session)
* **Response (200):**
  ```json
  {
    "success": true,
    "identity": {
      "uid": "st_uid_6abf854a77232b0f688409d0",
      "currentUsername": "aman.st",
      "previousUsernames": [],
      "createdAt": 1732075200000,
      "updatedAt": 1732075200000,
      "status": "active",
      "profileRef": {
        "email": "aman@example.com",
        "displayName": "Aman"
      },
      "publicKeys": [],
      "wallets": []
    }
  }
  ```

---

### 1.2 Public Identity Lookup
* **Endpoint:** `GET /api/st/identity/:id_or_name`
* **Auth Required:** No
* **Params:** `id_or_name` can be a permanent UID (`st_uid_...`) or `.st` handle (`aman.st` or `aman`).
* **Response (200):**
  ```json
  {
    "success": true,
    "identity": {
      "uid": "st_uid_6abf854a77232b0f688409d0",
      "currentUsername": "aman.st",
      "previousUsernames": [],
      "createdAt": 1732075200000,
      "status": "active",
      "wallets": [
        {
          "id": "w_evm_0x741cd4dabfc802db4167b4fc272e12b0a0181f12",
          "networkType": "evm",
          "address": "0x741Cd4DabFc802Db4167B4fc272E12b0a0181F12",
          "supportedChains": ["ethereum", "base", "polygon", "arbitrum", "optimism"],
          "isPrimary": true,
          "verifiedAt": 1732075250000
        }
      ]
    }
  }
  ```

---

### 1.3 Claim / Update Username
* **Endpoint:** `POST /api/st/name/claim`
* **Auth Required:** Yes
* **Payload:**
  ```json
  {
    "username": "aman"
  }
  ```
* **Response (200):**
  ```json
  {
    "success": true,
    "identity": { ... }
  }
  ```

---

## 2. Self-Custody Wallet Endpoints

### 2.1 Request Verification Challenge
* **Endpoint:** `POST /api/st/wallet/challenge`
* **Auth Required:** Yes
* **Payload:**
  ```json
  {
    "address": "0x741cd4dabfc802db4167b4fc272e12b0a0181f12",
    "networkType": "evm"
  }
  ```
* **Response (200):**
  ```json
  {
    "success": true,
    "challenge": {
      "nonce": "a8f419c83b2e7d10",
      "uid": "st_uid_6abf854a...",
      "address": "0x741Cd4DabFc802Db4167B4fc272E12b0a0181F12",
      "networkType": "evm",
      "message": "supertime.wtf wants you to sign in with your Ethereum account:...",
      "issuedAt": 1732075200000,
      "expiresAt": 1732075500000
    }
  }
  ```

---

### 2.2 Submit Signature & Verify
* **Endpoint:** `POST /api/st/wallet/verify`
* **Auth Required:** Yes
* **Payload:**
  ```json
  {
    "nonce": "a8f419c83b2e7d10",
    "signature": "0x..."
  }
  ```
* **Response (200):**
  ```json
  {
    "success": true,
    "wallet": {
      "id": "w_evm_0x741cd4dabfc802db4167b4fc272e12b0a0181f12",
      "networkType": "evm",
      "address": "0x741Cd4DabFc802Db4167B4fc272E12b0a0181F12",
      "supportedChains": ["ethereum", "base", "polygon", "arbitrum", "optimism"],
      "isPrimary": true,
      "verifiedAt": 1732075250000
    }
  }
  ```

---

### 2.3 Remove Wallet
* **Endpoint:** `DELETE /api/st/wallet/:walletId`
* **Auth Required:** Yes
* **Response (200):**
  ```json
  { "success": true }
  ```

---

### 2.4 Set Primary Wallet
* **Endpoint:** `PATCH /api/st/wallet/:walletId`
* **Auth Required:** Yes
* **Response (200):**
  ```json
  { "success": true }
  ```

---

## 3. Resolver Endpoints

### 3.1 Universal Name Resolver
* **Endpoint:** `GET /api/st/resolve?name=:stName&network=:network`
* **Auth Required:** No
* **Example:** `GET /api/st/resolve?name=aman.st&network=base`
* **Response (200):**
  ```json
  {
    "success": true,
    "resolution": {
      "stName": "aman.st",
      "uid": "st_uid_6abf854a77232b0f688409d0",
      "network": "base",
      "address": "0x741Cd4DabFc802Db4167B4fc272E12b0a0181F12",
      "isPrimary": true,
      "verifiedAt": 1732075250000
    }
  }
  ```

---

### 3.2 List Supported Networks
* **Endpoint:** `GET /api/st/networks`
* **Auth Required:** No
* **Response (200):**
  ```json
  {
    "success": true,
    "networks": [
      { "id": "ethereum", "name": "Ethereum Mainnet", "networkType": "evm", "chainId": 1 },
      { "id": "base", "name": "Base", "networkType": "evm", "chainId": 8453 },
      { "id": "polygon", "name": "Polygon PoS", "networkType": "evm", "chainId": 137 }
    ]
  }
  ```
