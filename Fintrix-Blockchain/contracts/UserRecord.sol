// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title UserRecord
 * @dev Stores tamper-proof references to user KYC and profile data.
 *      Actual PII is NOT stored on-chain — only hashed references are stored.
 *      Member 4: Blockchain & Security Module.
 */
contract UserRecord {

    struct User {
        uint256 userId;
        address walletAddress;
        bytes32 kycHash;          // keccak256 of off-chain KYC document
        bytes32 profileHash;      // keccak256 of profile data snapshot
        uint256 creditScore;      // Credit score at time of recording
        bool    kycVerified;
        uint256 createdAt;
        uint256 lastUpdated;
        bool    exists;
    }

    address public owner;
    uint256 public totalUsers;

    mapping(uint256 => User)    private users;
    mapping(address => uint256) private addressToUserId;

    event UserRegistered(
        uint256 indexed userId,
        address indexed walletAddress,
        bool    kycVerified,
        uint256 timestamp
    );

    event UserKYCUpdated(
        uint256 indexed userId,
        bytes32 newKycHash,
        bool    verified,
        uint256 timestamp
    );

    event CreditScoreUpdated(
        uint256 indexed userId,
        uint256 oldScore,
        uint256 newScore,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "UserRecord: not owner");
        _;
    }

    modifier userExists(uint256 _userId) {
        require(users[_userId].exists, "UserRecord: user does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        totalUsers = 0;
    }

    /**
     * @notice Register a new user record on-chain.
     * @param _userId       Unique user ID from the backend
     * @param _wallet       User's MetaMask wallet address
     * @param _kycHash      keccak256 hash of KYC document bundle
     * @param _profileHash  keccak256 hash of user profile snapshot
     * @param _creditScore  Credit score at registration time
     * @param _kycVerified  Whether KYC is already verified
     */
    function registerUser(
        uint256 _userId,
        address _wallet,
        bytes32 _kycHash,
        bytes32 _profileHash,
        uint256 _creditScore,
        bool    _kycVerified
    ) external onlyOwner {
        require(!users[_userId].exists, "UserRecord: user already registered");
        require(_wallet != address(0), "UserRecord: invalid wallet address");

        users[_userId] = User({
            userId:        _userId,
            walletAddress: _wallet,
            kycHash:       _kycHash,
            profileHash:   _profileHash,
            creditScore:   _creditScore,
            kycVerified:   _kycVerified,
            createdAt:     block.timestamp,
            lastUpdated:   block.timestamp,
            exists:        true
        });

        addressToUserId[_wallet] = _userId;
        totalUsers++;

        emit UserRegistered(_userId, _wallet, _kycVerified, block.timestamp);
    }

    /**
     * @notice Update KYC hash when user re-submits documents.
     */
    function updateKYC(uint256 _userId, bytes32 _newKycHash, bool _verified)
        external onlyOwner userExists(_userId)
    {
        users[_userId].kycHash     = _newKycHash;
        users[_userId].kycVerified = _verified;
        users[_userId].lastUpdated = block.timestamp;

        emit UserKYCUpdated(_userId, _newKycHash, _verified, block.timestamp);
    }

    /**
     * @notice Update credit score for an existing user.
     */
    function updateCreditScore(uint256 _userId, uint256 _newScore)
        external onlyOwner userExists(_userId)
    {
        uint256 old = users[_userId].creditScore;
        users[_userId].creditScore  = _newScore;
        users[_userId].lastUpdated  = block.timestamp;

        emit CreditScoreUpdated(_userId, old, _newScore, block.timestamp);
    }

    /**
     * @notice Retrieve full user record.
     */
    function getUser(uint256 _userId) external view userExists(_userId) returns (User memory) {
        return users[_userId];
    }

    /**
     * @notice Look up user ID from wallet address.
     */
    function getUserIdByWallet(address _wallet) external view returns (uint256) {
        uint256 uid = addressToUserId[_wallet];
        require(users[uid].exists, "UserRecord: no user for this wallet");
        return uid;
    }

    /**
     * @notice Verify the KYC hash matches the stored record — integrity check.
     */
    function verifyKYC(uint256 _userId, bytes32 _expectedHash)
        external view userExists(_userId) returns (bool)
    {
        return users[_userId].kycHash == _expectedHash;
    }

    /**
     * @notice Verify user profile hash integrity.
     */
    function verifyProfile(uint256 _userId, bytes32 _expectedHash)
        external view userExists(_userId) returns (bool)
    {
        return users[_userId].profileHash == _expectedHash;
    }
}
