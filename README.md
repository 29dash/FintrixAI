# Member 4 — Blockchain & Security Module
## Loan Management System | College Project

---

## 1. Project Overview

This module implements the **blockchain and security layer** of a loan management system. It uses **Ethereum smart contracts** deployed on a **Ganache local blockchain** to create tamper-proof, auditable records of:

- Loan approvals and rejections
- Financial transactions (disbursements, repayments)
- User KYC references
- Complete audit trails

Every record written to the blockchain is **immutable** — it cannot be altered or deleted, even by the system admin. Integrity is verified by comparing keccak256 hashes of off-chain data with values stored on-chain.

**Tech Stack:** Solidity · Truffle · Ganache · Web3.js · Node.js · Express.js

---

## 2. Folder Structure

```
blockchain-module/
│
├── contracts/                  ← Solidity smart contracts
│   ├── LoanRecord.sol          ← Stores loan approval/rejection records
│   ├── TransactionLog.sol      ← Immutable append-only transaction log
│   ├── UserRecord.sol          ← Hashed user KYC + profile references
│   └── AuditTrail.sol          ← System-wide cryptographic audit trail
│
├── migrations/
│   └── 1_deploy_contracts.js   ← Truffle deployment script
│
├── backend/
│   ├── server.js               ← Express server (entry point)
│   ├── routes/
│   │   ├── loanRoutes.js       ← /api/blockchain/loans/*
│   │   ├── transactionRoutes.js← /api/blockchain/transactions/*
│   │   └── userRoutes.js       ← /api/blockchain/users/*
│   ├── utils/
│   │   ├── web3Provider.js     ← Web3 + Ganache connection singleton
│   │   ├── contractLoader.js   ← Loads compiled contract ABIs + instances
│   │   ├── blockchainLogger.js ← Core logging + verification functions
│   │   └── hashHelper.js       ← keccak256 hash helpers
│   └── middleware/
│       ├── requestLogger.js    ← Logs every API request to console
│       └── errorHandler.js     ← Global Express error handler
│
├── test/
│   ├── TestLoanRecord.js       ← Truffle unit tests for LoanRecord
│   └── TestTransactionLog.js   ← Truffle unit tests for TransactionLog
│
├── scripts/
│   ├── deployAndLog.js         ← Reads deployed addresses from build/
│   └── testAPI.js              ← End-to-end API integration test
│
├── config/
│   ├── truffle-config.js       ← Truffle network + compiler config
│   └── contractAddresses.js    ← Address constants (loaded from .env)
│
├── .env.example                ← Copy to .env and fill in values
├── package.json
└── README.md                   ← This file
```

---

## 3. Solidity Smart Contracts

### 3.1 LoanRecord.sol
Stores one record per loan. Records are written once and immutable.

| Function | Who calls it | Purpose |
|---|---|---|
| `recordLoan(...)` | Owner only | Write new loan approval/rejection |
| `updateLoanStatus(id, status)` | Owner only | Update status (e.g. PENDING → APPROVED) |
| `getLoan(id)` | Anyone | Read a loan record |
| `loanRecordExists(id)` | Anyone | Check if loan ID exists |
| `getLoansByApplicant(addr)` | Anyone | Get all loans for a wallet address |

### 3.2 TransactionLog.sol
Append-only log. Entries can never be modified or deleted.

| Function | Who calls it | Purpose |
|---|---|---|
| `logTransaction(...)` | Owner only | Append a new transaction entry |
| `getTransaction(index)` | Anyone | Read entry by index |
| `verifyTransaction(index, hash)` | Anyone | Returns true if payload hash matches |
| `getTransactionsByLoan(loanId)` | Anyone | Get all transaction indexes for a loan |

**TxType enum:** `0=DISBURSEMENT, 1=REPAYMENT, 2=APPLICATION, 3=STATUS_CHANGE, 4=AUDIT`

### 3.3 UserRecord.sol
Stores hashed KYC and profile fingerprints. **No raw PII is stored on-chain.**

| Function | Who calls it | Purpose |
|---|---|---|
| `registerUser(...)` | Owner only | Register user with hashed KYC |
| `updateKYC(id, hash, verified)` | Owner only | Update KYC hash after re-submission |
| `updateCreditScore(id, score)` | Owner only | Record new credit score |
| `getUser(id)` | Anyone | Read user record |
| `verifyKYC(id, hash)` | Anyone | Returns true if KYC hash matches |
| `verifyProfile(id, hash)` | Anyone | Returns true if profile hash matches |

