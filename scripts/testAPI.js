/**
 * testAPI.js
 * Manual API integration test — runs through a complete scenario:
 *   1. Register a user
 *   2. Record a loan
 *   3. Log a disbursement transaction
 *   4. Verify the loan record
 *   5. Verify transaction integrity
 *   6. Retrieve audit trail
 *
 * Prerequisites:
 *   - Ganache running
 *   - Contracts deployed (truffle migrate)
 *   - .env file populated
 *   - Server running: node backend/server.js
 *
 * Run: node scripts/testAPI.js
 */

const BASE_URL = "http://localhost:3001/api/blockchain";

async function post(path, body) {
  const res  = await fetch(`${BASE_URL}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  return res.json();
}

function log(label, data) {
  console.log(`\n${"─".repeat(55)}`);
  console.log(`  ${label}`);
  console.log(`${"─".repeat(55)}`);
  console.log(JSON.stringify(data, null, 2));
}

async function runTests() {
  console.log("\n╔═══════════════════════════════════════════════════╗");
  console.log("║   Blockchain Module — API Integration Test Suite  ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  // ── Step 1: Register User ──────────────────────────────────
  const userResult = await post("/users/register", {
    userId:       101,
    walletAddress: "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6", // example address
    kycData:      { name: "Alice Sharma", dob: "1990-05-15", pan: "ABCDE1234F" },
    profileData:  { income: 800000, employer: "TechCorp", city: "Bengaluru" },
    creditScore:  780,
    kycVerified:  true,
  });
  log("1. REGISTER USER", userResult);

  // ── Step 2: Record Loan ────────────────────────────────────
  const loanResult = await post("/loans/record", {
    loanId:           1001,
    applicantAddress: "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
    applicantName:    "Alice Sharma",
    loanAmount:       500000,
    interestRate:     8.5,
    tenureMonths:     36,
    status:           "APPROVED",
  });
  log("2. RECORD LOAN APPROVAL", loanResult);

  // ── Step 3: Log Disbursement Transaction ───────────────────
  const txResult = await post("/transactions/log", {
    loanId:      1001,
    initiator:   "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
    recipient:   "0xBankAddress0000000000000000000000000000000",
    amount:      500000,
    txType:      0,       // LOAN_DISBURSEMENT
    description: "Loan 1001 disbursement to Alice Sharma's account",
  });
  log("3. LOG DISBURSEMENT TRANSACTION", txResult);

  // ── Step 4: Verify Loan Record ─────────────────────────────
  const verifyLoan = await get("/loans/verify/1001");
  log("4. VERIFY LOAN RECORD", verifyLoan);

  // ── Step 5: Verify Transaction Integrity ───────────────────
  if (txResult.tx_index !== undefined) {
    const verifyTx = await post("/transactions/verify", {
      txIndex: txResult.tx_index,
      originalPayload: {
        loanId:      1001,
        initiator:   "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
        recipient:   "0xBankAddress0000000000000000000000000000000",
        amount:      500000,
        txType:      0,
        description: "Loan 1001 disbursement to Alice Sharma's account",
      },
    });
    log("5. VERIFY TRANSACTION INTEGRITY", verifyTx);
  }

  // ── Step 6: Audit Trail ────────────────────────────────────
  const audit = await get("/loans/audit/1001");
  log("6. AUDIT TRAIL FOR LOAN 1001", audit);

  // ── Step 7: Simulate Tamper Detection ─────────────────────
  if (txResult.tx_index !== undefined) {
    const tampered = await post("/transactions/verify", {
      txIndex: txResult.tx_index,
      originalPayload: {
        loanId:      1001,
        initiator:   "0xC0f3D0b4A7E1c2F3B5E6D7A8B9C0E1F2A3B4C5D6",
        recipient:   "0xBankAddress0000000000000000000000000000000",
        amount:      999999, // TAMPERED: changed amount!
        txType:      0,
        description: "Loan 1001 disbursement to Alice Sharma's account",
      },
    });
    log("7. TAMPER DETECTION TEST (amount modified)", tampered);
  }

  console.log("\n✅  Test suite complete.\n");
}

runTests().catch((err) => {
  console.error("\n❌  Test failed:", err.message);
  process.exit(1);
});
