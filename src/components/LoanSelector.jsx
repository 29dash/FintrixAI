import { useLoans } from "../state/useLoans";

function LoanSelector() {
  const { loans, selectedLoanId, selectLoan } = useLoans();

  if (loans.length < 2) return null;

  return (
    <label className="loan-selector">
      <span className="loan-selector__label">Viewing loan</span>
      <select value={selectedLoanId || ""} onChange={(event) => selectLoan(event.target.value)}>
        {loans.map((loan) => (
          <option key={loan._id} value={loan._id}>
            ₹{Number(loan.amount || 0).toLocaleString()} · {loan.status || "Pending"} · {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "No date"}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LoanSelector;