### 3.4 AuditTrail.sol
System-wide audit log. Every important action across all modules is audited here.

**ActionType enum:**
```
0=USER_REGISTRATION  1=LOAN_APPLICATION  2=LOAN_APPROVAL
3=LOAN_REJECTION     4=LOAN_DISBURSEMENT 5=REPAYMENT_MADE
6=KYC_SUBMITTED      7=KYC_VERIFIED      8=CREDIT_SCORE_UPDATED
9=ADMIN_ACTION
```

---

## 4. MetaMask + Ganache Setup

### Step 1: Install Ganache

Download **Ganache GUI** from: https://trufflesuite.com/ganache/

Or install CLI:
```bash
npm install -g ganache
```

### Step 2: Start Ganache

**Option A — GUI:**
1. Open Ganache
2. Click "New Workspace" → "Quickstart Ethereum"
3. Default settings: RPC Server at `http://127.0.0.1:7545`, Network ID `5777`
4. You will see 10 pre-funded accounts — **Account[0] will be the contract owner**

**Option B — CLI:**
```bash
ganache --port 7545 --networkId 5777 --accounts 10 --defaultBalanceEther 100
```

### Step 3: Install Truffle
```bash
npm install -g truffle
```

### Step 4: Deploy Contracts

```bash
cd blockchain-module

# Copy truffle config to project root
cp config/truffle-config.js truffle-config.js

# Compile all .sol files
truffle compile

# Deploy to Ganache
truffle migrate --network development
```

**Sample migration output:**
```
Deploying LoanRecord...
  LoanRecord deployed at: 0x3Aa5ebB10DC797CAC828524e59A333d0A371443a
Deploying TransactionLog...
  TransactionLog deployed at: 0x59b670e9fA9D0A427751Af201D676719a970857b
Deploying UserRecord...
  UserRecord deployed at: 0x4ed7c70F96B99ef45e4E4C4dDB5ab929B80B4b28
Deploying AuditTrail...
  AuditTrail deployed at: 0x2902D06C59F38DAA20fd5A5CcD1f4d5F7c7b123e

=== Deployment Complete ===
Copy these addresses into your .env file:
LOAN_RECORD_ADDRESS=0x3Aa5ebB10DC797CAC828524e59A333d0A371443a
TX_LOG_ADDRESS=0x59b670e9fA9D0A427751Af201D676719a970857b
USER_RECORD_ADDRESS=0x4ed7c70F96B99ef45e4E4C4dDB5ab929B80B4b28
AUDIT_TRAIL_ADDRESS=0x2902D06C59F38DAA20fd5A5CcD1f4d5F7c7b123e
```

### Step 5: Configure .env

```bash
cp .env.example .env
# Paste the contract addresses from migration output into .env
```

### Step 6: MetaMask Connection (Optional — for Frontend Team)

MetaMask connects the browser/frontend to the same Ganache network:

1. Install MetaMask browser extension: https://metamask.io
2. Open MetaMask → Networks → Add Network manually:
   - **Network Name:** Ganache Local
   - **RPC URL:** `http://127.0.0.1:7545`
   - **Chain ID:** `1337` (or `5777` depending on your Ganache version)
   - **Currency Symbol:** ETH
3. Import a Ganache account:
   - In Ganache GUI, click the key icon next to Account[0] to reveal the private key
   - In MetaMask → Import Account → paste the private key
4. MetaMask will now show the account with 100 ETH (Ganache test ether)

**Frontend team** can use this MetaMask connection + the contract ABIs from `build/contracts/` to interact with the blockchain from a browser using ethers.js or web3.js directly.

---

## 5. Installation and Run Instructions

```bash
# 1. Enter the module directory
cd blockchain-module

# 2. Install Node.js dependencies
npm install

# 3. Make sure Ganache is running (GUI or CLI)

# 4. Copy Truffle config to root
cp config/truffle-config.js truffle-config.js

# 5. Compile and deploy contracts
npm run compile
npm run migrate

# 6. Get deployed addresses
node scripts/deployAndLog.js

# 7. Populate .env with those addresses
cp .env.example .env
# (Edit .env manually with the printed addresses)

# 8. Start the backend server
npm start
# Server runs on http://localhost:3001

# 9. (Optional) Watch for file changes during development
npm run dev
```

