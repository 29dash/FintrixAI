// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TransactionLog
 * @dev Immutable append-only on-chain log for every financial transaction.
 *      No deletions, no updates — tamper-proof by design.
 *      Member 4: Blockchain & Security Module.
 */
contract TransactionLog {

    enum TxType { LOAN_DISBURSEMENT, REPAYMENT, APPLICATION, STATUS_CHANGE, AUDIT }

    struct Transaction {
        uint256 txIndex;
        uint256 loanId;
        address initiator;
        address recipient;
        uint256 amount;
        TxType  txType;
        string  description;
        bytes32 dataHash;    // keccak256 of off-chain payload for integrity check
        uint256 timestamp;
    }

    address public owner;
    uint256 public txCount;

    Transaction[] private txLog;
    mapping(uint256 => uint256[]) private loanTransactions; // loanId -> txIndexes

    event TransactionLogged(
        uint256 indexed txIndex,
        uint256 indexed loanId,
        address indexed initiator,
        TxType  txType,
        uint256 amount,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "TransactionLog: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        txCount = 0;
    }

    /**
     * @notice Append a new transaction to the immutable log.
     * @param _loanId      Associated loan (use 0 if N/A)
     * @param _initiator   Address that triggered the action
     * @param _recipient   Affected address
     * @param _amount      Monetary amount (use 0 for non-monetary)
     * @param _txType      Enum: 0=DISBURSEMENT,1=REPAYMENT,2=APPLICATION,3=STATUS,4=AUDIT
     * @param _description Human-readable note
     * @param _dataHash    keccak256 hash of the full off-chain data payload
     */
    function logTransaction(
        uint256 _loanId,
        address _initiator,
        address _recipient,
        uint256 _amount,
        TxType  _txType,
        string  memory _description,
        bytes32 _dataHash
    ) external onlyOwner returns (uint256) {
        uint256 index = txCount;

        txLog.push(Transaction({
            txIndex:     index,
            loanId:      _loanId,
            initiator:   _initiator,
            recipient:   _recipient,
            amount:      _amount,
            txType:      _txType,
            description: _description,
            dataHash:    _dataHash,
            timestamp:   block.timestamp
        }));

        if (_loanId != 0) {
            loanTransactions[_loanId].push(index);
        }

        txCount++;

        emit TransactionLogged(index, _loanId, _initiator, _txType, _amount, block.timestamp);
        return index;
    }

    /**
     * @notice Retrieve a transaction entry by index.
     */
    function getTransaction(uint256 _index) external view returns (Transaction memory) {
        require(_index < txCount, "TransactionLog: index out of bounds");
        return txLog[_index];
    }

    /**
     * @notice Get all transaction indexes for a specific loan.
     */
    function getTransactionsByLoan(uint256 _loanId) external view returns (uint256[] memory) {
        return loanTransactions[_loanId];
    }

    /**
     * @notice Verify that an on-chain dataHash matches a provided payload hash.
     *         Returns true if the record is untampered.
     */
    function verifyTransaction(uint256 _index, bytes32 _expectedHash)
        external view returns (bool)
    {
        require(_index < txCount, "TransactionLog: index out of bounds");
        return txLog[_index].dataHash == _expectedHash;
    }

    /**
     * @notice Get the total number of logged transactions.
     */
    function getTotalTransactions() external view returns (uint256) {
        return txCount;
    }
}
