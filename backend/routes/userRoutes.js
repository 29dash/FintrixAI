/**
 * userRoutes.js
 * REST API endpoints for blockchain user record operations.
 * Base path: /api/blockchain/users
 */

const express = require("express");
const router  = express.Router();
const { logUserRecord } = require("../utils/blockchainLogger");
const { getContracts }  = require("../utils/contractLoader");
const { hashPayload, toBytes32 } = require("../utils/hashHelper");

// ─── POST /api/blockchain/users/register ─────────────────────
// Registers a user's hashed KYC reference on-chain.
// Body: { userId, walletAddress, kycData, profileData, creditScore, kycVerified }
router.post("/register", async (req, res) => {
  try {
    const { userId, walletAddress, kycData, profileData, creditScore, kycVerified } = req.body;

    if (!userId || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields: userId, walletAddress" });
    }

    const result = await logUserRecord({
      userId:       Number(userId),
      walletAddress,
      kycData:      kycData     || {},
      profileData:  profileData || {},
      creditScore:  Number(creditScore) || 0,
      kycVerified:  Boolean(kycVerified),
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error("[userRoutes] /register error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/blockchain/users/verify-kyc ────────────────────
// Verifies the stored KYC hash matches the provided data.
// Body: { userId, kycData }
router.post("/verify-kyc", async (req, res) => {
  try {
    const { userId, kycData } = req.body;
    if (!userId || !kycData) {
      return res.status(400).json({ error: "Missing required fields: userId, kycData" });
    }

    const { UserRecord } = await getContracts();
    const expectedHash   = toBytes32(hashPayload(kycData));
    const isValid        = await UserRecord.methods.verifyKYC(Number(userId), expectedHash).call();

    return res.status(200).json({
      userId,
      verification_status: isValid ? "Verified" : "FAILED — KYC data does not match on-chain record",
      audit_status:        isValid
        ? "KYC integrity confirmed"
        : "WARNING: KYC hash mismatch",
    });
  } catch (err) {
    console.error("[userRoutes] /verify-kyc error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/blockchain/users/:userId ────────────────────────
// Fetches a user's on-chain record.
router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { UserRecord } = await getContracts();
    const user = await UserRecord.methods.getUser(userId).call();

    return res.status(200).json({
      verification_status: "Verified",
      audit_status: "User record retrieved from blockchain",
      record: {
        userId:        Number(user.userId),
        walletAddress: user.walletAddress,
        kycHash:       user.kycHash,
        profileHash:   user.profileHash,
        creditScore:   Number(user.creditScore),
        kycVerified:   user.kycVerified,
        createdAt:     new Date(Number(user.createdAt) * 1000).toISOString(),
        lastUpdated:   new Date(Number(user.lastUpdated) * 1000).toISOString(),
      },
    });
  } catch (err) {
    console.error("[userRoutes] GET /:userId error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