---

## 6. How Record Logging Works

```
Backend Team's Loan System
        │
        │  POST /api/blockchain/loans/record
        │  { loanId, applicantAddress, status, amount, ... }
        ▼
  blockchainLogger.js
        │
        ├─ Validates input
        ├─ Calls LoanRecord.recordLoan() → writes to Ethereum
        ├─ Computes keccak256 hash of payload
        ├─ Calls AuditTrail.addAuditEntry() → audit record written
        │
        ▼
  Returns to caller:
  {
    transaction_hash:    "0x98fa...",
    block_number:        145,
    verification_status: "Verified",
    audit_status:        "Loan record for ID 1001 stored on-chain"
  }
```

The same flow applies to `logTransaction()` and `logUserRecord()`.

---

## 7. Record Verification Logic

Verification works by recomputing the keccak256 hash of the original off-chain payload and comparing it to the hash stored on the blockchain:

```
Caller provides:
  txIndex = 0
  originalPayload = { loanId: 1001, initiator: "0x...", amount: 500000, ... }

verifyTransactionIntegrity() does:
  1. Re-computes: hash = keccak256(JSON.stringify(sortedPayload))
  2. Calls TransactionLog.verifyTransaction(0, hash) on-chain
  3. Contract checks: storedHash == providedHash
  4. Returns true (Verified) or false (TAMPERED)
```

If **any field** in the payload was changed — even by one character — the hash will not match and the system will flag it as tampered.

---

## 8. Sample API Request / Response

### Record a Loan Approval
```
POST http://localhost:3001/api/blockchain/loans/record
Content-Type: application/json

{
  "loanId": 1001,
  "applicantAddress": "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
  "applicantName": "Alice Sharma",
  "loanAmount": 500000,
  "interestRate": 8.5,
  "tenureMonths": 36,
  "status": "APPROVED"
}
```
**Response:**
```json
{
  "transaction_hash": "0x98fa3c2d4e1b9a6f7c8d0e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
  "block_number": 145,
  "verification_status": "Verified",
  "audit_status": "Loan record for ID 1001 stored on-chain",
  "gas_used": 185432
}
```

### Verify a Loan Record
```
GET http://localhost:3001/api/blockchain/loans/verify/1001
```
**Response:**
```json
{
  "verification_status": "Verified",
  "audit_status": "Record retrieved from immutable blockchain storage",
  "record": {
    "loanId": 1001,
    "applicantAddress": "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
    "applicantName": "Alice Sharma",
    "loanAmount": 500000,
    "interestRate": 8.5,
    "tenureMonths": 36,
    "status": "APPROVED",
    "timestamp": "2024-11-15T10:30:00.000Z"
  }
}
```

### Log a Transaction
```
POST http://localhost:3001/api/blockchain/transactions/log
Content-Type: application/json

{
  "loanId": 1001,
  "initiator": "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
  "recipient": "0xBankAddress0000000000000000000000000000000",
  "amount": 500000,
  "txType": 0,
  "description": "Loan 1001 disbursement"
}
```
**Response:**
```json
{
  "transaction_hash": "0x5d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3",
  "block_number": 146,
  "verification_status": "Verified",
  "audit_status": "Transaction 0 logged immutably",
  "gas_used": 172310,
  "tx_index": 0,
  "payload_hash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
}
```

### Verify Transaction Integrity (Tamper Detection)
```
POST http://localhost:3001/api/blockchain/transactions/verify
Content-Type: application/json

{
  "txIndex": 0,
  "originalPayload": {
    "loanId": 1001,
    "initiator": "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
    "recipient": "0xBankAddress0000000000000000000000000000000",
    "amount": 999999,
    "txType": 0,
    "description": "Loan 1001 disbursement"
  }
}
```
**Response (tampered amount detected):**
```json
{
  "tx_index": 0,
  "verification_status": "TAMPERED — Hashes do not match!",
  "audit_status": "WARNING: Payload hash mismatch — possible data tampering",
  "on_chain_hash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  "recomputed_hash": "0x2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3",
  "timestamp": "2024-11-15T10:30:15.000Z"
}
```

