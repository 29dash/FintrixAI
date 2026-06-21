# Blockchain & Security Module

## 1. Overview

This module adds blockchain-based security to the loan management system using Ethereum smart contracts on a local Ganache blockchain.

It stores:
- Loan approvals and rejections
- Financial transactions
- User KYC references
- Audit logs

All records stored on-chain are immutable and can be verified using cryptographic hashes.

### Technologies Used
- Solidity
- Truffle
- Ganache
- Web3.js
- Node.js
- Express.js

---

## 2. Project Structure

```txt
blockchain-module/
│
├── contracts/
│   ├── LoanRecord.sol
│   ├── TransactionLog.sol
│   ├── UserRecord.sol
│   └── AuditTrail.sol
│
├── migrations/
│   └── 1_deploy_contracts.js
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── utils/
│   └── middleware/
│
├── test/
├── scripts/
├── .env.example
├── package.json
├── truffle-config.js
└── README.md
```

---

## 3. Smart Contracts

### LoanRecord.sol
Stores loan approval and rejection records.

Functions:
- Record loan details
- Update loan status
- Retrieve loan information

---

### TransactionLog.sol
Stores immutable financial transaction logs.

Functions:
- Log transactions
- Retrieve transactions
- Verify transaction integrity

---

### UserRecord.sol
Stores hashed KYC and user profile references.

Functions:
- Register users
- Update KYC
- Verify KYC hashes

---

### AuditTrail.sol
Maintains a complete audit log of important system actions.

Examples:
- Loan approval
- Loan rejection
- KYC verification
- Credit score updates

---

## 4. Ganache and MetaMask Setup

### Step 1: Install Ganache

Download Ganache from:
https://trufflesuite.com/ganache/

Open Ganache and start a Quickstart workspace.

Default settings:
- RPC URL: `http://127.0.0.1:7545`
- Chain ID: `1337`

---

### Step 2: Install Truffle

```bash
npm install -g truffle
```

---

### Step 3: Install Project Dependencies

```bash
npm install
```

---

### Step 4: Compile Contracts

```bash
truffle compile
```

---

### Step 5: Deploy Contracts

```bash
truffle migrate --network development
```

After deployment, contract addresses will be displayed.

---

### Step 6: Configure Environment Variables

```bash
cp .env.example .env
```

Add deployed contract addresses inside `.env`.

Example:

```env
LOAN_RECORD_ADDRESS=
TX_LOG_ADDRESS=
USER_RECORD_ADDRESS=
AUDIT_TRAIL_ADDRESS=
```

---

### Step 7: Start Backend Server

```bash
npm start
```

Server runs at:

```txt
http://localhost:3001
```

---

### Step 8: Connect MetaMask (Optional)

Install MetaMask:
https://metamask.io/

Add a custom network:
- RPC URL: `http://127.0.0.1:7545`
- Chain ID: `1337`

Import a Ganache account private key into MetaMask.

---

## 5. API Examples

### Record a Loan

```http
POST /api/blockchain/loans/record
```

Example Request:

```json
{
  "loanId": 1001,
  "loanAmount": 500000,
  "status": "APPROVED"
}
```

---

### Verify a Loan

```http
GET /api/blockchain/loans/verify/1001
```

---

### Log a Transaction

```http
POST /api/blockchain/transactions/log
```

---

### Retrieve Audit Trail

```http
GET /api/blockchain/loans/audit/1001
```

---

## 6. Testing

### Run Smart Contract Tests

```bash
truffle test
```

---

### Run API Tests

```bash
npm run test:api
```

---

## 7. Security Features

| Feature | Description |
|---|---|
| Immutability | Blockchain records cannot be modified |
| Tamper Detection | Hash verification detects changes |
| Privacy | Only hashes stored on-chain |
| Auditability | All actions logged permanently |
| Access Control | Only owner can write records |

---

## 8. Common Errors

| Error | Solution |
|---|---|
| Cannot connect to Ganache | Start Ganache on port 7545 |
| Address not set | Deploy contracts and update `.env` |
| caller is not the owner | Use Ganache Account[0] |
| BUILD NOT FOUND | Run `truffle compile` |

---

## 9. Integration

Other modules can interact with this module using HTTP APIs.

Example:

```javascript
const response = await fetch(
  "http://localhost:3001/api/blockchain/loans/record",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      loanId: 1001,
      status: "APPROVED"
    })
  }
);
```
