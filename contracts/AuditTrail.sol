// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuditTrail
 * @dev Cryptographic audit trail for all system actions.
 *      Links every auditable action to a block, timestamp, and actor.
 *      Cannot be deleted or altered after writing.
 *      Member 4: Blockchain & Security Module.
 */
contract AuditTrail {

    enum ActionType {
        USER_REGISTRATION,
        LOAN_APPLICATION,
        LOAN_APPROVAL,
        LOAN_REJECTION,
        LOAN_DISBURSEMENT,
        REPAYMENT_MADE,
        KYC_SUBMITTED,
        KYC_VERIFIED,
        CREDIT_SCORE_UPDATED,
        ADMIN_ACTION
    }

    struct AuditEntry {
        uint256   entryId;
        ActionType actionType;
        uint256   relatedId;      // loanId, userId, or txId depending on context
        address   actor;          // Who performed the action
        bytes32   payloadHash;    // Hash of the full action payload
        string    note;           // Short human-readable description
        uint256   blockNumber;
        uint256   timestamp;
    }

    address public owner;
    uint256 public auditCount;

    AuditEntry[] private auditLog;

    // Indexed lookups
    mapping(uint256 => uint256[]) private auditByRelatedId;
    mapping(address => uint256[]) private auditByActor;

    event AuditEntryAdded(
        uint256   indexed entryId,
        ActionType indexed actionType,
        uint256   indexed relatedId,
        address   actor,
        uint256   blockNumber,
        uint256   timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "AuditTrail: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        auditCount = 0;
    }

    /**
     * @notice Record a new audit entry.
     * @param _actionType  Category of action performed
     * @param _relatedId   ID of the loan/user/transaction being audited
     * @param _actor       Ethereum address of the entity performing the action
     * @param _payloadHash keccak256 of the full request/response payload
     * @param _note        Short description of the audit event
     */
    function addAuditEntry(
        ActionType _actionType,
        uint256    _relatedId,
        address    _actor,
        bytes32    _payloadHash,
        string     memory _note
    ) external onlyOwner returns (uint256) {
        uint256 entryId = auditCount;

        auditLog.push(AuditEntry({
            entryId:     entryId,
            actionType:  _actionType,
            relatedId:   _relatedId,
            actor:       _actor,
            payloadHash: _payloadHash,
            note:        _note,
            blockNumber: block.number,
            timestamp:   block.timestamp
        }));

        auditByRelatedId[_relatedId].push(entryId);
        auditByActor[_actor].push(entryId);

        auditCount++;

        emit AuditEntryAdded(entryId, _actionType, _relatedId, _actor, block.number, block.timestamp);
        return entryId;
    }

    /**
     * @notice Retrieve a single audit entry by ID.
     */
    function getAuditEntry(uint256 _entryId) external view returns (AuditEntry memory) {
        require(_entryId < auditCount, "AuditTrail: entry does not exist");
        return auditLog[_entryId];
    }

    /**
     * @notice Get all audit entries for a specific loan/user/transaction ID.
     */
    function getAuditsByRelatedId(uint256 _relatedId) external view returns (uint256[] memory) {
        return auditByRelatedId[_relatedId];
    }

    /**
     * @notice Get all audit entries performed by a specific actor.
     */
    function getAuditsByActor(address _actor) external view returns (uint256[] memory) {
        return auditByActor[_actor];
    }

    /**
     * @notice Verify a specific audit entry's payload hash matches expected.
     *         Returns true = record is untampered.
     */
    function verifyAuditEntry(uint256 _entryId, bytes32 _expectedHash)
        external view returns (bool)
    {
        require(_entryId < auditCount, "AuditTrail: entry does not exist");
        return auditLog[_entryId].payloadHash == _expectedHash;
    }

    /**
     * @notice Get total number of audit entries.
     */
    function getTotalAuditEntries() external view returns (uint256) {
        return auditCount;
    }
}