### Retrieve Audit Trail
```
GET http://localhost:3001/api/blockchain/loans/audit/1001
```
**Response:**
```json
{
  "loanId": 1001,
  "total_entries": 3,
  "audit_trail": [
    {
      "entryId": 0,
      "actionType": 2,
      "relatedId": 1001,
      "actor": "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
      "note": "Loan 1001 recorded with status APPROVED",
      "blockNumber": 145,
      "timestamp": "2024-11-15T10:30:00.000Z"
    },
    {
      "entryId": 1,
      "actionType": 4,
      "relatedId": 1001,
      "actor": "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
      "note": "Transaction 0 logged for loan 1001",
      "blockNumber": 146,
      "timestamp": "2024-11-15T10:30:15.000Z"
    }
  ]
}
```

---

## 9. Testing Instructions

### A. Smart Contract Unit Tests (Truffle)
```bash
# Make sure Ganache is running and contracts are deployed
truffle test

# Expected output:
#   Contract: LoanRecord
#     ✓ deploys and sets owner correctly
#     ✓ records a new loan
#     ✓ confirms loanRecordExists = true for recorded loan
#     ✓ returns false for non-existent loan
#     ✓ rejects duplicate loan IDs
#     ✓ updates loan status
#     ✓ rejects non-owner from recording
#
#   Contract: TransactionLog
#     ✓ deploys correctly
#     ✓ logs a transaction
#     ✓ retrieves a logged transaction
#     ✓ verifies transaction hash correctly
#     ✓ detects tampered payload
```

### B. End-to-End API Test
```bash
# Terminal 1: start the server
npm start

# Terminal 2: run the test script
npm run test:api
```

### C. Manual Testing with curl

```bash
# Record a loan
curl -X POST http://localhost:3001/api/blockchain/loans/record \
  -H "Content-Type: application/json" \
  -d '{"loanId":1,"applicantAddress":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","applicantName":"Test User","loanAmount":100000,"interestRate":9.5,"tenureMonths":24,"status":"APPROVED"}'

# Verify it
curl http://localhost:3001/api/blockchain/loans/verify/1

# Check audit trail
curl http://localhost:3001/api/blockchain/loans/audit/1
```

### D. Verify in Ganache GUI
- Open Ganache → **Transactions** tab
- Every API call that writes to the blockchain appears here with tx hash and block number
- Click any transaction to see the full detail

---

## 10. Final Notes

### How Everything Works Together

```
[Other Modules' Backends]
        │
        │ HTTP POST/GET
        ▼
[Express Server — port 3001]
        │
        ├── loanRoutes.js ──────────────► LoanRecord.sol    (on Ganache)
        ├── transactionRoutes.js ───────► TransactionLog.sol (on Ganache)
        └── userRoutes.js ──────────────► UserRecord.sol     (on Ganache)
                                          AuditTrail.sol     (on Ganache)
```

### Key Security Properties

| Property | How it's achieved |
|---|---|
| **Immutability** | Blockchain records cannot be edited after writing |
| **Tamper detection** | keccak256 hash of payload stored on-chain; recomputed on verification |
| **Non-repudiation** | Every record includes the actor's Ethereum address |
| **Privacy** | PII never stored on-chain; only its cryptographic hash |
| **Auditability** | AuditTrail contract logs every system action permanently |
| **Access control** | Only the deployer (owner) account can write records |

### Integration for Other Team Members

Your backend just needs to make HTTP calls to this module:

```javascript
// Example: from Member 2's loan approval backend
const response = await fetch("http://localhost:3001/api/blockchain/loans/record", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    loanId: approvedLoan.id,
    applicantAddress: user.walletAddress,
    applicantName: user.name,
    loanAmount: approvedLoan.amount,
    interestRate: approvedLoan.rate,
    tenureMonths: approvedLoan.tenure,
    status: "APPROVED"
  })
});
const blockchainResult = await response.json();
// Store blockchainResult.transaction_hash in your own database
```

### Common Errors and Fixes

| Error | Fix |
|---|---|
| `Cannot connect to Ganache` | Start Ganache and check port (7545 GUI / 8545 CLI) |
| `Address for "LoanRecord" is not set` | Run `truffle migrate` then update `.env` |
| `caller is not the owner` | Contract was deployed from a different account; use Account[0] |
| `loan ID already recorded` | LoanIds must be unique; check if already stored |
| `BUILD NOT FOUND` | Run `truffle compile` first |
