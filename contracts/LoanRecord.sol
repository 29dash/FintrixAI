// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LoanRecord
 * @dev Stores tamper-proof loan approval records on-chain.
 *      Each loan record is immutable once written.
 *      Part of the Blockchain & Security Module — Member 4.
 */
contract LoanRecord {

    struct Loan {
        uint256 loanId;
        address applicantAddress;
        string  applicantName;
        uint256 loanAmount;
        uint256 interestRate;    // multiplied by 100, e.g. 850 = 8.50%
        uint256 tenureMonths;
        string  status;          // "APPROVED" | "REJECTED" | "PENDING"
        uint256 timestamp;
        bool    exists;
    }

    address public owner;
    uint256 public totalLoans;

    mapping(uint256 => Loan) private loans;
    mapping(address => uint256[]) private userLoans;

    event LoanRecorded(
        uint256 indexed loanId,
        address indexed applicant,
        string  status,
        uint256 loanAmount,
        uint256 timestamp
    );

    event LoanStatusUpdated(
        uint256 indexed loanId,
        string  oldStatus,
        string  newStatus,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "LoanRecord: caller is not the owner");
        _;
    }

    modifier loanExists(uint256 _loanId) {
        require(loans[_loanId].exists, "LoanRecord: loan ID does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        totalLoans = 0;
    }

    function recordLoan(
        uint256 _loanId,
        address _applicant,
        string  memory _applicantName,
        uint256 _loanAmount,
        uint256 _interestRate,
        uint256 _tenureMonths,
        string  memory _status
    ) external onlyOwner {
        require(!loans[_loanId].exists, "LoanRecord: loan ID already recorded");
        require(_applicant != address(0), "LoanRecord: invalid applicant address");

        loans[_loanId] = Loan({
            loanId:           _loanId,
            applicantAddress: _applicant,
            applicantName:    _applicantName,
            loanAmount:       _loanAmount,
            interestRate:     _interestRate,
            tenureMonths:     _tenureMonths,
            status:           _status,
            timestamp:        block.timestamp,
            exists:           true
        });

        userLoans[_applicant].push(_loanId);
        totalLoans++;

        emit LoanRecorded(_loanId, _applicant, _status, _loanAmount, block.timestamp);
    }

    function updateLoanStatus(uint256 _loanId, string memory _newStatus)
        external onlyOwner loanExists(_loanId)
    {
        string memory oldStatus = loans[_loanId].status;
        loans[_loanId].status = _newStatus;
        emit LoanStatusUpdated(_loanId, oldStatus, _newStatus, block.timestamp);
    }

    function getLoan(uint256 _loanId)
        external view loanExists(_loanId)
        returns (Loan memory)
    {
        return loans[_loanId];
    }

    function loanRecordExists(uint256 _loanId) external view returns (bool) {
        return loans[_loanId].exists;
    }

    function getLoansByApplicant(address _applicant)
        external view returns (uint256[] memory)
    {
        return userLoans[_applicant];
    }
}
